import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProProfile } from "@/bindings";
import { Textarea } from "@/components/ui";
import { useSettings } from "../../../hooks/useSettings";

/** Compact toggle reusing Handy's switch markup (the ToggleSwitch component is row-sized). */
const Switch: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}> = ({ checked, onChange, disabled = false, ariaLabel }) => (
  <label
    className={`inline-flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
  >
    <input
      type="checkbox"
      className="sr-only peer"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
    />
    <div className="relative w-11 h-6 bg-mid-gray/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-logo-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-background-ui peer-disabled:opacity-50"></div>
  </label>
);

const ProfileRow: React.FC<{
  profile: ProProfile;
  disabled: boolean;
  onChange: (patch: Partial<ProProfile>) => void;
}> = ({ profile, disabled, onChange }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(profile.prompt);
  const enabled = profile.enabled ?? true;

  useEffect(() => {
    setDraft(profile.prompt);
  }, [profile.prompt]);

  const commit = () => {
    if (draft !== profile.prompt) onChange({ prompt: draft });
  };

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-sm font-medium ${enabled ? "" : "opacity-50"}`}>
          {profile.label}
        </h3>
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={(value) => onChange({ enabled: value })}
          ariaLabel={t("settings.postProcessing.pro.profiles.toggleAria", {
            name: profile.label,
          })}
        />
      </div>
      <Textarea
        value={draft}
        disabled={disabled || !enabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        variant="compact"
        className="w-full"
        placeholder={t("settings.postProcessing.pro.profiles.promptPlaceholder")}
      />
    </div>
  );
};

/**
 * Per-profile enable + editable instruction. Each profile's prompt is layered on top of the
 * shared base cleanup instruction at post-process time.
 */
export const ProProfilesEditor: React.FC = () => {
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const profiles = getSetting("pro_profiles") || [];
  const updating = isUpdating("pro_profiles");

  const patchProfile = (key: string, patch: Partial<ProProfile>) => {
    const next = profiles.map((profile) =>
      profile.key === key ? { ...profile, ...patch } : profile,
    );
    updateSetting("pro_profiles", next);
  };

  return (
    <div className="divide-y divide-mid-gray/20">
      {profiles.map((profile) => (
        <ProfileRow
          key={profile.key}
          profile={profile}
          disabled={updating}
          onChange={(patch) => patchProfile(profile.key, patch)}
        />
      ))}
    </div>
  );
};
