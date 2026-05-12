// Delivery Composer page — internal-facing
// Pre-send composer with attachment config and tokenized feedback link

const DELIVERY_VARIANTS = [
  {
    id: 'v1',
    name: '案1 — フォーマル',
    en: 'Formal',
    tone: 'green',
    statusJa: '内部レビュー済み',
    statusEn: 'Clean',
    chars: 1842,
    selected: true,
  },
  {
    id: 'v2',
    name: '案2 — バランス',
    en: 'Balanced',
    tone: 'amber',
    statusJa: '注意1件（許容）',
    statusEn: '1 warning · accepted',
    chars: 1714,
    selected: true,
  },
  {
    id: 'v3',
    name: '案3 — 要点重視',
    en: 'Concise',
    tone: 'green',
    statusJa: '内部レビュー済み',
    statusEn: 'Clean',
    chars: 1206,
    selected: true,
  },
];

function ToneDot({ tone }) {
  const cls = { green: '#16a34a', amber: '#f59e0b', red: '#dc2626' }[tone] || '#94a3b8';
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: cls, flexShrink: 0, display: 'inline-block' }} />;
}

function DCSidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">C</div>
        <div className="logo-name">ClearPress<span className="ai">AI</span></div>
      </div>

      <div className="nav-section-label">メイン</div>
      <button className="nav-item">
        <span className="icon"><IconDashboard size={16} /></span>
        <span>ダッシュボード</span>
      </button>
      <button className="nav-item">
        <span className="icon"><IconClients size={16} /></span>
        <span>クライアント</span>
        <span className="nav-count">14</span>
      </button>
      <button className="nav-item active">
        <span className="icon"><IconProjects size={16} /></span>
        <span>プロジェクト</span>
        <span className="nav-count">32</span>
      </button>
      <button className="nav-item">
        <span className="icon"><IconSettings size={16} /></span>
        <span>設定</span>
      </button>

      <div className="nav-section-label">進行中</div>
      <button className="nav-item active" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>TK-2814 第II相</span>
      </button>
      <button className="nav-item" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>新CEO就任発表</span>
      </button>
      <button className="nav-item" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>新規リクエスト（下書き）</span>
      </button>

      <div className="nav-spacer" />

      <div className="profile">
        <div className="avatar">AS</div>
        <div className="profile-meta">
          <div className="profile-name">佐藤 愛子</div>
          <div className="profile-role">アカウントマネージャー</div>
        </div>
        <button className="profile-menu"><IconMore size={14} /></button>
      </div>
    </aside>
  );
}

function DCHeader({ language, setLanguage }) {
  return (
    <header className="header">
      <div className="crumbs">
        <button className="crumb"><IconHome size={13} style={{ verticalAlign: '-2px' }} /></button>
        <span className="crumb-sep">/</span>
        <button className="crumb">プロジェクト</button>
        <span className="crumb-sep">/</span>
        <button className="crumb">TK-2814 第II相</button>
        <span className="crumb-sep">/</span>
        <span className="crumb current">配信</span>
      </div>

      <div className="lang-toggle">
        <button className={'jp' + (language === 'ja' ? ' active' : '')} onClick={() => setLanguage('ja')}>日本語</button>
        <button className={(language === 'en' ? ' active' : '')} onClick={() => setLanguage('en')}>English</button>
      </div>

      <button className="header-icon-btn"><IconSearch size={16} /></button>
      <button className="header-icon-btn">
        <IconBell size={16} />
        <span className="dot" />
      </button>

      <div className="header-avatar">AS</div>
    </header>
  );
}

// ---------- Email composer (left column) ----------

function RecipientChip({ name, email, role, onRemove }) {
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2);
  return (
    <span className="rcp-chip">
      <span className="rcp-avatar">{initials}</span>
      <span className="rcp-name">{name}</span>
      <span className="rcp-sub">&lt;{email}&gt;</span>
      {onRemove && (
        <button className="rcp-x" onClick={onRemove}><IconX size={11} /></button>
      )}
    </span>
  );
}

function EmailComposer({ subjectEdited, onSubjectChange, ccOpen, setCcOpen, bodyText, onBodyChange }) {
  return (
    <div className="composer-card">
      <div className="composer-head">
        <div className="composer-head-l">
          <span className="composer-head-icon"><IconMemo size={15} /></span>
          <div>
            <div className="composer-head-title">メール作成</div>
            <div className="composer-head-sub">テンプレートから生成 · 編集可</div>
          </div>
        </div>
        <div className="composer-head-r">
          <span className="composer-tag">
            <IconSparkles size={11} />
            自動生成
          </span>
        </div>
      </div>

      <div className="composer-field">
        <label className="composer-label">
          <span className="cl-jp">宛先</span>
          <span className="cl-en">To</span>
        </label>
        <div className="composer-value">
          <RecipientChip name="田中 健一" email="k.tanaka@tanaka-pharma.co.jp" role="広報部 部長" />
          <button className="rcp-add">
            <IconPlus size={12} />
            追加
          </button>
        </div>
      </div>

      <div className="composer-field">
        <label className="composer-label">
          <span className="cl-jp">CC</span>
          <span className="cl-en">Cc</span>
        </label>
        <div className="composer-value">
          {ccOpen ? (
            <>
              <RecipientChip name="山本 美咲" email="m.yamamoto@tanaka-pharma.co.jp" onRemove={() => setCcOpen(false)} />
              <button className="rcp-add">
                <IconPlus size={12} />
                追加
              </button>
            </>
          ) : (
            <button className="composer-cc-toggle" onClick={() => setCcOpen(true)}>
              <IconPlus size={12} />
              CCを追加
            </button>
          )}
        </div>
      </div>

      <div className="composer-field">
        <label className="composer-label">
          <span className="cl-jp">件名</span>
          <span className="cl-en">Subject</span>
        </label>
        <div className="composer-value">
          <input
            type="text"
            className="composer-subject"
            value={subjectEdited}
            onChange={(e) => onSubjectChange(e.target.value)}
          />
        </div>
      </div>

      <div className="composer-body-wrap">
        <textarea
          className="composer-body"
          value={bodyText}
          onChange={(e) => onBodyChange(e.target.value)}
          spellCheck={false}
        />
        <div className="composer-body-toolbar">
          <div className="cbt-l">
            <button className="cbt-btn" title="太字"><b style={{ fontFamily: 'var(--font-en)' }}>B</b></button>
            <button className="cbt-btn" title="斜体"><i style={{ fontFamily: 'var(--font-en)' }}>I</i></button>
            <span className="cbt-sep" />
            <button className="cbt-btn" title="箇条書き"><IconList size={13} /></button>
            <button className="cbt-btn" title="引用"><IconQuote size={13} /></button>
            <button className="cbt-btn" title="リンク"><IconLink size={13} /></button>
          </div>
          <div className="cbt-note">
            <IconInfo size={11} />
            テンプレートから自動生成。自由に編集できます。
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Right rail config cards ----------

function AttachVersionRow({ v, onToggle }) {
  return (
    <label className={'attach-row' + (v.selected ? ' on' : '')}>
      <span className={'attach-check' + (v.selected ? ' on' : '')}>
        {v.selected && <IconCheck size={11} />}
      </span>
      <div className="attach-meta">
        <div className="attach-name">
          <span>{v.name}</span>
          <span className="attach-en">{v.en}</span>
        </div>
        <div className="attach-sub">
          <ToneDot tone={v.tone} />
          <span>{v.statusJa}</span>
          <span className="attach-dot">·</span>
          <span className="attach-chars">{v.chars.toLocaleString()}文字</span>
        </div>
      </div>
      <input
        type="checkbox"
        checked={v.selected}
        onChange={() => onToggle(v.id)}
        style={{ display: 'none' }}
      />
    </label>
  );
}

function FormatToggle({ value, onChange }) {
  const opts = [
    { id: 'pdf', label: 'PDF', en: '.pdf' },
    { id: 'word', label: 'Word', en: '.docx' },
    { id: 'both', label: '両方', en: 'Both' },
  ];
  return (
    <div className="fmt-toggle">
      {opts.map((o) => (
        <button
          key={o.id}
          className={'fmt-pill' + (value === o.id ? ' on' : '')}
          onClick={() => onChange(o.id)}
        >
          <span>{o.label}</span>
          <span className="fmt-en">{o.en}</span>
        </button>
      ))}
    </div>
  );
}

function FeedbackLinkBlock({ expiry, onExpiryChange, reminder, onReminderChange, copied, onCopy }) {
  return (
    <>
      <div className="link-row">
        <div className="link-url">
          <span className="link-proto">clearpress.ai/f/</span>
          <span className="link-token">tk2814-r3-9f2a…b71d</span>
        </div>
        <button className={'link-copy' + (copied ? ' copied' : '')} onClick={onCopy}>
          {copied ? <><IconCheck size={12} />コピー済み</> : <><IconCopy size={12} />コピー</>}
        </button>
      </div>

      <div className="link-detail">
        <div className="ld-row">
          <span className="ld-label">
            <IconClock size={12} />
            有効期限
          </span>
          <div className="ld-control">
            <select className="ld-select" value={expiry} onChange={(e) => onExpiryChange(e.target.value)}>
              <option value="7">7日後</option>
              <option value="14">14日後</option>
              <option value="30">30日後</option>
              <option value="60">60日後</option>
            </select>
            <span className="ld-date">2026年6月9日まで</span>
          </div>
        </div>

        <label className="ld-row toggle">
          <span className="ld-label">
            <IconBell size={12} />
            自動リマインダー
          </span>
          <span className="ld-control">
            <span className={'switch' + (reminder ? ' on' : '')} onClick={() => onReminderChange(!reminder)}>
              <span className="switch-knob" />
            </span>
            <span className="ld-note">7日後に送信</span>
          </span>
        </label>
      </div>

      <button className="link-preview">
        <IconExternal size={12} />
        <span>クライアントに見えるページをプレビュー</span>
        <span className="link-preview-en">Preview</span>
      </button>
    </>
  );
}

function ChecklistItem({ checked, locked, label, en, onChange }) {
  return (
    <label className={'check-item' + (checked ? ' on' : '') + (locked ? ' locked' : '')}>
      <span className={'check-box' + (checked ? ' on' : '')}>
        {checked && <IconCheck size={11} />}
      </span>
      <span className="check-text">
        <span className="check-jp">{label}</span>
        <span className="check-en">{en}</span>
      </span>
      {!locked && (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ display: 'none' }}
        />
      )}
      {locked && <span className="check-auto">自動</span>}
    </label>
  );
}

function ConfigCard({ icon, titleJa, titleEn, helper, children, defaultOpen = true }) {
  return (
    <section className="cfg-card">
      <header className="cfg-head">
        <span className="cfg-icon">{icon}</span>
        <div className="cfg-titles">
          <div className="cfg-title">{titleJa}</div>
          <div className="cfg-title-en">{titleEn}</div>
        </div>
      </header>
      <div className="cfg-body">
        {helper && <div className="cfg-helper">{helper}</div>}
        {children}
      </div>
    </section>
  );
}

function DeliveryRail({
  versions, onToggleVersion,
  format, onFormatChange,
  expiry, onExpiryChange,
  reminder, onReminderChange,
  copied, onCopy,
  checklist, onChecklistChange,
}) {
  const attachedCount = versions.filter((v) => v.selected).length;
  return (
    <aside className="rail">
      <ConfigCard
        icon={<IconPaperclip size={14} />}
        titleJa="添付するバージョン"
        titleEn="Versions to attach"
        helper={
          <>
            <IconSparkles size={11} style={{ verticalAlign: -2, marginRight: 4, color: '#3b82f6' }} />
            3つすべて添付すると学習効果が最大化されます
          </>
        }
      >
        <div className="attach-list">
          {versions.map((v) => (
            <AttachVersionRow key={v.id} v={v} onToggle={onToggleVersion} />
          ))}
        </div>
        <div className="attach-foot">
          <span>{attachedCount}件 添付</span>
          <span className="attach-foot-en">{attachedCount} attached</span>
        </div>
      </ConfigCard>

      <ConfigCard
        icon={<IconFile size={14} />}
        titleJa="エクスポート形式"
        titleEn="Export format"
      >
        <FormatToggle value={format} onChange={onFormatChange} />
      </ConfigCard>

      <ConfigCard
        icon={<IconLink size={14} />}
        titleJa="フィードバックリンク"
        titleEn="Feedback link"
      >
        <FeedbackLinkBlock
          expiry={expiry}
          onExpiryChange={onExpiryChange}
          reminder={reminder}
          onReminderChange={onReminderChange}
          copied={copied}
          onCopy={onCopy}
        />
      </ConfigCard>

      <ConfigCard
        icon={<IconCheckCircle size={14} />}
        titleJa="送信前チェック"
        titleEn="Pre-send checklist"
      >
        <div className="check-list">
          <ChecklistItem
            checked={true}
            locked={true}
            label="すべてのバリアントが内部レビュー済み"
            en="All variants internally reviewed"
          />
          <ChecklistItem
            checked={true}
            locked={true}
            label="コンプライアンスのブロッカーが解消済み"
            en="Compliance blockers resolved"
          />
          <ChecklistItem
            checked={true}
            locked={true}
            label="ブランドボイスが適用されている"
            en="Brand voice applied"
          />
          <ChecklistItem
            checked={checklist.manual}
            locked={false}
            label="件名と本文を最終確認した"
            en="Subject and body final-checked"
            onChange={(v) => onChecklistChange('manual', v)}
          />
        </div>
      </ConfigCard>
    </aside>
  );
}

// ---------- Fixed bottom send bar ----------

function SendBar({ canSend, attachedCount, format, onSend }) {
  const formatLabel = { pdf: 'PDF', word: 'Word', both: 'PDF + Word' }[format];
  return (
    <div className="sendbar">
      <div className="sendbar-inner">
        <div className="sendbar-summary">
          <div className="sendbar-summary-row">
            <span className="ss-icon"><IconPaperclip size={12} /></span>
            <span className="ss-text">
              <b>{attachedCount}件</b>の添付・{formatLabel}形式・フィードバックリンク有効
            </span>
          </div>
          <div className="sendbar-summary-row sub">
            宛先: 田中 健一 &lt;k.tanaka@tanaka-pharma.co.jp&gt;
          </div>
        </div>

        <div className="sendbar-actions">
          <button className="btn">
            <IconSave size={13} />
            下書き保存
          </button>
          <button className="btn">
            <IconClock size={13} />
            送信予約
          </button>
          <button
            className={'btn primary sendbar-send' + (canSend ? '' : ' disabled')}
            disabled={!canSend}
            onClick={onSend}
          >
            {!canSend && <IconLock size={12} />}
            <span>送信</span>
            <span className="sendbar-send-en">Send</span>
            {canSend && <IconArrowRight size={13} />}
          </button>
        </div>
      </div>
      {!canSend && (
        <div className="sendbar-blocker">
          <IconInfo size={12} />
          最終確認のチェックを入れると送信できます
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------

function DeliveryPage({ language }) {
  const [versions, setVersions] = React.useState(DELIVERY_VARIANTS);
  const [format, setFormat] = React.useState('both');
  const [expiry, setExpiry] = React.useState('30');
  const [reminder, setReminder] = React.useState(true);
  const [copied, setCopied] = React.useState(false);
  const [ccOpen, setCcOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState({ manual: false });
  const [subject, setSubject] = React.useState('【ご確認】タケロチニブ第II相試験 結果発表のプレスリリース 3案');
  const [body, setBody] = React.useState(
`田中製薬株式会社
広報部 田中 健一様

いつも大変お世話になっております。
佐藤 愛子（Tanaka & Associates PR）でございます。

先日ご相談いただきました、タケロチニブ第II相試験 結果発表のプレスリリース原稿について、3案を作成いたしましたのでお送りいたします。

  ・案1 フォーマル：従来路線、引用を厚めに
  ・案2 バランス：見出しを動かし、データ要約を冒頭に
  ・案3 要点重視：短尺・SNS共有を想定した構成

ご確認の上、下記のフィードバックリンクよりお好みのバージョンと改善点をお知らせください。最終版を準備いたします。

  フィードバックリンク（5月10日 → 6月9日まで有効）

なお、お忙しいところ恐縮ですが、5月17日（金）までにご返信いただけますと幸いです。

何かご不明な点がございましたら、お気軽にご連絡ください。
引き続きどうぞよろしくお願いいたします。

————————————————
佐藤 愛子 / Aiko Sato
Tanaka & Associates PR
アカウントマネージャー
a.sato@tanaka-pr.co.jp
+81 3-XXXX-XXXX`
  );

  const toggleVersion = (id) => {
    setVersions((vs) => vs.map((v) => v.id === id ? { ...v, selected: !v.selected } : v));
  };
  const onCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const onChecklistChange = (key, v) => setChecklist((c) => ({ ...c, [key]: v }));

  const attachedCount = versions.filter((v) => v.selected).length;
  const allAutoChecks = true; // 3 items are auto-confirmed in this mock
  const canSend = checklist.manual && attachedCount > 0 && allAutoChecks;

  return (
    <div className="content" data-screen-label="05 Delivery Composer">
      <div className="page-head delivery-head">
        <div>
          <h1 className="page-title">
            配信
            <span className="romaji">Deliver</span>
          </h1>
          <div className="page-sub">
            <span>TK-2814 第II相試験 結果発表</span>
            <span className="page-sub-dot" />
            <span>クライアント: 田中製薬株式会社</span>
            <span className="page-sub-dot" />
            <span className="tag">
              <span className="tag-dot" />
              送信準備完了
            </span>
          </div>
        </div>
        <div className="head-actions">
          <button className="btn">
            <IconChevronLeft size={13} />
            レビューに戻る
          </button>
        </div>
      </div>

      <div className="dc-grid">
        <div className="dc-left">
          <EmailComposer
            subjectEdited={subject}
            onSubjectChange={setSubject}
            ccOpen={ccOpen}
            setCcOpen={setCcOpen}
            bodyText={body}
            onBodyChange={setBody}
          />
        </div>

        <div className="dc-right">
          <DeliveryRail
            versions={versions}
            onToggleVersion={toggleVersion}
            format={format}
            onFormatChange={setFormat}
            expiry={expiry}
            onExpiryChange={setExpiry}
            reminder={reminder}
            onReminderChange={setReminder}
            copied={copied}
            onCopy={onCopy}
            checklist={checklist}
            onChecklistChange={onChecklistChange}
          />
        </div>
      </div>

      <SendBar
        canSend={canSend}
        attachedCount={attachedCount}
        format={format}
        onSend={() => {}}
      />
    </div>
  );
}

Object.assign(window, { DeliveryPage });
