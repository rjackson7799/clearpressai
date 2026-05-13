import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { TagInput } from "@/components/brand-voice/TagInput";
import {
  useBrandVoiceProfile,
  useUpdateBrandVoiceProfile,
  type EditableProfile,
} from "@/hooks/useBrandVoiceProfile";

interface Props {
  clientId: string;
}

interface LengthNormRow {
  key: string;
  value: string;
}

function profileToState(
  profile: ReturnType<typeof useBrandVoiceProfile>["data"],
): {
  editable: EditableProfile;
  lengthRows: LengthNormRow[];
} {
  if (!profile) {
    return {
      editable: {
        tone_keywords: [],
        stylistic_patterns: "",
        preferred_vocabulary: [],
        words_to_avoid: [],
        signature_phrases: [],
        length_norms: {},
      },
      lengthRows: [],
    };
  }
  const lengthMap = (profile.length_norms ?? {}) as Record<string, string>;
  return {
    editable: {
      tone_keywords: (profile.tone_keywords as string[]) ?? [],
      stylistic_patterns: profile.stylistic_patterns ?? "",
      preferred_vocabulary: (profile.preferred_vocabulary as string[]) ?? [],
      words_to_avoid: (profile.words_to_avoid as string[]) ?? [],
      signature_phrases: (profile.signature_phrases as string[]) ?? [],
      length_norms: lengthMap,
    },
    lengthRows: Object.entries(lengthMap).map(([key, value]) => ({
      key,
      value: String(value),
    })),
  };
}

export function VoiceProfileEditor({ clientId }: Props) {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useBrandVoiceProfile(clientId);
  const updateProfile = useUpdateBrandVoiceProfile(clientId);
  const [state, setState] = useState(() => profileToState(profile));
  // Re-seed local edit state when the server profile changes
  // (after extraction, save, etc.) — render-time pattern, not an effect.
  const [seenProfile, setSeenProfile] = useState(profile);
  if (profile !== seenProfile) {
    setSeenProfile(profile);
    setState(profileToState(profile));
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;
  }

  if (!profile) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("brandVoice.profileEmpty")}
      </div>
    );
  }

  const setEditable = (patch: Partial<EditableProfile>) =>
    setState((s) => ({ ...s, editable: { ...s.editable, ...patch } }));

  const updateLengthRow = (idx: number, patch: Partial<LengthNormRow>) => {
    setState((s) => ({
      ...s,
      lengthRows: s.lengthRows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const addLengthRow = () =>
    setState((s) => ({
      ...s,
      lengthRows: [...s.lengthRows, { key: "", value: "" }],
    }));

  const removeLengthRow = (idx: number) =>
    setState((s) => ({
      ...s,
      lengthRows: s.lengthRows.filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    const length_norms: Record<string, string> = {};
    for (const row of state.lengthRows) {
      const k = row.key.trim();
      if (k) length_norms[k] = row.value;
    }
    try {
      await updateProfile.mutateAsync({
        ...state.editable,
        length_norms,
      });
      toast.success(t("brandVoice.savedToast"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleReset = () => setState(profileToState(profile));

  return (
    <div className="space-y-6">
      <FieldSection
        labelJa="トーンキーワード"
        labelEn="Tone keywords"
      >
        <TagInput
          values={state.editable.tone_keywords}
          onChange={(v) => setEditable({ tone_keywords: v })}
          max={7}
          placeholder={t("brandVoice.addTag")}
        />
      </FieldSection>

      <FieldSection
        labelJa="文体的特徴"
        labelEn="Stylistic patterns"
      >
        <Textarea
          rows={4}
          value={state.editable.stylistic_patterns}
          onChange={(e) => setEditable({ stylistic_patterns: e.target.value })}
        />
      </FieldSection>

      <FieldSection
        labelJa="好まれる語彙"
        labelEn="Preferred vocabulary"
      >
        <TagInput
          values={state.editable.preferred_vocabulary}
          onChange={(v) => setEditable({ preferred_vocabulary: v })}
          max={15}
          placeholder={t("brandVoice.addTag")}
        />
      </FieldSection>

      <FieldSection
        labelJa="避けるべき表現"
        labelEn="Words to avoid"
      >
        <TagInput
          values={state.editable.words_to_avoid}
          onChange={(v) => setEditable({ words_to_avoid: v })}
          max={10}
          placeholder={t("brandVoice.addTag")}
        />
      </FieldSection>

      <FieldSection
        labelJa="シグネチャーフレーズ"
        labelEn="Signature phrases"
      >
        <TagInput
          values={state.editable.signature_phrases}
          onChange={(v) => setEditable({ signature_phrases: v })}
          max={6}
          placeholder={t("brandVoice.addTag")}
        />
      </FieldSection>

      <FieldSection labelJa="標準的な分量" labelEn="Length norms">
        <div className="space-y-2">
          {state.lengthRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <Input
                value={row.key}
                placeholder={t("brandVoice.lengthNormKey")}
                onChange={(e) => updateLengthRow(idx, { key: e.target.value })}
              />
              <Input
                value={row.value}
                placeholder={t("brandVoice.lengthNormValue")}
                onChange={(e) =>
                  updateLengthRow(idx, { value: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLengthRow(idx)}
                aria-label="Remove length norm"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLengthRow}
          >
            <PlusIcon className="mr-1 size-3" />
            {t("brandVoice.addLengthNorm")}
          </Button>
        </div>
      </FieldSection>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {t("common.save")}
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

function FieldSection({
  labelJa,
  labelEn,
  children,
}: {
  labelJa: string;
  labelEn: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">
        <BilingualLabel ja={labelJa} en={labelEn} />
      </h3>
      {children}
    </section>
  );
}
