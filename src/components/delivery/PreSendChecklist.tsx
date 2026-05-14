import { CheckCircle2Icon, CircleIcon, XCircleIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BilingualLabel } from '@/components/shared/BilingualLabel';
import type { ChecklistState } from '@/hooks/usePreSendChecklist';

interface Props {
  state: ChecklistState;
  hasSelectedVariants: boolean;
  manualAcknowledged: boolean;
  onManualChange: (next: boolean) => void;
}

export function PreSendChecklist({
  state,
  hasSelectedVariants,
  manualAcknowledged,
  onManualChange,
}: Props) {
  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-base font-medium">
        <BilingualLabel ja="送信前チェックリスト" en="Pre-send checklist" />
      </div>

      <ChecklistRow
        ok={state.auditFinalized}
        ja="監査レポートが署名済み"
        en="Audit report is signed (finalized)"
        detail={
          state.auditFinalized
            ? null
            : {
                ja: '監査ページから最新の監査レポートに署名してください。',
                en: 'Sign the latest audit report on the audit page.',
              }
        }
      />
      <ChecklistRow
        ok={state.variantsClean}
        ja="選択した案がすべて承認済みで、承認後に編集されていない"
        en="All selected variants are approved and unedited since approval"
        detail={
          !hasSelectedVariants
            ? {
                ja: '少なくとも1つの案を選択してください。',
                en: 'Select at least one variant.',
              }
            : !state.variantsClean
              ? {
                  ja: '承認後に編集された案があります。再承認するか、選択を外してください。',
                  en: 'One or more selected variants were edited after approval. Re-approve or deselect.',
                }
              : null
        }
      />
      <ChecklistRow
        ok={state.recipientValid}
        ja="宛先メールアドレスの形式が正しい"
        en="Recipient email is well-formed"
        detail={
          state.recipientValid
            ? null
            : {
                ja: '有効なメールアドレスを入力してください。',
                en: 'Enter a valid email address.',
              }
        }
      />

      <label className="flex items-start gap-2 cursor-pointer pt-2 border-t">
        <Checkbox
          id="manual-ack"
          checked={manualAcknowledged}
          onCheckedChange={(s) => onManualChange(s === true)}
          className="mt-0.5"
        />
        <div className="text-sm">
          <div>
            <BilingualLabel
              ja="宛先と本文を自分の目で確認した"
              en="I have personally reviewed the recipient and message"
            />
          </div>
          {!manualAcknowledged && (
            <p className="text-xs text-muted-foreground mt-1">
              <BilingualLabel
                ja="送信前の最終確認として必須です。"
                en="Required final acknowledgement before send."
              />
            </p>
          )}
        </div>
      </label>

      {!state.allPassing && (
        <p className="text-xs text-muted-foreground pt-1">
          <BilingualLabel
            ja="すべて満たすまで送信できません。"
            en="Send is disabled until all four items pass."
          />
        </p>
      )}
    </div>
  );
}

function ChecklistRow({
  ok,
  ja,
  en,
  detail,
}: {
  ok: boolean;
  ja: string;
  en: string;
  detail: { ja: string; en: string } | null;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2Icon className="size-4 text-emerald-600 mt-0.5 shrink-0" />
      ) : detail ? (
        <XCircleIcon className="size-4 text-destructive mt-0.5 shrink-0" />
      ) : (
        <CircleIcon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      )}
      <div className="space-y-0.5">
        <div>
          <BilingualLabel ja={ja} en={en} />
        </div>
        {!ok && detail && (
          <p className="text-xs text-muted-foreground">
            <BilingualLabel ja={detail.ja} en={detail.en} />
          </p>
        )}
      </div>
    </div>
  );
}
