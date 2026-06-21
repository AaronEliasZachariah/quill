import React from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/ui";
import { SettingContainer } from "../../ui/SettingContainer";
import { useSettings } from "../../../hooks/useSettings";

/** The profile used when no app rule matches the foreground app. */
export const ProDefaultProfile: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const profiles = getSetting("pro_profiles") || [];
  const value = getSetting("pro_default_profile") || "generic";

  return (
    <SettingContainer
      title={t("settings.postProcessing.pro.defaultProfile.title")}
      description={t("settings.postProcessing.pro.defaultProfile.description")}
      descriptionMode="tooltip"
      layout="horizontal"
      grouped
    >
      <Dropdown
        selectedValue={value}
        options={profiles.map((profile) => ({
          value: profile.key,
          label: profile.label,
        }))}
        onSelect={(next) => updateSetting("pro_default_profile", next)}
        disabled={isUpdating("pro_default_profile")}
        className="min-w-[200px]"
      />
    </SettingContainer>
  );
};
