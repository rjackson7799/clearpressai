export interface ChipPreset {
  id: string;
  ja: string;
  en: string;
}

export const WHAT_WORKED_PRESETS: readonly ChipPreset[] = [
  { id: 'voice_match', ja: 'ブランドボイスに合致', en: 'Voice match' },
  { id: 'clarity', ja: '明確さ', en: 'Clarity' },
  { id: 'compliance', ja: '法令遵守', en: 'Compliance' },
  { id: 'data_accuracy', ja: 'データ精度', en: 'Data accuracy' },
  { id: 'tone', ja: '文体', en: 'Tone' },
  { id: 'length', ja: '長さ', en: 'Length' },
];

export const WHAT_COULD_IMPROVE_PRESETS: readonly ChipPreset[] = [
  { id: 'voice_match', ja: 'ブランドボイスとの不一致', en: 'Voice mismatch' },
  { id: 'clarity', ja: '不明瞭', en: 'Clarity' },
  { id: 'compliance', ja: '法令上の懸念', en: 'Compliance concern' },
  { id: 'data_accuracy', ja: 'データの不正確さ', en: 'Data accuracy' },
  { id: 'tone', ja: '文体', en: 'Tone' },
  { id: 'length', ja: '長さ', en: 'Length' },
];
