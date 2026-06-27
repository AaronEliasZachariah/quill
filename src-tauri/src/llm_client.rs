use crate::settings::PostProcessProvider;
use log::debug;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE, REFERER, USER_AGENT};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct JsonSchema {
    name: String,
    strict: bool,
    schema: Value,
}

#[derive(Debug, Serialize)]
struct ResponseFormat {
    #[serde(rename = "type")]
    format_type: String,
    json_schema: JsonSchema,
}

#[derive(Debug, Serialize, Clone, Default)]
pub struct ReasoningConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effort: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude: Option<bool>,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<ResponseFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reasoning_effort: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    reasoning: Option<ReasoningConfig>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatMessageResponse,
}

#[derive(Debug, Deserialize)]
struct ChatMessageResponse {
    content: Option<String>,
}

/// Build headers for API requests based on provider type
fn build_headers(provider: &PostProcessProvider, api_key: &str) -> Result<HeaderMap, String> {
    let mut headers = HeaderMap::new();

    // Common headers
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(
        REFERER,
        HeaderValue::from_static("https://github.com/cjpais/Handy"),
    );
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Handy/1.0 (+https://github.com/cjpais/Handy)"),
    );
    headers.insert("X-Title", HeaderValue::from_static("Quill"));

    // Provider-specific auth headers
    if !api_key.is_empty() {
        if provider.id == "anthropic" {
            headers.insert(
                "x-api-key",
                HeaderValue::from_str(api_key)
                    .map_err(|e| format!("Invalid API key header value: {}", e))?,
            );
            headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));
        } else {
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(&format!("Bearer {}", api_key))
                    .map_err(|e| format!("Invalid authorization header value: {}", e))?,
            );
        }
    }

    Ok(headers)
}

/// Create an HTTP client with provider-specific headers
fn create_client(provider: &PostProcessProvider, api_key: &str) -> Result<reqwest::Client, String> {
    let headers = build_headers(provider, api_key)?;
    reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

/// Send a chat completion request to an OpenAI-compatible API
/// Returns Ok(Some(content)) on success, Ok(None) if response has no content,
/// or Err on actual errors (HTTP, parsing, etc.)
/// Kept for parity with upstream; handy-pro's Pro path uses the system-prompt variant.
#[allow(dead_code)]
pub async fn send_chat_completion(
    provider: &PostProcessProvider,
    api_key: String,
    model: &str,
    prompt: String,
    reasoning_effort: Option<String>,
    reasoning: Option<ReasoningConfig>,
) -> Result<Option<String>, String> {
    send_chat_completion_with_schema(
        provider,
        api_key,
        model,
        prompt,
        None,
        None,
        reasoning_effort,
        reasoning,
    )
    .await
}

/// Send a chat completion request with structured output support
/// When json_schema is provided, uses structured outputs mode
/// system_prompt is used as the system message when provided
/// reasoning_effort sets the OpenAI-style top-level field (e.g., "none", "low", "medium", "high")
/// reasoning sets the OpenRouter-style nested object (effort + exclude)
pub async fn send_chat_completion_with_schema(
    provider: &PostProcessProvider,
    api_key: String,
    model: &str,
    user_content: String,
    system_prompt: Option<String>,
    json_schema: Option<Value>,
    reasoning_effort: Option<String>,
    reasoning: Option<ReasoningConfig>,
) -> Result<Option<String>, String> {
    let base_url = provider.base_url.trim_end_matches('/');
    let url = format!("{}/chat/completions", base_url);

    debug!("Sending chat completion request to: {}", url);

    let client = create_client(provider, &api_key)?;

    // Build messages vector
    let mut messages = Vec::new();

    // Add system prompt if provided
    if let Some(system) = system_prompt {
        messages.push(ChatMessage {
            role: "system".to_string(),
            content: system,
        });
    }

    // Add user message
    messages.push(ChatMessage {
        role: "user".to_string(),
        content: user_content,
    });

    // Build response_format if schema is provided
    let response_format = json_schema.map(|schema| ResponseFormat {
        format_type: "json_schema".to_string(),
        json_schema: JsonSchema {
            name: "transcription_output".to_string(),
            strict: true,
            schema,
        },
    });

    let request_body = ChatCompletionRequest {
        model: model.to_string(),
        messages,
        response_format,
        reasoning_effort,
        reasoning,
    };

    let response = client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Failed to read error response".to_string());
        return Err(format!(
            "API request failed with status {}: {}",
            status, error_text
        ));
    }

    let completion: ChatCompletionResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse API response: {}", e))?;

    Ok(completion
        .choices
        .first()
        .and_then(|choice| choice.message.content.clone()))
}

/// Fetch available models from an OpenAI-compatible API
/// Returns a list of model IDs
pub async fn fetch_models(
    provider: &PostProcessProvider,
    api_key: String,
) -> Result<Vec<String>, String> {
    let base_url = provider.base_url.trim_end_matches('/');
    let url = format!("{}/models", base_url);

    debug!("Fetching models from: {}", url);

    let client = create_client(provider, &api_key)?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch models: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Model list request failed ({}): {}",
            status, error_text
        ));
    }

    let parsed: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut models = Vec::new();

    // Handle OpenAI format: { data: [ { id: "..." }, ... ] }
    if let Some(data) = parsed.get("data").and_then(|d| d.as_array()) {
        for entry in data {
            if let Some(id) = entry.get("id").and_then(|i| i.as_str()) {
                models.push(id.to_string());
            } else if let Some(name) = entry.get("name").and_then(|n| n.as_str()) {
                models.push(name.to_string());
            }
        }
    }
    // Handle array format: [ "model1", "model2", ... ]
    else if let Some(array) = parsed.as_array() {
        for entry in array {
            if let Some(model) = entry.as_str() {
                models.push(model.to_string());
            }
        }
    }

    // The /v1/models endpoint lists *every* model the key can see — embeddings,
    // TTS, Whisper, image, moderation, etc. — and there's no capability flag to
    // filter by (confirmed against OpenAI's docs). Post-processing only needs
    // chat-capable LLMs, so we drop ids that match well-known non-chat families.
    //
    // This is a denylist on purpose, not an allowlist: the "custom" provider
    // points at arbitrary OpenAI-compatible endpoints (Ollama, LM Studio,
    // OpenRouter, …) where chat models are named llama/qwen/mistral/etc., so an
    // allowlist would wrongly hide them. We're careful NOT to deny substrings
    // that appear in real chat models — e.g. "search" (gpt-4o-search-preview),
    // "vision" (gpt-4-vision-preview) and "instruct" (…-instruct) stay allowed.
    let kept = filter_chat_models(models);
    Ok(kept)
}

/// Non-chat model families matched case-insensitively as a *substring* of the
/// model id. These are stems that legitimately appear inside longer non-chat ids
/// (e.g. "embed" inside "text-embedding-3-small"), and which don't occur inside
/// real chat model names — so a plain substring match is safe.
const NON_CHAT_SUBSTRING_MARKERS: &[&str] = &[
    "embed",          // text-embedding-3-*, nomic-embed-text, …
    "tts",            // tts-1, gpt-4o-mini-tts
    "text-to-speech", // alt naming
    "speech",         // misc speech endpoints
    "whisper",        // whisper-1
    "audio",          // gpt-4o-audio-preview (audio I/O, not text chat)
    "realtime",       // gpt-4o-realtime-preview
    "dall-e",         // dall-e-3
    "dalle",          // alt naming
    "image",          // gpt-image-1, grok-2-image-*
    "moderation",     // omni-moderation-*, text-moderation-*
    "rerank",         // reranking models on some gateways
    "davinci",        // legacy base/completion models
    "babbage",
    "curie",
    "video", // sora / veo-style video gen on custom gateways
    "sora",
    "veo",
];

/// Non-chat markers matched only as a *whole word* (bounded on each side by the
/// start/end of the id or a non-alphanumeric character). Unlike the substring
/// list, these are real English words that show up as a stem inside perfectly
/// good *chat* model names a user might pick — so matching them as a bare
/// substring would wrongly hide those models.
///
/// "transcribe" is the motivating case: it must catch OpenAI's
/// `gpt-4o-transcribe` / `gpt-4o-mini-transcribe`, but NOT a local chat model
/// named e.g. `qwen3-0.6b-transcriber-beta` (a small LLM that *cleans up*
/// transcripts). Word-boundary matching keeps "…-transcribe" denied while
/// letting "…-transcriber…" through.
const NON_CHAT_WORD_MARKERS: &[&str] = &[
    "transcribe", // gpt-4o-transcribe, gpt-4o-mini-transcribe
];

/// True if `marker` appears in `haystack` as a complete word — i.e. every
/// occurrence is bounded on both sides by the start/end of the string or a
/// non-alphanumeric character. `haystack` and `marker` are expected lowercase.
fn contains_word(haystack: &str, marker: &str) -> bool {
    haystack.match_indices(marker).any(|(start, matched)| {
        let end = start + matched.len();
        let left_ok = start == 0
            || !haystack[..start]
                .chars()
                .next_back()
                .unwrap()
                .is_ascii_alphanumeric();
        let right_ok = end == haystack.len()
            || !haystack[end..]
                .chars()
                .next()
                .unwrap()
                .is_ascii_alphanumeric();
        left_ok && right_ok
    })
}

/// Drop obvious non-chat models (embeddings, TTS, Whisper, image, …) from a raw
/// `/v1/models` listing, preserving the original order of what remains.
fn filter_chat_models(models: Vec<String>) -> Vec<String> {
    models
        .into_iter()
        .filter(|id| {
            let lower = id.to_lowercase();
            let substring_hit = NON_CHAT_SUBSTRING_MARKERS
                .iter()
                .any(|marker| lower.contains(*marker));
            let word_hit = NON_CHAT_WORD_MARKERS
                .iter()
                .any(|marker| contains_word(&lower, marker));
            !(substring_hit || word_hit)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keeps_chat_models_named_transcriber() {
        // A local chat LLM whose name contains "transcriber" must survive — the
        // bare substring "transcribe" used to wrongly drop it.
        let kept = filter_chat_models(vec!["qwen3-0.6b-transcriber-beta".to_string()]);
        assert_eq!(kept, vec!["qwen3-0.6b-transcriber-beta".to_string()]);
    }

    #[test]
    fn drops_real_transcription_endpoints() {
        let kept = filter_chat_models(vec![
            "gpt-4o-transcribe".to_string(),
            "gpt-4o-mini-transcribe".to_string(),
            "whisper-1".to_string(),
        ]);
        assert!(kept.is_empty(), "expected all transcription models dropped");
    }

    #[test]
    fn drops_non_chat_and_keeps_chat() {
        let kept = filter_chat_models(vec![
            "text-embedding-3-small".to_string(),
            "gpt-4o".to_string(),
            "llama-3.1-8b-instruct".to_string(),
            "dall-e-3".to_string(),
        ]);
        assert_eq!(
            kept,
            vec!["gpt-4o".to_string(), "llama-3.1-8b-instruct".to_string()]
        );
    }
}
