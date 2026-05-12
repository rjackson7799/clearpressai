// Client Feedback page — public, mobile-first
// No app shell. Standalone polished page for client review.

const VARIANTS = [
  {
    id: 1,
    name: '案1',
    en: 'Formal',
    nameJa: 'フォーマル',
    title: 'タケロチニブ第II相試験において主要評価項目を達成 — 田中製薬',
    body: [
      '田中製薬株式会社（本社：東京都中央区、代表取締役社長：田中 正彦）は本日、当社が開発を進めるJAK1選択的阻害剤「タケロチニブ」（開発コード：TK-2814）について、中等症から重症の関節リウマチ患者を対象とした国内第II相臨床試験において、主要評価項目を達成したことをお知らせいたします。',
      '本試験は、既存治療で十分な効果が得られなかった患者240名を対象に、24週間にわたって有効性と安全性を評価したものです。投与開始から12週時点における ACR20 達成率は、プラセボ群と比較して統計学的に有意な改善を示しました。',
      '田中製薬 研究開発本部長の山田 一郎は次のように述べています。「本試験の結果は、長年にわたる基礎研究の成果が患者さんへの新しい選択肢として結実する可能性を示すものです。第III相試験への移行に向けて、引き続き慎重かつ着実に開発を進めてまいります。」',
      '当社は今後、規制当局との協議を経て第III相臨床試験への移行を予定しております。詳細な試験結果は、本年秋に開催予定の国際学会にて発表する予定です。',
    ],
    boiler: '本資料に記載されている将来の事業計画、業績見通し等は、現時点で入手可能な情報に基づき判断したものであり、実際の業績は、様々な要因により異なる可能性があります。',
  },
  {
    id: 2,
    name: '案2',
    en: 'Balanced',
    nameJa: 'バランス',
    title: 'JAK1阻害剤「タケロチニブ」第II相試験で主要評価項目を達成。第III相へ',
    body: [
      '田中製薬株式会社は、JAK1選択的阻害剤「タケロチニブ」（TK-2814）の国内第II相臨床試験で、主要評価項目を達成したと発表しました。試験は中等症から重症の関節リウマチ患者240名を対象に実施されました。',
      '主な結果は以下の通りです。',
      '・12週時点のACR20達成率：プラセボ群比で有意に高値',
      '・忍容性：既知の安全性プロファイルと概ね一致',
      '・重篤な有害事象：両群間で大きな差は認められず',
      '研究開発本部長の山田 一郎は「患者さんへの新しい選択肢を一日も早くお届けできるよう、第III相試験を着実に進めてまいります」とコメントしています。今後、規制当局との協議を経て第III相試験への移行を予定。詳細結果は本年秋の国際学会で発表される予定です。',
    ],
    boiler: '本資料に記載されている将来の事業計画、業績見通し等は、現時点で入手可能な情報に基づくものです。',
  },
  {
    id: 3,
    name: '案3',
    en: 'Concise',
    nameJa: '要点重視',
    title: 'タケロチニブ第II相、主要評価項目を達成',
    body: [
      '田中製薬（東証プライム）は本日、JAK1選択的阻害剤「タケロチニブ」（TK-2814）の国内第II相試験で主要評価項目を達成したと発表しました。',
      '関節リウマチ患者240名を対象に、12週時点のACR20達成率がプラセボ群を有意に上回りました。安全性プロファイルは既知の知見と一致しています。',
      '同社は規制当局との協議を経て、第III相試験への移行を予定。詳細は本年秋の国際学会で発表します。',
    ],
    boiler: '本資料は現時点での情報に基づいており、実際の業績は異なる可能性があります。',
  },
];

const CHIP_GROUPS = ['トーン', '構成', '長さ', '言葉選び', '冒頭', '結び', '引用の使い方'];

function PhoneStatusBar() {
  return (
    <div className="cf-statusbar">
      <span className="sb-time">9:41</span>
      <span className="sb-icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="6" width="3" height="5" rx="0.5"/>
          <rect x="4.5" y="4" width="3" height="7" rx="0.5"/>
          <rect x="9" y="2" width="3" height="9" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" opacity="0.4"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6.5 6.5 0 0 1 9 0M6 9.5a2.5 2.5 0 0 1 4 0"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <rect x="0.5" y="1" width="21" height="10" rx="2.5"/>
          <rect x="2" y="2.5" width="14" height="7" rx="1.5" fill="currentColor" stroke="none"/>
          <rect x="22.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" stroke="none"/>
        </svg>
      </span>
    </div>
  );
}

function CFHeader({ lang, setLang }) {
  return (
    <header className="cf-header">
      <div className="cf-wordmark">
        <span className="cf-wm-mark">C</span>
        <span className="cf-wm-name">ClearPress<span className="cf-wm-ai">AI</span></span>
      </div>
      <div className="cf-lang">
        <button className={'cf-lang-btn' + (lang === 'ja' ? ' on' : '')} onClick={() => setLang('ja')}>日本語</button>
        <button className={'cf-lang-btn' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>EN</button>
      </div>
    </header>
  );
}

function CFIntro() {
  return (
    <section className="cf-intro">
      <div className="cf-firm">
        <div className="cf-firm-mark">T&amp;A</div>
        <div className="cf-firm-name">
          <div className="cf-firm-line">Tanaka &amp; Associates PR</div>
          <div className="cf-firm-sub">担当: 佐藤 愛子</div>
        </div>
      </div>
      <h1 className="cf-title">ご確認のお願い</h1>
      <div className="cf-project">
        <div className="cf-project-name">TK-2814 第II相試験 結果発表</div>
        <div className="cf-project-meta">
          <span>プレスリリース</span>
          <span className="cf-dot" />
          <span>3案</span>
          <span className="cf-dot" />
          <span>2026年5月10日</span>
        </div>
      </div>
      <p className="cf-instruction">下記3案からお好みのバージョンを選択し、ご感想をお聞かせください。</p>
    </section>
  );
}

function CFVariantTabs({ active, onChange, selectedId }) {
  return (
    <div className="cf-tabs">
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          className={'cf-tab' + (active === v.id ? ' on' : '')}
          onClick={() => onChange(v.id)}
        >
          <div className="cf-tab-name">
            {v.name}
            {selectedId === v.id && (
              <span className="cf-tab-pick"><IconCheck size={9} /></span>
            )}
          </div>
          <div className="cf-tab-sub">{v.nameJa}</div>
        </button>
      ))}
    </div>
  );
}

function CFVariantBody({ variant, selected, onSelect }) {
  return (
    <article className="cf-variant">
      <div className="cf-variant-head">
        <div className="cf-variant-tag">
          <span className="cf-variant-name">{variant.name}</span>
          <span className="cf-variant-tone">— {variant.nameJa}</span>
        </div>
        <div className="cf-variant-meta">
          <span>{variant.body.reduce((s, p) => s + p.length, 0)}文字</span>
          <span className="cf-dot" />
          <span>約{Math.ceil(variant.body.reduce((s, p) => s + p.length, 0) / 500)}分で読了</span>
        </div>
      </div>

      <h2 className="cf-doc-title">{variant.title}</h2>
      <div className="cf-doc">
        {variant.body.map((p, i) => (
          <p key={i} className="cf-doc-p">{p}</p>
        ))}
        <p className="cf-doc-boiler">{variant.boiler}</p>
      </div>

      <button
        className={'cf-select' + (selected ? ' on' : '')}
        onClick={onSelect}
      >
        {selected ? (
          <><IconCheck size={14} /><span>このバージョンを選択中</span></>
        ) : (
          <><span>このバージョンを選択</span><IconArrowRight size={14} /></>
        )}
      </button>
    </article>
  );
}

function CFFeedback({ liked, setLiked, improve, setImprove, note, setNote, onSubmit }) {
  const toggle = (set, current, item) => {
    if (current.includes(item)) set(current.filter((x) => x !== item));
    else set([...current, item]);
  };
  return (
    <section className="cf-feedback">
      <header className="cf-fb-head">
        <div className="cf-fb-step">フィードバック</div>
        <div className="cf-fb-title">案1について</div>
        <div className="cf-fb-sub">該当する項目を選択してください（任意）</div>
      </header>

      <div className="cf-fb-section">
        <div className="cf-fb-label">
          <span className="cf-fb-label-dot good" />
          <span className="cf-fb-label-jp">良かった点</span>
          <span className="cf-fb-label-en">What worked</span>
        </div>
        <div className="cf-chips">
          {CHIP_GROUPS.map((g) => (
            <button
              key={g}
              className={'cf-chip good' + (liked.includes(g) ? ' on' : '')}
              onClick={() => toggle(setLiked, liked, g)}
            >
              {liked.includes(g) && <IconCheck size={10} />}
              <span>{g}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cf-fb-section">
        <div className="cf-fb-label">
          <span className="cf-fb-label-dot improve" />
          <span className="cf-fb-label-jp">改善できる点</span>
          <span className="cf-fb-label-en">Could improve</span>
        </div>
        <div className="cf-chips">
          {CHIP_GROUPS.map((g) => (
            <button
              key={g}
              className={'cf-chip improve' + (improve.includes(g) ? ' on' : '')}
              onClick={() => toggle(setImprove, improve, g)}
            >
              {improve.includes(g) && <IconCheck size={10} />}
              <span>{g}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cf-fb-section">
        <div className="cf-fb-label">
          <span className="cf-fb-label-jp">その他コメント</span>
          <span className="cf-fb-label-en">Additional</span>
          <span className="cf-fb-optional">任意</span>
        </div>
        <textarea
          className="cf-textarea"
          placeholder="例：見出しの「達成」をもう少し控えめな表現に。会長コメントを末尾に追加してほしい。"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="cf-fb-reassure">
        <IconLock size={11} />
        <span>このフィードバックは今後の品質向上に活用されます。社外には公開されません。</span>
      </div>

      <button className="cf-submit" onClick={onSubmit}>
        フィードバックを送信
      </button>
      <button className="cf-skip" onClick={onSubmit}>
        フィードバックなしで終了
      </button>
    </section>
  );
}

function CFThanks() {
  return (
    <section className="cf-thanks">
      <div className="cf-check">
        <svg viewBox="0 0 56 56" width="56" height="56" fill="none">
          <circle cx="28" cy="28" r="26" fill="#dcfce7" />
          <path d="M17 28.5l7 7 15-15" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="cf-thanks-title">ありがとうございました</h2>
      <p className="cf-thanks-body">
        フィードバックを受信しました。<br/>
        担当者が最終版を準備し、改めてご連絡いたします。
      </p>
      <div className="cf-thanks-card">
        <div className="cf-thanks-card-row">
          <span className="cf-thanks-card-label">選択されたバージョン</span>
          <span className="cf-thanks-card-value">案1 — フォーマル</span>
        </div>
        <div className="cf-thanks-card-row">
          <span className="cf-thanks-card-label">担当者</span>
          <span className="cf-thanks-card-value">佐藤 愛子</span>
        </div>
        <div className="cf-thanks-card-row">
          <span className="cf-thanks-card-label">受信日時</span>
          <span className="cf-thanks-card-value en">2026-05-10 14:32</span>
        </div>
      </div>
      <button className="cf-close">このページを閉じる</button>
    </section>
  );
}

function PhoneFrame({ children, time = '9:41' }) {
  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-side phone-side-l">
          <span className="ps-silent" />
          <span className="ps-vol" />
          <span className="ps-vol" />
        </div>
        <div className="phone-side phone-side-r"><span className="ps-power" /></div>
        <div className="phone-screen">
          <div className="phone-notch">
            <span className="notch-time">{time}</span>
            <span className="notch-island" />
            <span className="notch-icons">
              <svg width="14" height="9" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
                <rect x="0" y="6" width="3" height="5" rx="0.5"/>
                <rect x="4.5" y="4" width="3" height="7" rx="0.5"/>
                <rect x="9" y="2" width="3" height="9" rx="0.5"/>
                <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
              </svg>
              <svg width="14" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6.5 6.5 0 0 1 9 0M6 9.5a2.5 2.5 0 0 1 4 0"/>
              </svg>
              <svg width="22" height="10" viewBox="0 0 25 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <rect x="0.5" y="1" width="21" height="10" rx="2.5"/>
                <rect x="2" y="2.5" width="16" height="7" rx="1.5" fill="currentColor" stroke="none"/>
                <rect x="22.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </span>
          </div>
          <div className="phone-content">
            {children}
          </div>
          <div className="phone-homebar" />
        </div>
      </div>
    </div>
  );
}

function FeedbackApp({ forceSubmitted = false }) {
  const [lang, setLang] = React.useState('ja');
  const [activeVariant, setActiveVariant] = React.useState(1);
  const [selectedVariant, setSelectedVariant] = React.useState(1);
  const [localSubmitted, setLocalSubmitted] = React.useState(false);
  const submitted = forceSubmitted || localSubmitted;
  const setSubmitted = setLocalSubmitted;
  const [liked, setLiked] = React.useState(['トーン', '冒頭']);
  const [improve, setImprove] = React.useState([]);
  const [note, setNote] = React.useState('');

  const variant = VARIANTS.find((v) => v.id === activeVariant);
  const isSelected = selectedVariant === activeVariant;

  return (
    <div className="cf-page">
      <CFHeader lang={lang} setLang={setLang} />
      {submitted ? (
        <CFThanks />
      ) : (
        <>
          <CFIntro />
          <CFVariantTabs active={activeVariant} onChange={setActiveVariant} selectedId={selectedVariant} />
          <CFVariantBody
            variant={variant}
            selected={isSelected}
            onSelect={() => setSelectedVariant(activeVariant)}
          />
          {isSelected && (
            <CFFeedback
              liked={liked} setLiked={setLiked}
              improve={improve} setImprove={setImprove}
              note={note} setNote={setNote}
              onSubmit={() => setSubmitted(true)}
            />
          )}
          <footer className="cf-foot">
            <div className="cf-foot-firm">© Tanaka &amp; Associates PR</div>
            <div className="cf-foot-tech">
              <span>powered by</span>
              <span className="cf-foot-cp">ClearPress AI</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

// Stage: phone-centered mockup with desktop ledger note
function FeedbackStage({ submitted }) {
  return (
    <div className="stage" data-screen-label="06 Client Feedback">
      <div className="stage-grid">
        <aside className="stage-side">
          <div className="stage-label">PUBLIC · NO LOGIN</div>
          <h2 className="stage-h">クライアント<br/>フィードバック</h2>
          <p className="stage-p">
            外部公開ページ。アプリのシェル（サイドバー・上部バー）は適用されません。
            モバイルファーストで設計され、デスクトップにも自動対応します。
          </p>

          <div className="stage-card">
            <div className="stage-card-row">
              <span className="stage-k">URL</span>
              <span className="stage-v mono">clearpress.ai/f/<span className="stage-token">tk2814-r3-9f2a…</span></span>
            </div>
            <div className="stage-card-row">
              <span className="stage-k">表示</span>
              <span className="stage-v">モバイル <span className="stage-vsub">390×844</span></span>
            </div>
            <div className="stage-card-row">
              <span className="stage-k">対応</span>
              <span className="stage-v">iPhone Safari / Android Chrome</span>
            </div>
          </div>

          <div className="stage-note">
            <div className="stage-note-h">トーン</div>
            <p>
              ソフトウェア感を出さず、丁寧なビジネスメールの延長として設計。
              「AI」「ジェネレート」等のテック用語は表に出さない。
            </p>
          </div>

          <div className="stage-legend">
            <div className="legend-item">
              <span className="legend-dot good" />
              <span>緑チップ — 良かった点（事前選択あり）</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot improve" />
              <span>橙チップ — 改善点</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot blue" />
              <span>青ボタン — 主要アクション</span>
            </div>
          </div>
        </aside>

        <main className="stage-main">
          <PhoneFrame>
            <FeedbackApp forceSubmitted={submitted} />
          </PhoneFrame>
        </main>

        <aside className="stage-right">
          <div className="stage-label">DESKTOP</div>
          <div className="desktop-thumb">
            <div className="desktop-thumb-bar">
              <span /><span /><span />
              <span className="desktop-thumb-url">clearpress.ai/f/…</span>
            </div>
            <div className="desktop-thumb-body">
              <div className="dt-narrow">
                <div className="dt-h1" />
                <div className="dt-line" />
                <div className="dt-line short" />
                <div className="dt-tabs">
                  <span className="on" />
                  <span /><span />
                </div>
                <div className="dt-paragraph">
                  <span /><span /><span /><span style={{ width: '70%' }} />
                </div>
                <div className="dt-paragraph">
                  <span /><span /><span /><span style={{ width: '50%' }} />
                </div>
                <div className="dt-btn" />
              </div>
            </div>
          </div>
          <p className="stage-right-cap">
            デスクトップでは中央に幅640pxで表示。
            レイアウト・タイポは共通。
          </p>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { FeedbackApp, FeedbackStage });
