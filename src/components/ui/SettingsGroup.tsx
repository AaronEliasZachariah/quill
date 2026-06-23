import React from "react";

interface SettingsGroupProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="space-y-2.5">
      {title && (
        <div className="px-1">
          <h2 className="text-[11px] font-semibold text-mid-gray uppercase tracking-[0.16em]">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-mid-gray/90 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="bg-surface border border-mid-gray/12 rounded-card shadow-sheet overflow-visible">
        <div className="divide-y divide-mid-gray/12">{children}</div>
      </div>
    </div>
  );
};
