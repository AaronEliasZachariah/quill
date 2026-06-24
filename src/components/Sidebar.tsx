import React from "react";
import { useTranslation } from "react-i18next";
import {
  Cog,
  FlaskConical,
  History,
  Info,
  Sparkles,
  Cpu,
  Feather,
} from "lucide-react";
import QuillProLogo from "./icons/QuillProLogo";
import { useSettings } from "../hooks/useSettings";
import {
  GeneralSettings,
  AdvancedSettings,
  HistorySettings,
  DebugSettings,
  AboutSettings,
  PostProcessingSettings,
  ModelsSettings,
} from "./settings";

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

interface IconProps {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
  [key: string]: any;
}

interface SectionConfig {
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  component: React.ComponentType;
  enabled: (settings: any) => boolean;
}

export const SECTIONS_CONFIG = {
  general: {
    labelKey: "sidebar.general",
    icon: Feather,
    component: GeneralSettings,
    enabled: () => true,
  },
  models: {
    labelKey: "sidebar.models",
    icon: Cpu,
    component: ModelsSettings,
    enabled: () => true,
  },
  postprocessing: {
    labelKey: "sidebar.postProcessing",
    icon: Sparkles,
    component: PostProcessingSettings,
    enabled: () => true,
  },
  advanced: {
    labelKey: "sidebar.advanced",
    icon: Cog,
    component: AdvancedSettings,
    enabled: () => true,
  },
  history: {
    labelKey: "sidebar.history",
    icon: History,
    component: HistorySettings,
    enabled: () => true,
  },
  debug: {
    labelKey: "sidebar.debug",
    icon: FlaskConical,
    component: DebugSettings,
    enabled: (settings) => settings?.debug_mode ?? false,
  },
  about: {
    labelKey: "sidebar.about",
    icon: Info,
    component: AboutSettings,
    enabled: () => true,
  },
} as const satisfies Record<string, SectionConfig>;

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const availableSections = Object.entries(SECTIONS_CONFIG)
    .filter(([_, config]) => config.enabled(settings))
    .map(([id, config]) => ({ id: id as SidebarSection, ...config }));

  return (
    <div className="flex flex-col w-44 h-full border-e border-mid-gray/15 items-center px-3">
      <div className="py-5">
        <QuillProLogo width={116} />
      </div>
      <nav className="flex flex-col w-full items-stretch gap-0.5 pt-3 border-t border-mid-gray/15">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              className={`relative flex gap-2.5 items-center ps-3 pe-2.5 py-2 w-full rounded-lg cursor-pointer transition-colors duration-150 text-start ${
                isActive
                  ? "bg-logo-primary/10 text-logo-primary"
                  : "text-mid-gray hover:text-text hover:bg-mid-gray/8"
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              {/* The marked margin rule for the active page. */}
              <span
                className={`absolute start-0 inset-y-1.5 w-[3px] rounded-full bg-logo-primary transition-opacity duration-150 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
              <Icon width={18} height={18} className="shrink-0" />
              <span
                className={`text-sm truncate ${isActive ? "font-medium" : ""}`}
                title={t(section.labelKey)}
              >
                {t(section.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
