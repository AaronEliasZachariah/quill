import React from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../../ui/SettingContainer";

interface DebugPathsProps {
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
}

export const DebugPaths: React.FC<DebugPathsProps> = ({
  descriptionMode = "inline",
  grouped = false,
}) => {
  const { t } = useTranslation();

  return (
    <SettingContainer
      title={t("settings.debug.paths.title")}
      description={t("settings.debug.paths.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
      layout="stacked"
    >
      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-xs font-medium text-mid-gray">
            {t("settings.debug.paths.appData")}
          </span>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <div className="px-2 py-2 bg-mid-gray/10 border border-mid-gray/15 rounded-lg text-xs font-mono break-all select-text">
            %APPDATA%/Quill
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-mid-gray">
            {t("settings.debug.paths.models")}
          </span>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <div className="px-2 py-2 bg-mid-gray/10 border border-mid-gray/15 rounded-lg text-xs font-mono break-all select-text">
            %APPDATA%/Quill/models
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-mid-gray">
            {t("settings.debug.paths.settings")}
          </span>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <div className="px-2 py-2 bg-mid-gray/10 border border-mid-gray/15 rounded-lg text-xs font-mono break-all select-text">
            %APPDATA%/Quill/settings_store.json
          </div>
        </div>
      </div>
    </SettingContainer>
  );
};
