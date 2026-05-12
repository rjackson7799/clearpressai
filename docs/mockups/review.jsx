// Three-Variant Review page

const VARIANTS = [
  {
    id: 'v1',
    name: 'バージョン1',
    sub: 'フォーマル',
    en: 'Formal',
    tone: 'green',
    status: 'clean',
    issueCount: 0,
    issueLabel: '0件の問題',
    issueEn: '0 issues',
    approved: true,
    title: '武田薬品工業、第II相試験中間結果を発表 ― ALK陽性非小細胞肺癌治療薬「TK-2814」の安全性と忍容性を確認',
    paragraphs: [
      { text: '武田薬品工業株式会社（本社：大阪市中央区、社長：クリストフ・ウェバー、以下「武田薬品」）は、本日、ALK陽性非小細胞肺癌（NSCLC）を対象とした次世代経口治療薬「TK-2814」の第II相臨床試験における中間解析結果を発表しました。' },
      { text: '本試験は、既存治療で進行が認められた患者を対象に、TK-2814を1日1回経口投与した際の安全性および忍容性を評価することを主要目的としています。中間解析時点での被験者数は142名であり、所定の評価基準に基づき検討を行いました。' },
      { text: '解析の結果、本剤の忍容性は良好であり、新たな安全性上の懸念は認められませんでした。武田薬品は、本剤の開発を計画通り進め、2026年下期に第III相試験への移行を予定しています。' },
      { text: '武田薬品は、今後も革新的な医薬品の研究開発を通じて、患者さんとそのご家族のQOL向上に貢献してまいります。' },
    ],
  },
  {
    id: 'v2',
    name: 'バージョン2',
    sub: 'バランス',
    en: 'Balanced',
    tone: 'amber',
    status: 'warnings',
    issueCount: 2,
    issueLabel: '2件の警告',
    issueEn: '2 warnings',
    approved: false,
    title: '武田薬品、ALK陽性肺癌治療薬「TK-2814」が中間解析で有望なシグナル ― 第III相試験へ前進',
    paragraphs: [
      { text: '武田薬品工業株式会社（大阪市中央区、社長：クリストフ・ウェバー）は本日、ALK陽性非小細胞肺癌（NSCLC）に対する次世代経口治療薬「TK-2814」の第II相臨床試験において、', flags: [] },
      {
        text: '画期的な治療効果を示すデータが得られたと発表しました。',
        flagInline: { id: 'f1', severity: 'warning', phrase: '画期的な治療効果', range: [0, 8] },
      },
      { text: '本試験では、既存治療で進行が認められた患者142名を対象に、TK-2814を1日1回経口投与し、安全性および有効性を評価しました。中間解析の結果、奏効率（ORR）は58%、無増悪生存期間（PFS）の中央値は11.2ヶ月と、既存治療群と比較して優れた成績が示されました。' },
      {
        text: '副作用は軽度で、患者さんの生活の質を損なうことなく治療を継続できることが確認されました。',
        flagInline: { id: 'f2', severity: 'warning', phrase: '副作用は軽度で、患者さんの生活の質を損なうことなく治療を継続できる', range: [0, 35] },
      },
      { text: '武田薬品は本データを踏まえ、2026年下期の第III相試験移行を計画しており、ALK陽性NSCLC領域における新たな治療選択肢の提供を目指します。' },
    ],
  },
  {
    id: 'v3',
    name: 'バージョン3',
    sub: 'アクセシブル',
    en: 'Accessible',
    tone: 'red',
    status: 'blocker',
    issueCount: 1,
    issueLabel: '1件のブロッカー',
    issueEn: '1 blocker',
    approved: false,
    title: '武田薬品、ALK陽性肺癌の新薬「TK-2814」中間結果を発表 ― 多くの患者さんに希望をもたらす治療薬へ',
    paragraphs: [
      { text: '武田薬品工業株式会社（大阪市中央区）は本日、ALK陽性非小細胞肺癌の治療薬「TK-2814」の臨床試験の途中経過を発表しました。この薬は、1日1回飲むタイプの新しい治療薬です。' },
      { text: '142名の患者さんに参加していただいた今回の試験では、半数以上の方でがんが小さくなる効果が確認されました。また、副作用も比較的少なく、多くの方が治療を続けることができました。' },
      {
        text: 'これまで治療の選択肢が限られていた患者さんにとって、TK-2814は確実な治療効果が期待できる新しい希望となります。',
        flagInline: { id: 'f3', severity: 'blocker', phrase: '確実な治療効果が期待できる', range: [33, 46] },
      },
      { text: '武田薬品は、来年から最終段階の試験を始める予定です。一人でも多くの患者さんに、この新しい治療薬をお届けできるよう、開発を進めてまいります。' },
    ],
  },
];

const ISSUES_V2 = [
  {
    id: 'f1',
    severity: 'warning',
    label: '警告',
    phrase: '画期的な治療効果',
    paragraph: '第2段落',
    explanation: '最大級表現（「画期的」）は医薬品広告において誇大表現に該当する可能性があります。中間解析データに基づく表現としては根拠が不十分です。',
    citation: '薬機法 第66条',
    citationEn: 'Pharmaceutical Affairs Law, Art. 66',
    suggestion: '「臨床的に意義のある治療効果」または「統計学的有意な改善」への置換を推奨します。',
    expanded: true,
  },
  {
    id: 'f2',
    severity: 'warning',
    label: '警告',
    phrase: '副作用は軽度で、生活の質を損なうことなく',
    paragraph: '第4段落',
    explanation: '副作用について「軽度」「損なうことなく」と断定的に記述することは、患者の個別性を考慮せず誤認を招く恐れがあります。',
    citation: '医薬品等適正広告基準 第3-2',
    citationEn: 'Advertising Standards, §3-2',
    suggestion: '「観察された副作用は主にGrade 1–2であり、忍容性は良好でした」など、データに即した表現に修正することを推奨します。',
    expanded: false,
  },
  {
    id: 'f3',
    severity: 'note',
    label: '注記',
    phrase: '次世代経口治療薬',
    paragraph: '第1段落',
    explanation: '「次世代」は主観的修飾語のため、可能であればより具体的な記述（例：第二世代ALK阻害薬）が望まれます。ブロッカーではありません。',
    citation: 'ブランドボイス基準',
    citationEn: 'Brand Voice Guide',
    suggestion: '「第二世代ALK阻害薬」もしくは固有のクラス名を使用してください。',
    expanded: false,
  },
];

function StatusPill({ tone = 'amber', children }) {
  return <span className={'status-pill tone-' + tone}>{children}</span>;
}

function VariantDot({ tone, pulse }) {
  return <span className={'vd tone-' + tone + (pulse ? ' pulse' : '')} />;
}

function SegmentedVariantTabs({ active, onChange, view, setView, sentToClientDisabled }) {
  return (
    <div className="seg-row">
      <div className="seg-variants" role="tablist">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={active === v.id}
            className={'seg-tab' + (active === v.id ? ' on' : '')}
            onClick={() => onChange(v.id)}
          >
            <VariantDot tone={v.tone} />
            <span className="seg-tab-name">{v.name}: {v.sub}</span>
            <span className="seg-tab-en">{v.en}</span>
            {v.approved && (
              <span className="seg-approve" title="社内承認済">
                <IconCheck size={10} />
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="seg-view">
        <button className={view === 'side' ? 'on' : ''} onClick={() => setView('side')}>
          <ViewSideIcon /> <span>並列表示</span>
        </button>
        <button className={view === 'single' ? 'on' : ''} onClick={() => setView('single')}>
          <ViewSingleIcon /> <span>個別表示</span>
        </button>
      </div>
    </div>
  );
}

function ViewSideIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="16" y="4" width="5" height="16" rx="1"/>
    </svg>
  );
}
function ViewSingleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5"/>
    </svg>
  );
}
function PanelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="15" y1="4" x2="15" y2="20"/>
    </svg>
  );
}

function FlaggedSpan({ flag, paragraphText, onClick, popover, onClose }) {
  if (!flag) return <span>{paragraphText}</span>;
  const [start, end] = flag.range;
  const before = paragraphText.slice(0, start);
  const flagged = paragraphText.slice(start, end);
  const after = paragraphText.slice(end);
  return (
    <>
      {before}
      <span className={'flag-span sev-' + flag.severity} onClick={() => onClick(flag.id)}>
        {flagged}
        {popover && popover === flag.id && (
          <span className="flag-popover" onClick={(e) => e.stopPropagation()}>
            <span className="fp-row">
              <span className={'sev-icon sev-' + flag.severity}>
                {flag.severity === 'blocker' ? <IconAlert size={12}/> : <IconInfo size={12}/>}
              </span>
              <span className="fp-label">
                {flag.severity === 'blocker' ? 'ブロッカー' : '警告'} ·
                <span className="fp-cite"> 薬機法 第66条</span>
              </span>
              <button className="fp-close" onClick={onClose}><IconX size={11}/></button>
            </span>
            <span className="fp-text">
              {flag.severity === 'blocker'
                ? '「確実な」「期待できる」は効能効果の保証表現に該当します。'
                : '医薬品広告における誇大表現の可能性があります。'}
            </span>
            <span className="fp-actions">
              <button className="fp-btn primary">修正を適用</button>
              <button className="fp-btn">詳細</button>
            </span>
          </span>
        )}
      </span>
      {after}
    </>
  );
}

function VariantColumn({ variant, focused, onFocus, popover, setPopover, onApprove }) {
  const toneClass = 'tone-' + variant.tone;
  return (
    <article
      className={'vcol' + (focused ? ' focused' : '')}
      onClick={() => onFocus(variant.id)}
    >
      <header className={'vcol-head ' + toneClass}>
        <div className="vcol-head-l">
          <VariantDot tone={variant.tone} pulse={variant.tone === 'red' && focused} />
          <div className="vcol-head-titles">
            <div className="vcol-name">
              {variant.name}: {variant.sub}
              {variant.approved && (
                <span className="vcol-approve-badge">
                  <IconCheck size={9}/> 承認
                </span>
              )}
            </div>
            <div className="vcol-issues">
              <span className={'issue-count ' + toneClass}>{variant.issueLabel}</span>
              <span className="issue-en">{variant.issueEn}</span>
            </div>
          </div>
        </div>
        <button className="vcol-kebab" onClick={(e) => e.stopPropagation()}><IconMore size={14}/></button>
      </header>

      <div className="vcol-body">
        <h2 className="vcol-doc-title" contentEditable suppressContentEditableWarning>{variant.title}</h2>
        {variant.paragraphs.map((p, i) => (
          <p key={i} className="vcol-doc-p">
            <FlaggedSpan
              flag={p.flagInline}
              paragraphText={p.text}
              onClick={(id) => setPopover(id)}
              popover={popover}
              onClose={(e) => { e.stopPropagation(); setPopover(null); }}
            />
          </p>
        ))}
        <p className="vcol-doc-p vcol-doc-boiler">＜お問い合わせ先＞武田薬品工業株式会社 広報部 TEL: 03-XXXX-XXXX</p>
      </div>

      <footer className="vcol-foot">
        <button className="icon-btn" title="再生成"><IconSparkles size={13}/></button>
        <button className="icon-btn" title="コピー"><IconCopy size={13}/></button>
        <div className="vcol-foot-spacer" />
        <button
          className={'approve-action' + (variant.approved ? ' on' : '')}
          onClick={(e) => { e.stopPropagation(); onApprove(variant.id); }}
        >
          <span className={'approve-check' + (variant.approved ? ' on' : '')}>
            {variant.approved && <IconCheck size={10}/>}
          </span>
          <span>{variant.approved ? '社内承認済' : 'このバージョンを承認'}</span>
        </button>
      </footer>
    </article>
  );
}

function IconCopy(p) {
  return (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function ComplianceTab({ variant }) {
  const issues = ISSUES_V2;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const blockers = issues.filter(i => i.severity === 'blocker').length;
  const notes = issues.filter(i => i.severity === 'note').length;
  return (
    <>
      <div className="rp-summary">
        <div className="rp-summary-head">
          <div className="rp-summary-variant">
            <VariantDot tone={variant.tone}/>
            <span>{variant.name}: {variant.sub}</span>
          </div>
          <div className="rp-summary-counts">
            <span className="rpc-pill warn">
              <span className="rpc-dot warn"/>{warnings} 警告
            </span>
            <span className="rpc-pill block">
              <span className="rpc-dot block"/>{blockers} ブロッカー
            </span>
            <span className="rpc-pill note">
              <span className="rpc-dot note"/>{notes} 注記
            </span>
          </div>
        </div>
      </div>
      <div className="rp-issue-list">
        {issues.map((iss, idx) => <IssueCard key={iss.id} issue={iss} idx={idx}/>)}
      </div>
    </>
  );
}

function IssueCard({ issue, idx }) {
  const [expanded, setExpanded] = React.useState(issue.expanded);
  const sev = issue.severity;
  return (
    <div className={'issue-card sev-' + sev + (expanded ? ' expanded' : '')}>
      <div className="ic-head">
        <span className={'ic-sev sev-' + sev}>
          {sev === 'blocker' && <IconAlert size={12}/>}
          {sev === 'warning' && <IconInfo size={12}/>}
          {sev === 'note' && <IconInfo size={12}/>}
        </span>
        <span className={'ic-label sev-' + sev}>{issue.label}</span>
        <span className="ic-where">{issue.paragraph}</span>
        <button className="ic-toggle" onClick={() => setExpanded(!expanded)} aria-label="toggle">
          <IconChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/>
        </button>
      </div>
      <blockquote className={'ic-quote sev-' + sev}>「{issue.phrase}」</blockquote>
      <p className="ic-expl">{issue.explanation}</p>
      <div className="ic-cite">
        <span className="ic-cite-jp">{issue.citation}</span>
        <span className="ic-cite-en">{issue.citationEn}</span>
      </div>
      {expanded && (
        <div className="ic-suggest">
          <div className="ic-suggest-label">
            <IconSparkles size={11}/> 推奨修正
          </div>
          <p className="ic-suggest-text">{issue.suggestion}</p>
        </div>
      )}
      <div className="ic-actions">
        <button className={'ic-btn primary sev-' + sev}>
          <IconCheck size={11}/> 修正を適用
        </button>
        <button className="ic-btn">承認して続行</button>
      </div>
    </div>
  );
}

function BrandVoiceTab({ variant }) {
  const score = variant.id === 'v1' ? 92 : variant.id === 'v2' ? 78 : 64;
  const rows = [
    { label: 'フォーマリティ', en: 'Formality', target: '高', actual: variant.id === 'v1' ? '高' : variant.id === 'v2' ? '中' : '中', ok: variant.id !== 'v3' },
    { label: '専門性', en: 'Technicality', target: '高', actual: variant.id === 'v1' ? '高' : variant.id === 'v2' ? '中' : '低', ok: variant.id === 'v1' },
    { label: '簡潔性', en: 'Conciseness', target: '中', actual: '中', ok: true },
    { label: 'エンパシー', en: 'Empathy', target: '中', actual: variant.id === 'v3' ? '高' : '中', ok: true },
  ];
  return (
    <>
      <div className="bv-score">
        <div className="bv-score-ring">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
            <circle cx="34" cy="34" r="28" fill="none" stroke={score >= 85 ? '#16a34a' : score >= 70 ? '#f59e0b' : '#dc2626'}
              strokeWidth="6" strokeDasharray={`${(score / 100) * 175.9} 175.9`}
              strokeLinecap="round" transform="rotate(-90 34 34)"/>
          </svg>
          <div className="bv-score-num">{score}</div>
        </div>
        <div className="bv-score-meta">
          <div className="bv-score-label">武田薬品 ブランドボイス</div>
          <div className="bv-score-sub">クライアント基準との一致度</div>
        </div>
      </div>
      <div className="bv-axes">
        {rows.map((r) => (
          <div key={r.label} className="bv-axis">
            <div className="bv-axis-head">
              <span className="bv-axis-name">{r.label}</span>
              <span className="bv-axis-en">{r.en}</span>
              <span className={'bv-axis-mark ' + (r.ok ? 'ok' : 'no')}>
                {r.ok ? <IconCheck size={10}/> : <IconX size={10}/>}
              </span>
            </div>
            <div className="bv-axis-rail">
              <div className="bv-axis-target" style={{ left: r.target === '高' ? '85%' : r.target === '中' ? '50%' : '15%' }} title="目標">
                <span/>
              </div>
              <div className={'bv-axis-actual ' + (r.ok ? 'ok' : 'no')} style={{ left: r.actual === '高' ? '85%' : r.actual === '中' ? '50%' : '15%' }} title="実測">
                <span/>
              </div>
            </div>
            <div className="bv-axis-foot">
              <span>目標: {r.target}</span>
              <span>実測: {r.actual}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function HistoryTab({ variant }) {
  const events = [
    { time: '14:32', kind: 'gen', label: 'AI生成', detail: 'GPT-4 / 3バリアント' },
    { time: '14:38', kind: 'edit', label: '手動編集', detail: 'タイトル修正（佐藤）' },
    { time: '14:41', kind: 'compliance', label: 'コンプライアンス再実行', detail: '2件の警告検出' },
    { time: '14:45', kind: 'edit', label: '手動編集', detail: '第3段落 数値追加（佐藤）' },
    { time: '14:48', kind: 'approve', label: '社内承認', detail: variant.approved ? '佐藤 愛子' : '未承認', current: !variant.approved },
  ];
  return (
    <div className="hist">
      {events.map((e, i) => (
        <div key={i} className={'hist-row kind-' + e.kind + (e.current ? ' current' : '')}>
          <div className="hist-time">{e.time}</div>
          <div className="hist-bullet"><span/></div>
          <div className="hist-content">
            <div className="hist-label">{e.label}</div>
            <div className="hist-detail">{e.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RightPanel({ activeTab, setActiveTab, focusVariant, open, setOpen }) {
  if (!open) return null;
  return (
    <aside className="rpanel">
      <div className="rp-tabs">
        <button className={'rp-tab' + (activeTab === 'compliance' ? ' on' : '')} onClick={() => setActiveTab('compliance')}>
          <span>コンプライアンス</span>
          <span className="rp-tab-count warn">{ISSUES_V2.filter(i => i.severity !== 'note').length}</span>
        </button>
        <button className={'rp-tab' + (activeTab === 'voice' ? ' on' : '')} onClick={() => setActiveTab('voice')}>
          <span>ブランドボイス</span>
        </button>
        <button className={'rp-tab' + (activeTab === 'history' ? ' on' : '')} onClick={() => setActiveTab('history')}>
          <span>履歴</span>
        </button>
        <button className="rp-collapse" onClick={() => setOpen(false)} title="パネルを閉じる"><IconX size={13}/></button>
      </div>

      <div className="rp-focus-row">
        <span className="rp-focus-label">現在の対象</span>
        <span className="rp-focus-variant">
          <VariantDot tone={focusVariant.tone}/>
          <span>{focusVariant.name}: {focusVariant.sub}</span>
        </span>
      </div>

      <div className="rp-content">
        {activeTab === 'compliance' && <ComplianceTab variant={focusVariant}/>}
        {activeTab === 'voice' && <BrandVoiceTab variant={focusVariant}/>}
        {activeTab === 'history' && <HistoryTab variant={focusVariant}/>}
      </div>
    </aside>
  );
}

function ReviewPage({ approvalState }) {
  const [activeVariant, setActiveVariant] = React.useState('v2');
  const [view, setView] = React.useState('side');
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [panelTab, setPanelTab] = React.useState('compliance');
  const [popover, setPopover] = React.useState('f1'); // shown on focused variant by default
  const [approvedSet, setApprovedSet] = React.useState(() => {
    if (approvalState === 'none') return new Set();
    if (approvalState === 'all') return new Set(['v1', 'v2', 'v3']);
    return new Set(['v1']);
  });

  React.useEffect(() => {
    if (approvalState === 'none') setApprovedSet(new Set());
    else if (approvalState === 'all') setApprovedSet(new Set(['v1', 'v2', 'v3']));
    else setApprovedSet(new Set(['v1']));
  }, [approvalState]);

  const variantsWithApproval = VARIANTS.map(v => ({ ...v, approved: approvedSet.has(v.id) }));
  const focusVariant = variantsWithApproval.find(v => v.id === activeVariant) || variantsWithApproval[0];
  const anyApproved = approvedSet.size > 0;

  const toggleApprove = (id) => {
    const next = new Set(approvedSet);
    if (next.has(id)) next.delete(id); else next.add(id);
    setApprovedSet(next);
  };

  return (
    <div className="review-shell">
      {/* Project header strip */}
      <div className="proj-strip">
        <div className="proj-strip-l">
          <h1 className="proj-title">
            TK-2814 第II相試験中間報告
            <span className="proj-en">TK-2814 Phase II Interim</span>
          </h1>
          <div className="proj-crumb">
            <span>武田薬品工業</span>
            <span className="proj-crumb-sep">·</span>
            <span>プレスリリース</span>
            <span className="proj-crumb-sep">·</span>
            <span className="proj-due">納期 11月14日 17:00</span>
          </div>
        </div>
        <div className="proj-strip-r">
          <StatusPill tone="amber">
            <span className="status-dot"/>
            内部レビュー中
            <span className="status-en">Internal Review</span>
          </StatusPill>
          <button className="btn" onClick={() => setPanelOpen(!panelOpen)} title="パネル">
            <PanelIcon /> パネル
          </button>
          <button className="btn">
            <IconShare size={14}/> 全エクスポート
          </button>
          <button className={'btn primary send-btn' + (!anyApproved ? ' disabled' : '')} disabled={!anyApproved}>
            {!anyApproved && <span className="send-lock"><IconLock size={12}/></span>}
            クライアントへ送信
            <span className="send-en">Send to Client</span>
            <IconArrowRight size={13}/>
          </button>
        </div>
      </div>

      {/* Segmented tabs */}
      <SegmentedVariantTabs
        active={activeVariant}
        onChange={setActiveVariant}
        view={view}
        setView={setView}
        sentToClientDisabled={!anyApproved}
      />

      {/* Main 3-column + right panel */}
      <div className={'review-body' + (panelOpen ? ' panel-open' : '')}>
        <div className="vcol-grid">
          {variantsWithApproval.map(v => (
            <VariantColumn
              key={v.id}
              variant={v}
              focused={activeVariant === v.id}
              onFocus={setActiveVariant}
              popover={activeVariant === v.id ? popover : null}
              setPopover={setPopover}
              onApprove={toggleApprove}
            />
          ))}
        </div>

        <RightPanel
          activeTab={panelTab}
          setActiveTab={setPanelTab}
          focusVariant={focusVariant}
          open={panelOpen}
          setOpen={setPanelOpen}
        />
      </div>

      {!panelOpen && (
        <button className="rp-reopen" onClick={() => setPanelOpen(true)}>
          <PanelIcon/> パネルを開く
        </button>
      )}
    </div>
  );
}

function IconLock(p) {
  return (
    <svg width={p.size || 12} height={p.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
    </svg>
  );
}

Object.assign(window, { ReviewPage });
