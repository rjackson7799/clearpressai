// Compliance Audit Report page

const AUDIT_META = {
  project: 'TK-2814 第II相試験 中間結果プレスリリース',
  projectEn: 'TK-2814 Phase II Interim Results Press Release',
  client: '武田薬品工業株式会社',
  clientEn: 'Takeda Pharmaceutical Co., Ltd.',
  contentType: 'プレスリリース（メディア向け）',
  contentTypeEn: 'Press Release (Media)',
  versions: ['バージョン1: フォーマル', 'バージョン2: バランス', 'バージョン3: アクセシブル'],
  generated: '2026年11月12日 14:32 JST',
  reviewer: '佐藤 愛子',
  reviewerRole: 'シニア アカウントマネージャー',
  reviewerEmail: 'a.sato@pacific-pr.co.jp',
  reportId: 'AUD-2026-1112-0048',
};

const AUDIT_VARIANTS = [
  {
    id: 'v1',
    name: 'バージョン1',
    sub: 'フォーマル',
    en: 'Formal',
    verdict: 'clean',
    verdictLabel: '問題なし',
    verdictEn: 'Clean',
    tone: 'green',
    counts: { blocker: 0, warning: 0, note: 1 },
    issues: [
      {
        severity: 'note',
        label: '注記',
        para: '第1段落',
        phrase: '次世代経口治療薬',
        regulation: 'ブランドボイス基準',
        regulationEn: 'Brand Voice Guide §2.4',
        concern: '「次世代」は主観的修飾語のため、可能であればより具体的な記述（第二世代ALK阻害薬など）が望まれます。法令違反には該当しません。',
        suggestion: '「第二世代ALK阻害薬」または固有のクラス名を使用してください。',
        status: 'acknowledged',
      },
    ],
    disclosures: { isi: true, references: true, boilerplate: true },
  },
  {
    id: 'v2',
    name: 'バージョン2',
    sub: 'バランス',
    en: 'Balanced',
    verdict: 'warnings',
    verdictLabel: '警告あり（修正済）',
    verdictEn: 'Warnings (Resolved)',
    tone: 'amber',
    counts: { blocker: 0, warning: 2, note: 0 },
    issues: [
      {
        severity: 'warning',
        label: '警告',
        para: '第2段落',
        phrase: '画期的な治療効果を示すデータが得られた',
        regulation: '薬機法 第66条',
        regulationEn: 'Pharmaceutical Affairs Law, Art. 66',
        concern: '最大級表現（「画期的」）は医薬品広告において誇大表現に該当する可能性があります。中間解析データに基づく表現としては根拠が不十分です。',
        suggestion: '「臨床的に意義のある治療効果を示すデータが得られた」または「統計学的に有意な改善が確認された」への置換。',
        suggestionApplied: '臨床的に意義のある治療効果を示すデータが得られた',
        status: 'fixed',
      },
      {
        severity: 'warning',
        label: '警告',
        para: '第4段落',
        phrase: '副作用は軽度で、患者さんの生活の質を損なうことなく治療を継続できる',
        regulation: '医薬品等適正広告基準 第3-2',
        regulationEn: 'Advertising Standards, §3-2',
        concern: '副作用について「軽度」「損なうことなく」と断定的に記述することは、患者の個別性を考慮せず誤認を招く恐れがあります。',
        suggestion: '「観察された副作用は主にGrade 1–2であり、忍容性は良好でした」など、データに即した表現に修正。',
        suggestionApplied: '観察された副作用は主にGrade 1–2であり、忍容性は良好でした',
        status: 'fixed',
      },
    ],
    disclosures: { isi: true, references: true, boilerplate: true },
  },
  {
    id: 'v3',
    name: 'バージョン3',
    sub: 'アクセシブル',
    en: 'Accessible',
    verdict: 'blocker-resolved',
    verdictLabel: 'ブロッカー（修正済）',
    verdictEn: 'Blocker (Resolved)',
    tone: 'red',
    counts: { blocker: 1, warning: 0, note: 1 },
    issues: [
      {
        severity: 'blocker',
        label: 'ブロッカー',
        para: '第3段落',
        phrase: '確実な治療効果が期待できる新しい希望',
        regulation: '薬機法 第66条 ／ 医薬品等適正広告基準 第3-1',
        regulationEn: 'Pharm. Affairs Law Art. 66 / Adv. Std. §3-1',
        concern: '「確実な」「期待できる」は効能効果の保証表現に該当し、医薬品の広告において明確に禁止されています。このまま公開することはできません。',
        suggestion: '「臨床試験で有効性が示された治療選択肢」など、効果を保証しない事実ベースの記述に修正。',
        suggestionApplied: '臨床試験で有効性が示された治療選択肢',
        status: 'fixed',
      },
      {
        severity: 'note',
        label: '注記',
        para: '第2段落',
        phrase: '半数以上の方でがんが小さくなる',
        regulation: 'ブランドボイス基準',
        regulationEn: 'Brand Voice Guide §3.1',
        concern: '平易な表現は読者にとって理解しやすい一方、医療従事者向け資料では具体的な数値（奏効率58%）の併記が望まれます。',
        suggestion: '括弧書きで「（奏効率58%）」を併記することを推奨。',
        status: 'acknowledged',
      },
    ],
    disclosures: { isi: true, references: true, boilerplate: false },
  },
];

const AUDIT_TRAIL = [
  { time: '2026/11/12 14:32 JST', actor: 'システム', actorEn: 'System', action: 'AI生成（3バリアント）', detail: 'GPT-4 Turbo, ClearPress 規程 v3.2' },
  { time: '2026/11/12 14:41 JST', actor: 'システム', actorEn: 'System', action: 'コンプライアンス自動検査', detail: '薬機法 / 適正広告基準 ／ ブランドボイス基準' },
  { time: '2026/11/12 15:12 JST', actor: '佐藤 愛子', actorEn: 'Aiko Sato', action: '手動レビュー開始', detail: '計4件の指摘を確認' },
  { time: '2026/11/12 15:46 JST', actor: '佐藤 愛子', actorEn: 'Aiko Sato', action: '推奨修正を適用（3件）', detail: 'V2 ×2、V3 ×1' },
  { time: '2026/11/12 16:03 JST', actor: '佐藤 愛子', actorEn: 'Aiko Sato', action: 'コンプライアンス再検査', detail: '全ブロッカー解消を確認' },
  { time: '2026/11/12 16:08 JST', actor: '佐藤 愛子', actorEn: 'Aiko Sato', action: 'サインオフ（承認）', detail: '電子署名 SHA-256: a7f3…91c2', current: true },
];

function VerdictPill({ tone, children, sub }) {
  return (
    <span className={'verdict tone-' + tone}>
      <span className={'verdict-dot tone-' + tone}/>
      <span>{children}</span>
      {sub && <span className="verdict-en">{sub}</span>}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const label = severity === 'blocker' ? 'ブロッカー' : severity === 'warning' ? '警告' : '注記';
  return (
    <span className={'sev-badge sev-' + severity}>
      <span className={'sev-badge-dot sev-' + severity}/>
      {label}
    </span>
  );
}

function StatusPip({ status }) {
  const tone = status === 'fixed' ? 'green' : status === 'acknowledged' ? 'gray' : 'red';
  const label = status === 'fixed' ? '修正済み' : status === 'acknowledged' ? '承認済み' : '未解決';
  const en = status === 'fixed' ? 'Fixed' : status === 'acknowledged' ? 'Acknowledged' : 'Unresolved';
  return (
    <span className={'status-pip tone-' + tone}>
      {status === 'fixed' && <IconCheck size={11}/>}
      {status === 'acknowledged' && <IconCheck size={11}/>}
      {status === 'unresolved' && <IconAlert size={11}/>}
      <span>{label}</span>
      <span className="status-pip-en">{en}</span>
    </span>
  );
}

function ReportHeader({ exported }) {
  return (
    <div className="rep-header">
      <div className="rep-header-l">
        <div className="rep-eyebrow">
          <span>レポートID</span>
          <span className="rep-eyebrow-id">{AUDIT_META.reportId}</span>
          <span className="rep-eyebrow-sep">·</span>
          <span>v1.0 確定</span>
        </div>
        <h1 className="rep-title">
          コンプライアンス監査レポート
          <span className="rep-title-en">Compliance Audit Report</span>
        </h1>
        <div className="rep-sub">
          <span className="rep-sub-client">{AUDIT_META.client}</span>
          <span className="rep-sub-sep">／</span>
          <span>{AUDIT_META.project}</span>
        </div>
        <div className="rep-sub2">
          <span>生成: {AUDIT_META.generated}</span>
          <span className="rep-sub-sep">·</span>
          <span>担当: {AUDIT_META.reviewer}</span>
        </div>
      </div>
      <div className="rep-header-r">
        <div className="approved-stamp">
          <div className="stamp-ring">
            <div className="stamp-inner">
              <div className="stamp-top">APPROVED</div>
              <div className="stamp-mid">承認済</div>
              <div className="stamp-bot">2026.11.12</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportActions() {
  return (
    <div className="rep-actions">
      <div className="rep-actions-l">
        <span className="rep-pages">全 4 ページ</span>
        <span className="rep-divider"/>
        <span className="rep-meta-line">関係者外秘 · CONFIDENTIAL</span>
      </div>
      <div className="rep-actions-r">
        <button className="btn">
          <IconCopy size={13}/> リンクをコピー
        </button>
        <button className="btn">
          <IconShare size={13}/> 共有
        </button>
        <button className="btn primary">
          <IconDownload size={13}/> PDFでエクスポート
          <span className="btn-en">Export as PDF</span>
        </button>
      </div>
    </div>
  );
}

function MetaBlock() {
  const rows = [
    { label: '案件名', en: 'Project', val: AUDIT_META.project, sub: AUDIT_META.projectEn },
    { label: 'クライアント', en: 'Client', val: AUDIT_META.client, sub: AUDIT_META.clientEn, avatar: 'T' },
    { label: 'コンテンツタイプ', en: 'Content Type', val: AUDIT_META.contentType, sub: AUDIT_META.contentTypeEn },
    { label: 'レビュー対象', en: 'Versions Reviewed', val: 'versions' },
    { label: '生成日時', en: 'Generated', val: AUDIT_META.generated, mono: true },
    { label: 'レビュー担当者', en: 'Reviewer', val: 'reviewer' },
  ];
  return (
    <section className="meta-card">
      <header className="meta-card-head">
        <div className="meta-card-titles">
          <h2 className="meta-card-title">案件情報</h2>
          <span className="meta-card-en">Project Metadata</span>
        </div>
        <button className="meta-card-signoff signed">
          <span className="signoff-check"><IconCheck size={11}/></span>
          <span>サインオフ済み</span>
          <span className="signoff-en">Signed off</span>
        </button>
      </header>
      <div className="meta-rows">
        {rows.map((r, i) => (
          <div className="meta-row" key={i}>
            <div className="meta-key">
              <span className="meta-key-jp">{r.label}</span>
              <span className="meta-key-en">{r.en}</span>
            </div>
            <div className={'meta-val' + (r.mono ? ' mono' : '')}>
              {r.val === 'versions' ? (
                <div className="meta-versions">
                  {AUDIT_META.versions.map((v, j) => (
                    <span key={j} className="meta-version-chip">
                      <span className={'vd-mini tone-' + (j === 0 ? 'green' : j === 1 ? 'amber' : 'red')}/>
                      {v}
                    </span>
                  ))}
                </div>
              ) : r.val === 'reviewer' ? (
                <div className="meta-reviewer">
                  <div className="meta-avatar">AS</div>
                  <div className="meta-reviewer-meta">
                    <div className="meta-reviewer-name">{AUDIT_META.reviewer}</div>
                    <div className="meta-reviewer-role">{AUDIT_META.reviewerRole}</div>
                  </div>
                </div>
              ) : (
                <>
                  <span>{r.val}</span>
                  {r.sub && <span className="meta-val-en">{r.sub}</span>}
                  {r.avatar && <span className="meta-client-avatar">{r.avatar}</span>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VariantCard({ variant, idx }) {
  return (
    <section className={'va-card va-tone-' + variant.tone}>
      <header className="va-card-head">
        <div className="va-card-head-l">
          <div className={'va-card-mark va-tone-' + variant.tone}>
            <span className="va-card-num">{idx + 1}</span>
          </div>
          <div className="va-card-titles">
            <h3 className="va-card-title">
              {variant.name}: {variant.sub}
              <span className="va-card-title-en">Version {idx + 1} · {variant.en}</span>
            </h3>
            <div className="va-card-counts">
              <span className="va-count-pill block">
                <span className="va-count-num">{variant.counts.blocker}</span>
                <span className="va-count-lbl">ブロッカー</span>
              </span>
              <span className="va-count-pill warn">
                <span className="va-count-num">{variant.counts.warning}</span>
                <span className="va-count-lbl">警告</span>
              </span>
              <span className="va-count-pill note">
                <span className="va-count-num">{variant.counts.note}</span>
                <span className="va-count-lbl">注記</span>
              </span>
            </div>
          </div>
        </div>
        <VerdictPill tone={variant.tone} sub={variant.verdictEn}>{variant.verdictLabel}</VerdictPill>
      </header>

      {variant.issues.length === 0 ? (
        <div className="va-empty">
          <span className="va-empty-icon"><IconCheck size={16}/></span>
          <div>
            <div className="va-empty-title">指摘事項なし</div>
            <div className="va-empty-sub">全ての自動チェックを通過しました。</div>
          </div>
        </div>
      ) : (
        <ol className="issue-list">
          {variant.issues.map((iss, i) => (
            <li key={i} className={'iss-item sev-' + iss.severity}>
              <div className="iss-num-col">
                <div className="iss-num">{i + 1}</div>
                <div className="iss-num-rail"/>
              </div>
              <div className="iss-body">
                <div className="iss-head">
                  <SeverityBadge severity={iss.severity}/>
                  <span className="iss-where">{iss.para}</span>
                  <span className="iss-spacer"/>
                  <StatusPip status={iss.status}/>
                </div>

                <div className="iss-quote-row">
                  <div className="iss-quote-label">引用</div>
                  <blockquote className={iss.suggestionApplied ? 'iss-quote strikethrough' : 'iss-quote'}>
                    <span className="iss-quote-mark">「</span>
                    {iss.phrase}
                    <span className="iss-quote-mark">」</span>
                  </blockquote>
                </div>

                {iss.suggestionApplied && (
                  <div className="iss-quote-row">
                    <div className="iss-quote-label fixed">修正後</div>
                    <blockquote className="iss-quote fixed">
                      <span className="iss-quote-mark">「</span>
                      {iss.suggestionApplied}
                      <span className="iss-quote-mark">」</span>
                    </blockquote>
                  </div>
                )}

                <div className="iss-reg">
                  <span className="iss-reg-jp">{iss.regulation}</span>
                  <span className="iss-reg-en">{iss.regulationEn}</span>
                </div>

                <div className="iss-grid">
                  <div className="iss-field">
                    <div className="iss-field-label">指摘内容</div>
                    <p className="iss-field-text">{iss.concern}</p>
                  </div>
                  <div className="iss-field">
                    <div className="iss-field-label">推奨修正</div>
                    <p className="iss-field-text">{iss.suggestion}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <footer className="disc-foot">
        <div className="disc-foot-label">
          <span className="disc-foot-label-jp">必須記載事項</span>
          <span className="disc-foot-label-en">Required Disclosures</span>
        </div>
        <div className="disc-list">
          <DiscItem ok={variant.disclosures.isi} jp="重要安全性情報（ISI）" en="Important Safety Information"/>
          <DiscItem ok={variant.disclosures.references} jp="臨床試験出典の引用" en="Clinical references cited"/>
          <DiscItem ok={variant.disclosures.boilerplate} jp="会社ボイラープレート" en="Company boilerplate"/>
        </div>
      </footer>
    </section>
  );
}

function DiscItem({ ok, jp, en }) {
  return (
    <div className={'disc-item ' + (ok ? 'ok' : 'no')}>
      <span className="disc-mark">{ok ? <IconCheck size={11}/> : <IconX size={11}/>}</span>
      <span className="disc-jp">{jp}</span>
      <span className="disc-en">{en}</span>
    </div>
  );
}

function SignOffSection() {
  return (
    <section className="signoff-card">
      <header className="meta-card-head">
        <div className="meta-card-titles">
          <h2 className="meta-card-title">レビュアー サインオフ</h2>
          <span className="meta-card-en">Reviewer Sign-Off</span>
        </div>
        <span className="meta-card-stamp">
          <IconCheck size={12}/> 確定済み
        </span>
      </header>
      <div className="signoff-grid">
        <div className="signoff-l">
          <div className="signoff-field">
            <div className="signoff-field-label">レビュアー名 · Reviewer</div>
            <div className="signoff-value">
              <div className="meta-avatar lg">AS</div>
              <div>
                <div className="signoff-name">{AUDIT_META.reviewer}</div>
                <div className="signoff-role">{AUDIT_META.reviewerRole} · {AUDIT_META.reviewerEmail}</div>
              </div>
            </div>
          </div>
          <div className="signoff-row-2">
            <div className="signoff-field">
              <div className="signoff-field-label">サインオフ日時 · Date</div>
              <div className="signoff-mono">2026年11月12日 16:08 JST</div>
            </div>
            <div className="signoff-field">
              <div className="signoff-field-label">電子署名ハッシュ · Digital Signature</div>
              <div className="signoff-mono">SHA-256: a7f3 2e8b 4c91 …91c2</div>
            </div>
          </div>
          <div className="signoff-field">
            <div className="signoff-field-label">所見・コメント · Comments</div>
            <div className="signoff-comment">
              V2（バランス）を最終提出案として推奨。指摘されていた2件の警告（薬機法第66条、適正広告基準第3-2）は全て推奨修正を適用済み。
              V3（アクセシブル）は患者向け配布資料として有用ですが、メディア向け配信には不向きと判断します。
              全バリアントとも社内コンプライアンス基準を満たしており、クライアント送信を承認します。
            </div>
          </div>
        </div>
        <div className="signoff-r">
          <div className="signoff-field">
            <div className="signoff-field-label">手書き署名 · Signature</div>
            <div className="signoff-sig">
              <svg viewBox="0 0 240 100" className="sig-svg" aria-hidden="true">
                <path d="M 16 70 Q 22 30 32 50 T 56 64 Q 64 30 76 56 T 100 60 Q 112 30 118 58 T 144 50 Q 154 22 168 56 Q 176 70 192 40 Q 204 22 220 60" stroke="#1e3a8a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 22 78 L 218 78" stroke="#1e3a8a" strokeWidth="0.8" fill="none" strokeDasharray="0"/>
                <text x="120" y="93" textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize="8" fill="#64748b">Aiko Sato · 佐藤 愛子</text>
              </svg>
            </div>
            <div className="signoff-cert">
              <IconShield size={12}/>
              <span>Pacific PR 認証局による電子署名 · TLS 1.3</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuditTrail() {
  return (
    <section className="trail-card">
      <header className="meta-card-head">
        <div className="meta-card-titles">
          <h2 className="meta-card-title">監査証跡</h2>
          <span className="meta-card-en">Audit Trail</span>
        </div>
        <span className="trail-count">{AUDIT_TRAIL.length} 件のイベント</span>
      </header>
      <div className="trail-table">
        <div className="trail-row trail-head">
          <div>タイムスタンプ</div>
          <div>主体</div>
          <div>イベント</div>
          <div>詳細</div>
        </div>
        {AUDIT_TRAIL.map((e, i) => (
          <div key={i} className={'trail-row' + (e.current ? ' current' : '')}>
            <div className="trail-time">{e.time}</div>
            <div className="trail-actor">
              <span className={'trail-actor-dot ' + (e.actor === 'システム' ? 'sys' : 'human')}/>
              <div>
                <div className="trail-actor-jp">{e.actor}</div>
                <div className="trail-actor-en">{e.actorEn}</div>
              </div>
            </div>
            <div className="trail-action">{e.action}</div>
            <div className="trail-detail">{e.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IconDownload(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function IconCopy(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IconShield(p) {
  return (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function AuditReport() {
  return (
    <div className="report">
      <ReportActions />
      <article className="report-paper">
        <ReportHeader />
        <MetaBlock />

        <div className="section-divider">
          <span className="section-divider-num">II</span>
          <span className="section-divider-title">バリアント別 指摘事項</span>
          <span className="section-divider-en">Findings by Variant</span>
        </div>

        <div className="variants-stack">
          {AUDIT_VARIANTS.map((v, i) => <VariantCard key={v.id} variant={v} idx={i}/>)}
        </div>

        <div className="section-divider">
          <span className="section-divider-num">III</span>
          <span className="section-divider-title">サインオフ & 監査証跡</span>
          <span className="section-divider-en">Sign-Off & Audit Trail</span>
        </div>

        <SignOffSection />
        <AuditTrail />

        <footer className="report-foot">
          <div className="report-foot-l">
            <div className="logo-mark sm">C</div>
            <div>
              <div className="report-foot-title">ClearPress AI · Compliance Audit Report</div>
              <div className="report-foot-sub">Pacific PR Tokyo / Generated 2026-11-12 / レポートID {AUDIT_META.reportId}</div>
            </div>
          </div>
          <div className="report-foot-r">
            <span>4 / 4</span>
          </div>
        </footer>
      </article>
    </div>
  );
}

Object.assign(window, { AuditReport });
