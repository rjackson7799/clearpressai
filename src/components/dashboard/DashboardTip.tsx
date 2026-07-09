import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { pickLang } from '@/lib/bilingual';

// Tips reference features that actually exist in v1 (replaces the concept's
// "Save a house style as a preset" — presets aren't built). Rotated by
// day-of-month so `now` (threaded from the page) keeps render pure.
const TIPS = [
  {
    titleJa: 'バリアントを承認',
    titleEn: 'Approve a variant',
    bodyJa: 'バリアントを承認すると監査レポートを組み立てられます。',
    bodyEn: 'Approving a variant lets you assemble the audit report.',
  },
  {
    titleJa: 'フィードバックで自動改善',
    titleEn: 'Feedback tunes the voice',
    bodyJa: 'クライアントのフィードバックはブランドボイスを自動で洗練します。',
    bodyEn: "Client feedback automatically refines the client's brand voice.",
  },
  {
    titleJa: '資料を追加',
    titleEn: 'Add more samples',
    bodyJa: 'ブランドボイス資料を増やすほど、生成される文章の精度が上がります。',
    bodyEn: 'Upload more brand-voice samples to sharpen the generated voice.',
  },
];

interface Props {
  now: Date;
}

export function DashboardTip({ now }: Props) {
  const { i18n } = useTranslation();
  const tip = TIPS[now.getDate() % TIPS.length];

  return (
    <div className="rounded-xl bg-slate-900 p-5 text-slate-100 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        <Lightbulb className="size-3.5" aria-hidden />
        <span>{pickLang(i18n.language, 'ヒント', 'Tip')}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">
        {pickLang(i18n.language, tip.titleJa, tip.titleEn)}
      </p>
      <p className="mt-1 text-sm text-slate-300">
        {pickLang(i18n.language, tip.bodyJa, tip.bodyEn)}
      </p>
    </div>
  );
}
