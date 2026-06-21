import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleSwitch } from "../../ui/ToggleSwitch";
import { useSettings } from "../../../hooks/useSettings";

interface ProAppAwareToggleProps {
  grouped?: boolean;
}

/**
 * Master switch for the Pro app-aware layer. Separate from `post_process_enabled` so toggling
 * it never changes upstream post-processing behavior.
 */
export const ProAppAwareToggle: React.FC<ProAppAwareToggleProps> = React.memo(
  ({ grouped = true }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();
    const enabled = getSetting("pro_app_aware_enabled") || false;

    return (
      <ToggleSwitch
        checked={enabled}
        onChange={(value) => updateSetting("pro_app_aware_enabled", value)}
        isUpdating={isUpdating("pro_app_aware_enabled")}
        label={t("settings.postProcessing.pro.toggle.label")}
        description={t("settings.postProcessing.pro.toggle.description")}
        grouped={grouped}
      />
    );
  },
);

ProAppAwareToggle.displayName = "ProAppAwareToggle";
