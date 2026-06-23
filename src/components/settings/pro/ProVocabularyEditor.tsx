import React from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import type { ProVocabEntry } from "@/bindings";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { useSettings } from "../../../hooks/useSettings";

/**
 * Domain vocabulary the speech model tends to mangle. Each entry is hinted to the model and
 * applied as a conservative whole-word fixup on the output.
 */
export const ProVocabularyEditor: React.FC = () => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();
  const vocabulary = getSetting("pro_vocabulary") || [];
  const updating = isUpdating("pro_vocabulary");

  const persist = (next: ProVocabEntry[]) =>
    updateSetting("pro_vocabulary", next);
  const patchEntry = (index: number, patch: Partial<ProVocabEntry>) =>
    persist(
      vocabulary.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry,
      ),
    );
  const removeEntry = (index: number) =>
    persist(vocabulary.filter((_, i) => i !== index));
  const addEntry = () => persist([...vocabulary, { from: "", to: "" }]);

  return (
    <div className="px-4 py-3 space-y-3">
      {vocabulary.length === 0 ? (
        <p className="text-sm text-mid-gray">
          {t("settings.postProcessing.pro.vocab.empty")}
        </p>
      ) : (
        <div className="space-y-2">
          {vocabulary.map((entry, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                variant="compact"
                value={entry.from}
                disabled={updating}
                onChange={(e) => patchEntry(index, { from: e.target.value })}
                placeholder={t(
                  "settings.postProcessing.pro.vocab.fromPlaceholder",
                )}
                className="flex-1 min-w-[120px]"
              />
              <span className="text-mid-gray shrink-0" aria-hidden>
                →
              </span>
              <Input
                variant="compact"
                value={entry.to}
                disabled={updating}
                onChange={(e) => patchEntry(index, { to: e.target.value })}
                placeholder={t(
                  "settings.postProcessing.pro.vocab.toPlaceholder",
                )}
                className="flex-1 min-w-[120px]"
              />
              <Button
                variant="danger-ghost"
                size="sm"
                disabled={updating}
                onClick={() => removeEntry(index)}
                aria-label={t("settings.postProcessing.pro.vocab.deleteAria")}
                className="shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        disabled={updating}
        onClick={addEntry}
      >
        {t("settings.postProcessing.pro.vocab.add")}
      </Button>
    </div>
  );
};
