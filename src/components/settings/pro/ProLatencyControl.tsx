import React from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/ui";
import { SettingContainer } from "../../ui/SettingContainer";
import { useSettings } from "../../../hooks/useSettings";

/**
 * Maximum time to wait for the model before pasting the raw transcript instead. Keeps dictation
 * from ever stalling on a slow or unreachable model.
 */
export const ProLatencyControl: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const value = getSetting("pro_timeout_ms") ?? 4000;

  const options = [
    { value: "2000", label: t("settings.postProcessing.pro.latency.fast") },
    { value: "3000", label: "3s" },
    { value: "4000", label: t("settings.postProcessing.pro.latency.balanced") },
    { value: "6000", label: "6s" },
    { value: "8000", label: t("settings.postProcessing.pro.latency.quality") },
    { value: "0", label: t("settings.postProcessing.pro.latency.none") },
  ];

  return (
    <SettingContainer
      title={t("settings.postProcessing.pro.latency.title")}
      description={t("settings.postProcessing.pro.latency.description")}
      descriptionMode="tooltip"
      layout="horizontal"
      grouped
    >
      <Dropdown
        selectedValue={String(value)}
        options={options}
        onSelect={(next) => updateSetting("pro_timeout_ms", Number(next))}
        disabled={isUpdating("pro_timeout_ms")}
        className="min-w-[160px]"
      />
    </SettingContainer>
  );
};
