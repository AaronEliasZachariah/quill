# DECISIONS.md — handy-pro "Pro" app-aware post-processing

This document records the research, integration plan, and every design decision /
deviation for the **handy-pro** fork of [cjpais/Handy](https://github.com/cjpais/Handy).

handy-pro adds a **Pro, app-aware post-processing layer** on top of Handy's dictation
pipeline: a free, local (Ollama-by-default) alternative to Wispr Flow's "format for the
app I'm dictating into" behavior. It is **additive** and **off by default** — with the
feature disabled, handy-pro behaves identically to upstream Handy.

Upstream attribution and the MIT `LICENSE` are preserved unchanged. `upstream` remotes
point at `cjpais/Handy`; `origin` is `AaronEliasZachariah/quill`.

---

## 1. The single most important research finding

**Handy upstream already ships a post-processing feature.** The brief was written as if
Handy had none, but the real codebase already contains:

| Concern                           | Upstream already has it                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LLM client (provider abstraction) | `src-tauri/src/llm_client.rs` — OpenAI-compatible `/chat/completions`, system prompt + structured-output (`json_schema`) support, special-cases `anthropic` auth headers                            |
| Provider list                     | `settings.rs::default_post_process_providers()` — OpenAI, Z.AI, OpenRouter, Anthropic, Groq, Cerebras, AWS Bedrock, **and a `custom` provider pre-pointed at `http://localhost:11434/v1` (Ollama)** |
| Per-provider API key / model      | `post_process_api_keys` (redacted `SecretMap`), `post_process_models`                                                                                                                               |
| Editable prompts                  | `post_process_prompts: Vec<LLMPrompt{id,name,prompt}>` with a `${output}` placeholder, plus `post_process_selected_prompt_id`                                                                       |
| Master toggle                     | `post_process_enabled` (gates the `transcribe_with_post_process` shortcut registration)                                                                                                             |
| Custom vocabulary (STT side)      | `custom_words: Vec<String>` (Whisper word-boost / correction), `custom_filler_words`                                                                                                                |
| Settings UI                       | `components/settings/post-processing/`, `PostProcessingSettingsApi/`, `PostProcessingToggle`, `PostProcessingSettingsPrompts`                                                                       |
| Processing indicator              | overlay already supports a `"processing"` state (`overlay.rs::show_processing_overlay`)                                                                                                             |
| Per-invocation trigger            | two shortcuts: `transcribe` (raw) and `transcribe_with_post_process` (cleaned)                                                                                                                      |

**Consequence / deviation from the brief:** rather than _build_ an LLM client, provider
abstraction, prompt store, toggle, and overlay indicator that already exist (which would
duplicate and fight upstream), handy-pro **reuses all of it** and adds the one thing
upstream genuinely lacks: **app-aware routing** — detecting the foreground app at
dictation time and choosing a _per-app profile prompt_ (plus a user vocabulary and a
hard latency timeout). That routing is the actual "Wispr-Flow-formatting" differentiator.

This is the biggest deviation and it makes the result smaller, cleaner, and more correct
than the literal brief.

---

## 2. The pipeline (where things happen)

```
hotkey ─▶ TranscriptionCoordinator (1 serialized thread) ─▶ TranscribeAction::start  → record (cpal + Silero VAD)
                                                          └▶ TranscribeAction::stop   → transcribe (transcribe-rs / whisper)
                                                                                       → process_transcription_output()
                                                                                          ├─ maybe_convert_chinese_variant()
                                                                                          ├─ post_process_transcription()  ◀── LLM
                                                                                          └─ paste into focused app (utils::paste)
```

Key files:

- `src-tauri/src/actions.rs` — **`post_process_transcription(settings, transcription)`** picks
  provider → model → the single global `post_process_selected_prompt_id` → calls
  `llm_client`. **`process_transcription_output(app, transcription, post_process)`** wraps it,
  called from `TranscribeAction::stop` _after_ transcription and _before_ paste. **This is the
  integration seam.**
- `src-tauri/src/llm_client.rs` — `send_chat_completion[_with_schema](...)` (reused as-is).
- `src-tauri/src/settings.rs` — `AppSettings` persisted via `tauri-plugin-store`
  (`settings_store.json`); all new fields use `#[serde(default ...)]` so existing stores
  upgrade cleanly.
- `src-tauri/src/lib.rs` — `collect_commands![]` registry; **`bindings.ts` is auto-generated by
  tauri-specta under `#[cfg(debug_assertions)]`**, so a debug `cargo build` regenerates the
  TypeScript bindings + types. New `#[derive(specta::Type)]` structs and `#[specta::specta]`
  commands export automatically. **Never hand-edit `src/bindings.ts`.**
- `src-tauri/src/overlay.rs` — overlay is a **non-activating** (`SWP_NOACTIVATE`,
  `focused(false)`) topmost window, so `GetForegroundWindow()` at post-process time returns
  the user's **target app**, not Handy. App detection is sound.
- Frontend: `stores/settingsStore.ts` (`settingUpdaters` map → `commands.*`), `Sidebar.tsx`
  (`SECTIONS_CONFIG`, the `postprocessing` tab is gated by `post_process_enabled`),
  `components/settings/post-processing/PostProcessingSettings.tsx` (renders SettingsGroups),
  reusable `components/ui/*` (SettingContainer, SettingsGroup, ToggleSwitch, Textarea, Input,
  Button, Dropdown, Select, Alert…). i18n is enforced by `eslint-plugin-i18next`.

---

## 3. Integration plan (additive, fail-safe)

### Backend

1. **New settings fields** on `AppSettings` (all `#[serde(default)]`):
   - `pro_app_aware_enabled: bool` (default **false**) — master switch for the Pro layer.
   - `pro_profiles: Vec<ProProfile{ key,label,enabled,prompt }>` — built-in seed: `code`,
     `email`, `chat`, `note`, `list`, `browser`, `generic`; each with an editable instruction.
   - `pro_app_rules: Vec<ProAppRule{ id,match_type(Process|Title),pattern,profile_key,enabled }>`
     — ordered, first enabled match wins (case-insensitive substring). Seeded with sensible
     defaults (VS Code/JetBrains/terminals → code; Outlook/Thunderbird/Gmail → email;
     Slack/Discord/Teams/WhatsApp → chat; browsers → browser).
   - `pro_default_profile: String` (default `generic`) — used when no rule matches.
   - `pro_vocabulary: Vec<ProVocabEntry{ from,to }>` — seeded with `Parakeet`, `Claude Code`,
     etc. Injected as a hint to the model **and** applied as a conservative whole-word fixup.
   - `pro_timeout_ms: u64` (default **4000**) — hard cap on the LLM call.
2. **`app_context.rs`** (Windows): `foreground_app() -> Option<AppContext{process_name,window_title}>`
   via `GetForegroundWindow → GetWindowThreadProcessId → OpenProcess(QUERY_LIMITED_INFORMATION)
→ QueryFullProcessImageNameW` (file stem) + `GetWindowTextW`. Non-Windows returns `None`.
   Requires adding the `Win32_System_Threading` feature to the already-present `windows` crate.
3. **`pro` routing module**: `resolve_profile(settings, ctx) -> profile_key`;
   `build_profile_system_prompt(base, profile, vocab)`; `apply_vocabulary(text, vocab)`.
4. **`actions.rs`**: thread an `Option<&AppContext>` into `post_process_transcription`; when
   `pro_app_aware_enabled`, build the system prompt from the **base cleanup instruction +
   resolved profile instruction + vocabulary hint** instead of the single global prompt; wrap
   the LLM call in `tokio::time::timeout(pro_timeout_ms)`. Capture the foreground app in
   `TranscribeAction::stop` and store the **last detected context** for the test panel.
5. **New commands** (registered in `lib.rs`): `get_last_app_context()`,
   `pro_test_post_process(raw_text, profile_key)` (live test), and setting mutators for each
   new field. All `#[specta::specta]` so bindings regenerate.
6. **Ollama as first-class default:** add a dedicated `ollama` provider
   (`http://localhost:11434/v1`, no key, structured-output off) and make it the handy-pro
   default `post_process_provider_id`. (Upstream only reaches Ollama via the generic `custom`
   provider.) Existing users keep their saved provider; only fresh installs default to Ollama.

### Frontend (within the existing Post-processing tab — no new sidebar entry)

New `components/settings/pro/` components, wired as new `SettingsGroup`s in
`PostProcessingSettings.tsx`: master toggle, per-profile enable+prompt editor, app→profile
rules editor, vocabulary editor, latency/quality control, and a **live test** panel (paste raw
→ cleaned output for a chosen profile; shows the last detected app/profile). Built with the
existing `ui/*` primitives via the **frontend-design** skill so it doesn't read as bolted-on.
i18n keys added to `locales/en/translation.json` (other locales fall back to en).

### Fail-safe contract (never stall dictation)

`post_process` already returns `Option<String>` and the caller falls back to the raw transcript
on `None`/error. handy-pro preserves and strengthens this: app-detection failure → fall back to
the global prompt; LLM error/timeout/empty → return `None` → **raw transcript is pasted
unchanged.** With `pro_app_aware_enabled = false` the code path is upstream-identical.

---

## 4. Decisions & deviations log

- **D1 — Reuse upstream post-processing instead of rebuilding it.** (See §1.) The brief's
  "LLM client / provider abstraction / prompts / toggle / overlay indicator" already exist;
  duplicating them would be wrong. handy-pro contributes app-aware routing on top.
- **D2 — Separate `pro_app_aware_enabled` from upstream `post_process_enabled`.** The Pro layer
  is opt-in _within_ post-processing, so toggling it never changes upstream behavior and the
  raw vs. cleaned shortcuts keep working.
- **D3 — Ollama default model:** `llama3.2:3b` (pulled locally, ~2 GB, fast instruct). Chosen
  for low latency under the 4 s timeout while still following instructions well; configurable.
- **D4 — Add a real timeout.** Upstream's `reqwest` client has **no** timeout; a hung local
  model would stall dictation. handy-pro adds `pro_timeout_ms` (default 4 s) with raw fallback.
- **D5 — Capture foreground app at `stop()` (dictation time), not paste time**, and store the
  last context so the live-test panel can display it without self-detecting Handy's own window.
- **D6 — Profiles overlay the base prompt, they don't replace cleanup.** Every profile starts
  from the shared cleanup instruction (remove fillers/false-starts/spoken repetitions, fix
  dictation errors, output only the text) and adds context-specific shaping.
- **D7 — Vocabulary is hinted to the model + conservatively applied.** Whole-word,
  case-insensitive replacement only, to avoid corrupting substrings.
- **D8 — Windows-only app detection for the MVP.** `app_context.rs` is `#[cfg(windows)]` with a
  `None` stub elsewhere; the rest of the Pro layer is cross-platform.

---

## 5. Toolchain / build notes (Windows)

- Rust stable (rustup, MSVC), Bun, cmake, VS Build Tools 2022 (C++), WebView2 runtime.
- Windows `transcribe-rs` uses `whisper-vulkan` + `ort-directml`. Building **`whisper-vulkan` from
  source DOES require the Vulkan SDK** (`whisper-rs-sys` compiles whisper.cpp's Vulkan backend +
  the `vulkan-shaders-gen` tool). For a CPU-only dev build that compiles without the SDK, drop
  `whisper-vulkan` from the Windows `transcribe-rs` features (whisper falls back to CPU; ONNX/
  Parakeet still uses DirectML GPU). `whisper-rs-sys` also needs **libclang** for bindgen
  (`LIBCLANG_PATH`; the `libclang` pip wheel works with no admin).
- Dev model asset: `src-tauri/resources/models/silero_vad_v4.onnx` (downloaded from
  `blob.handy.computer`).
- `bun.lock` + `postinstall` use Bun; a **debug** `cargo build`/`tauri dev` regenerates
  `src/bindings.ts` (tauri-specta export is gated on `#[cfg(debug_assertions)]` inside `run()`).
- The installed release Handy and a `tauri dev` build share one bundle identifier; the
  single-instance plugin will focus the running copy instead of launching dev. Quit the
  installed Handy before `tauri dev` to run the dev build.

### Building the Windows release installer (GPU whisper) — `tauri build`

The GPU release build is finicky on Windows; the working recipe (all in one env):

1. **Vulkan SDK** installed, `VULKAN_SDK` set (e.g. `C:\VulkanSDK\1.4.350.0`).
2. Run inside the **MSVC dev env**: `call .../VC/Auxiliary/Build/vcvars64.bat` so `cl.exe` is on
   PATH — whisper.cpp's `vulkan-shaders-gen` ExternalProject probes the compiler via PATH.
3. `set CMAKE_GENERATOR=Ninja` — the VS/MSBuild generator fails the nested shader-gen's compiler
   detection ("No CMAKE_C_COMPILER"); Ninja works. (Ninja ships with VS Build Tools' CMake-tools.)
4. `set CARGO_TARGET_DIR=C:\hpb` (any **short** path) — whisper.cpp's nested Vulkan build paths
   exceed the **260-char `MAX_PATH`** under the normal repo target dir, causing
   `fatal error C1041: cannot open program database`.
5. `set LIBCLANG_PATH=...\clang\native` (libclang wheel).
6. `bun run tauri build --bundles nsis` → `C:\hpb\release\bundle\nsis\Handy Pro_*-setup.exe`.

### Rebrand for distribution (v0.9.0-beta)

To ship without colliding with official Handy: `tauri.conf.json` productName → **Handy Pro**,
identifier → `com.aaronelias.handypro` (separate install / data dir / single-instance), window
title → "Handy Pro". Removed CJ's Azure `signCommand` (builds **unsigned** → SmartScreen warning)
and repointed the updater off cjpais/Handy with `createUpdaterArtifacts: false` (signed auto-update
would need a new minisign keypair — TODO). The MIT `LICENSE` + CJ Pais copyright are preserved.
Deeper cosmetic rebranding (tray text, logo SVGs, remaining "Handy" UI strings) is a follow-up.

## 6. Verification (2026-06-22)

- **Backend:** `cargo build` green on Windows (CPU whisper, no Vulkan SDK).
- **Frontend:** `tsc && vite build` green; `eslint src` clean (i18n keys added).
- **Bindings:** `src/bindings.ts` regenerated with the new commands/types.
- **Pipeline proof:** the exact Pro prompt pipeline (base cleanup + per-profile instruction +
  vocabulary) run against the real local model (Ollama `llama3.2:3b`) on messy dictation for the
  **code / email / chat** profiles produced appropriately differentiated, cleaned output, with the
  vocabulary fixups applied (`Parakeet`, `Claude Code`). Note: a 3B model occasionally adds stray
  meta text; a stronger model (e.g. `qwen2.5:7b-instruct`) follows the "output only the text"
  instruction more reliably — documented in the README.
- **Runtime (GUI):** ran `tauri dev` and drove the app — enabled Post-processing, opened the
  **Post Process** tab, turned on **App-aware cleanup**, switched the provider to **Ollama (local)**
  (model auto-filled `llama3.2:3b`), and ran the **live test** with the _Code / Terminal_ profile.
  The CLEANED panel returned `Refactor the \`getUser\` function in \`auth.ts\` and add a null check
  for the email before calling \`trim()\`` — confirming the full GUI → command → Ollama → cleaned
  output path. (Running the dev build needs the separately-installed release Handy closed first;
  both share one bundle identifier.)

_Status of this document: living record, updated as milestones land. M0–M5 complete and pushed to
`AaronEliasZachariah/quill`._
