import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCcw, Monitor } from "lucide-react";
import { commands } from "@/bindings";
import type { DetectedContext } from "@/bindings";
import { Textarea, Dropdown } from "@/components/ui";
import { Button } from "../../ui/Button";
import { Alert } from "../../ui/Alert";
import { useSettings } from "../../../hooks/useSettings";

const SAMPLE =
  "um so like i need to uh refactor the the get user function in auth dot ts and also add a um null check before we call dot trim on the the email";

/**
 * Paste raw dictation, pick a profile, and see the cleaned output — tune the Pro layer without
 * dictating. Also surfaces the app/profile detected during the last real dictation.
 */
export const ProLiveTest: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const profiles = getSetting("pro_profiles") || [];
  const defaultProfile = getSetting("pro_default_profile") || "generic";

  const [detected, setDetected] = useState<DetectedContext | null>(null);
  const [profileKey, setProfileKey] = useState(defaultProfile);
  const [input, setInput] = useState(SAMPLE);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const labelFor = (key: string) =>
    profiles.find((profile) => profile.key === key)?.label ?? key;

  const refreshDetected = async () => {
    try {
      const res = await commands.getLastAppContext();
      if (res.status === "ok" && res.data) {
        setDetected(res.data);
        if (res.data.profile_key) setProfileKey(res.data.profile_key);
      }
    } catch {
      // best-effort: the detected chip is informational only
    }
  };

  useEffect(() => {
    refreshDetected();
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    setOutput("");
    try {
      const res = await commands.proTestPostProcess(input, profileKey);
      if (res.status === "ok") setOutput(res.data);
      else setError(res.error);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-md bg-mid-gray/5 border border-mid-gray/20 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Monitor className="w-4 h-4 text-mid-gray shrink-0" />
          <p className="text-sm truncate">
            {detected
              ? t("settings.postProcessing.pro.test.detected", {
                  app: detected.process_name || detected.window_title || "—",
                  profile: labelFor(detected.profile_key),
                })
              : t("settings.postProcessing.pro.test.noneDetected")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshDetected}
          aria-label={t("settings.postProcessing.pro.test.refresh")}
          className="shrink-0"
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          selectedValue={profileKey}
          options={profiles.map((profile) => ({
            value: profile.key,
            label: profile.label,
          }))}
          onSelect={setProfileKey}
          className="min-w-[180px]"
        />
        <Button
          variant="primary"
          size="md"
          onClick={run}
          disabled={running || !input.trim()}
        >
          {running
            ? t("settings.postProcessing.pro.test.running")
            : t("settings.postProcessing.pro.test.run")}
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
          {t("settings.postProcessing.pro.test.rawLabel")}
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          variant="compact"
          className="w-full"
          placeholder={t("settings.postProcessing.pro.test.rawPlaceholder")}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-mid-gray">
          {t("settings.postProcessing.pro.test.cleanedLabel")}
        </label>
        {error ? (
          <Alert variant="error" contained>
            {error}
          </Alert>
        ) : (
          <div className="px-3 py-2 min-h-[80px] text-sm whitespace-pre-wrap bg-logo-primary/5 border border-mid-gray/20 rounded-md">
            {output || (
              <span className="text-mid-gray">
                {t("settings.postProcessing.pro.test.cleanedEmpty")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
