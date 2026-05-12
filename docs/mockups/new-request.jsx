// New Content Request — form + live preview
const { useState: useStateNR } = React;

const CONTENT_TYPES = [
  { id: 'press', label: 'プレスリリース', en: 'Press Release', icon: IconMegaphone },
  { id: 'blog', label: 'ブログ記事', en: 'Blog Post', icon: IconArticle },
  { id: 'social', label: 'ソーシャルメディア', en: 'Social Media', icon: IconShare },
  { id: 'memo', label: '社内文書', en: 'Internal Memo', icon: IconMemo },
  { id: 'faq', label: 'FAQ', en: 'FAQ', icon: IconHelp },
  { id: 'exec', label: '経営者声明', en: 'Executive Statement', icon: IconQuote },
];

const URGENCY_OPTIONS = [
  { id: 'standard', label: '通常',     en: 'Standard', sla: '5–7日',   tone: 'gray' },
  { id: 'priority', label: '優先',     en: 'Priority', sla: '2–3日',   tone: 'amber' },
  { id: 'urgent',   label: '緊急',     en: 'Urgent',   sla: '24–48時間', tone: 'orange' },
  { id: 'crisis',   label: 'クライシス', en: 'Crisis',  sla: '即日',    tone: 'red' },
];

const VARIATION_AXES = [
  {
    id: 'tone',
    label: 'トーン',
    en: 'Tone',
    desc: 'フォーマル / バランス / 親しみやすい',
    recommended: true,
  },
  {
    id: 'structure',
    label: '構成',
    en: 'Structure',
    desc: 'データ先行 / 引用先行 / 発表先行',
  },
  {
    id: 'length',
    label: '長さ',
    en: 'Length',
    desc: '簡潔 / 標準 / 詳細',
  },
];

const DEFAULT_BRIEF = `当社の2型糖尿病治療薬 TKM-501（一般名: シタグリプチン徐放錠100mg）の長期投与試験（52週）の結果について発表します。HbA1cの平均低下幅は -1.8%（95%CI: -2.1〜-1.5、p<0.001）。重篤な有害事象の発現率はプラセボ群と同等でした。
発表は5月20日（火）14時、本社にて記者会見形式。ターゲットは医療系記者および専門誌。長期安全性プロファイルと既存薬との差別化を強調したい。`;

const SHORT_BRIEF = '新薬発表';

const KEY_MESSAGES = [
  '52週投与でHbA1c -1.8%（95%CI: -2.1〜-1.5）',
  '重篤な有害事象は0.4%、プラセボ群と同等',
  '1日1回投与で患者QOLの向上に貢献',
];

const QUOTE_BLOCK = {
  name: '山田 健一',
  title: '田中製薬株式会社 開発本部長',
  quote: '長期投与における優れた安全性と有効性が確認されたことは、糖尿病治療の選択肢を広げる上で大きな前進です。',
};

const DATA_POINTS = [
  'HbA1c平均低下幅: -1.8%',
  '対象患者: 752名（日本国内32施設）',
  '投与期間: 52週間',
];

const CONSTRAINT_TEXT = '競合薬（A社のXX製剤）への直接的な言及は避ける。承認前の効能効果について断定的な表現は使用しない。';

/* ============== Form Sections ============== */

function FormCard({ step, label, en, helper, children, action }) {
  return (
    <section className="fc">
      <header className="fc-head">
        <div className="fc-step">{step}</div>
        <div className="fc-titles">
          <h3 className="fc-title">
            {label}
            <span className="fc-en">{en}</span>
          </h3>
          {helper && <div className="fc-helper">{helper}</div>}
        </div>
        {action && <div className="fc-action">{action}</div>}
      </header>
      <div className="fc-body">{children}</div>
    </section>
  );
}

function ClientProjectCard() {
  return (
    <FormCard step="1" label="クライアントとプロジェクト" en="Client & Project">
      <div className="field-grid two">
        <div className="field">
          <label className="field-label">クライアント<span className="req">*</span></label>
          <button className="combobox">
            <span className="cb-avatar">田</span>
            <span className="cb-main">
              <span className="cb-name">田中製薬株式会社</span>
              <span className="cb-sub">Tanaka Pharmaceutical · 製薬</span>
            </span>
            <IconChevronUpDown size={14} style={{ color: '#94a3b8' }} />
          </button>
        </div>
        <div className="field">
          <label className="field-label">プロジェクト名<span className="req">*</span></label>
          <div className="input-wrap">
            <input className="input" defaultValue="TKM-501 長期投与試験 52週結果発表" />
          </div>
          <div className="field-hint">社内識別用。クライアントには表示されません。</div>
        </div>
      </div>
    </FormCard>
  );
}

function ContentTypeCard() {
  const [selected, setSelected] = useStateNR('press');
  return (
    <FormCard step="2" label="コンテンツタイプ" en="Content Type" helper="生成するコンテンツの種類を選択してください。">
      <div className="ct-grid">
        {CONTENT_TYPES.map((t) => {
          const Icon = t.icon;
          const isSel = selected === t.id;
          return (
            <button
              key={t.id}
              className={'ct-card' + (isSel ? ' selected' : '')}
              onClick={() => setSelected(t.id)}
            >
              <span className="ct-icon"><Icon size={18} /></span>
              <span className="ct-label">{t.label}</span>
              <span className="ct-en">{t.en}</span>
              {isSel && <span className="ct-check"><IconCheck size={11} /></span>}
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

function UrgencyCard() {
  const [selected, setSelected] = useStateNR('priority');
  return (
    <FormCard step="3" label="緊急度" en="Urgency" helper="納期と AI 処理優先度を決定します。">
      <div className="urg-row">
        {URGENCY_OPTIONS.map((u) => (
          <button
            key={u.id}
            className={'urg-pill tone-' + u.tone + (selected === u.id ? ' selected' : '') + (u.id === 'crisis' ? ' pulse' : '')}
            onClick={() => setSelected(u.id)}
          >
            <span className="urg-dot" />
            <span className="urg-main">
              <span className="urg-label">{u.label}</span>
              <span className="urg-sla">{u.sla}</span>
            </span>
          </button>
        ))}
      </div>
    </FormCard>
  );
}

function BriefTextCard({ state }) {
  const initial = state === 'short-brief' ? SHORT_BRIEF : DEFAULT_BRIEF;
  const [text, setText] = useStateNR(initial);
  React.useEffect(() => { setText(state === 'short-brief' ? SHORT_BRIEF : DEFAULT_BRIEF); }, [state]);
  const len = text.length;
  const min = 80;
  const tooShort = len < min;

  return (
    <FormCard
      step="4"
      label="ブリーフ（自由記述）"
      en="Brief — Free Text"
      helper="クライアントから受け取った内容をそのまま、または要約して入力できます。"
    >
      <div className="textarea-wrap">
        <textarea
          className="textarea"
          rows={7}
          placeholder="発表内容、ターゲット読者、伝えたいキーメッセージなどを自由に記載してください。"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="textarea-foot">
          {tooShort ? (
            <div className="ta-warn">
              <IconAlert size={12} />
              <span>あと <strong>{min - len}</strong> 文字以上入力してください</span>
            </div>
          ) : (
            <div className="ta-ok">
              <IconCheck size={12} />
              <span>十分な内容です</span>
            </div>
          )}
          <div className="char-count">
            <span className={tooShort ? 'low' : ''}>{len}</span> / 推奨 200〜800字
          </div>
        </div>
      </div>
    </FormCard>
  );
}

function StructuredFieldsCard({ state }) {
  const [open, setOpen] = useStateNR(true);
  const empty = state === 'short-brief';
  const messages = empty ? [''] : KEY_MESSAGES;
  const data = empty ? [''] : DATA_POINTS;
  const quote = empty ? { name: '', title: '', quote: '' } : QUOTE_BLOCK;
  const constraint = empty ? '' : CONSTRAINT_TEXT;

  return (
    <FormCard
      step="5"
      label="構造化フィールド"
      en="Structured Fields"
      helper="任意。記入すると AI がより精度高くドラフトを生成します。"
      action={
        <button className="collapse-btn" onClick={() => setOpen((o) => !o)}>
          <IconChevronDown size={14} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
          {open ? '折りたたむ' : '展開'}
        </button>
      }
    >
      {open && (
        <div className="sf-stack">
          {/* Key Messages */}
          <div className="sf-block">
            <div className="sf-block-head">
              <span className="sf-block-label">キーメッセージ <span className="sf-en">Key Messages</span></span>
              <span className="sf-block-meta">{messages.length}件</span>
            </div>
            <div className="repeat-list">
              {messages.map((m, i) => (
                <div key={i} className="repeat-row">
                  <span className="repeat-index">{i + 1}</span>
                  <input className="input flush" defaultValue={m} placeholder="例: HbA1cの平均低下幅は -1.8%（95%CI: -2.1〜-1.5）" />
                  <button className="row-del" title="削除"><IconTrash size={13} /></button>
                </div>
              ))}
            </div>
            <button className="add-row">
              <IconPlus size={12} /> メッセージを追加
            </button>
          </div>

          {/* Quotes & Spokespeople */}
          <div className="sf-block">
            <div className="sf-block-head">
              <span className="sf-block-label">引用とスポークスパーソン <span className="sf-en">Quotes & Spokespeople</span></span>
              <span className="sf-block-meta">{empty ? 0 : 1}件</span>
            </div>
            <div className="quote-card">
              <div className="quote-grid">
                <div className="field">
                  <label className="field-label sm"><IconUser size={11} /> 氏名</label>
                  <input className="input" defaultValue={quote.name} placeholder="例: 山田 健一" />
                </div>
                <div className="field">
                  <label className="field-label sm">役職</label>
                  <input className="input" defaultValue={quote.title} placeholder="例: 開発本部長" />
                </div>
              </div>
              <div className="field" style={{ marginTop: 10 }}>
                <label className="field-label sm">コメント本文</label>
                <textarea className="textarea sm" rows={3} defaultValue={quote.quote} placeholder="そのまま、もしくは要旨を入力。AIが文体を整えます。" />
              </div>
              <div className="quote-foot">
                <button className="row-del lg" title="この引用を削除"><IconTrash size={12} /> 削除</button>
              </div>
            </div>
            <button className="add-row">
              <IconPlus size={12} /> スポークスパーソンを追加
            </button>
          </div>

          {/* Data Points */}
          <div className="sf-block">
            <div className="sf-block-head">
              <span className="sf-block-label">データポイント <span className="sf-en">Data Points</span></span>
              <span className="sf-block-meta">{data.length}件</span>
            </div>
            <div className="repeat-list">
              {data.map((d, i) => (
                <div key={i} className="repeat-row">
                  <span className="repeat-index num">#{i + 1}</span>
                  <input className="input flush" defaultValue={d} placeholder="例: 対象患者 752名、52週投与" />
                  <button className="row-del" title="削除"><IconTrash size={13} /></button>
                </div>
              ))}
            </div>
            <button className="add-row">
              <IconPlus size={12} /> データを追加
            </button>
          </div>

          {/* Constraints */}
          <div className="sf-block">
            <div className="sf-block-head">
              <span className="sf-block-label">制約事項 <span className="sf-en">Constraints</span></span>
              <span className="sf-block-meta hint">記載しないこと・避けたい表現など</span>
            </div>
            <textarea className="textarea sm" rows={3} defaultValue={constraint} placeholder="例: 競合薬への直接的な言及は避ける、承認前の効能効果は断定しない、など。" />
          </div>
        </div>
      )}
    </FormCard>
  );
}

function VariationAxisCard() {
  const [selected, setSelected] = useStateNR('tone');
  return (
    <FormCard
      step="6"
      label="バリエーションの軸"
      en="Variation Axis"
      helper="3つのドラフトの違いを何で出すかを選びます。"
    >
      <div className="va-row">
        {VARIATION_AXES.map((v) => {
          const isSel = selected === v.id;
          return (
            <button
              key={v.id}
              className={'va-card' + (isSel ? ' selected' : '')}
              onClick={() => setSelected(v.id)}
            >
              <div className="va-head">
                <span className={'va-radio' + (isSel ? ' on' : '')}>
                  {isSel && <span className="va-dot" />}
                </span>
                <span className="va-label">{v.label}</span>
                <span className="va-en">{v.en}</span>
                {v.recommended && <span className="va-rec">推奨</span>}
              </div>
              <div className="va-desc">{v.desc}</div>
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

/* ============== Sticky Preview ============== */

function PreviewPanel({ state }) {
  const disabled = state === 'short-brief';

  return (
    <aside className="preview">
      <div className="preview-card">
        <div className="preview-head">
          <h3 className="preview-title">
            リクエストの概要
            <span className="preview-en">Request Summary</span>
          </h3>
        </div>

        <div className="preview-rows">
          <div className="pv-row">
            <div className="pv-key">クライアント</div>
            <div className="pv-val">
              <span className="cb-avatar tiny">田</span>
              <span>田中製薬株式会社</span>
            </div>
          </div>

          <div className="pv-row">
            <div className="pv-key">プロジェクト</div>
            <div className="pv-val pv-clamp">TKM-501 長期投与試験 52週結果発表</div>
          </div>

          <div className="pv-row">
            <div className="pv-key">コンテンツタイプ</div>
            <div className="pv-val">
              <span className="pv-chip"><IconMegaphone size={11} /> プレスリリース</span>
            </div>
          </div>

          <div className="pv-row">
            <div className="pv-key">緊急度</div>
            <div className="pv-val">
              <span className="pv-chip tone-amber"><span className="urg-dot" /> 優先 · 2–3日</span>
            </div>
          </div>

          <div className="pv-row">
            <div className="pv-key">バリエーション</div>
            <div className="pv-val">
              <span className="pv-chip"><IconSparkles size={11} /> トーン軸（フォーマル / バランス / 親しみ）</span>
            </div>
          </div>

          <div className="pv-row excerpt">
            <div className="pv-key">ブリーフ抜粋</div>
            <div className={'pv-excerpt' + (disabled ? ' empty' : '')}>
              {disabled
                ? '— ブリーフが短すぎます。発表内容や数値、対象読者を追記してください。'
                : '当社の2型糖尿病治療薬 TKM-501（一般名: シタグリプチン徐放錠100mg）の長期投与試験（52週）の結果について発表します。HbA1cの平均低下幅は -1.8%…'}
            </div>
          </div>

          <div className="pv-row structured">
            <div className="pv-key">構造化データ</div>
            <div className="pv-val">
              {disabled ? (
                <span className="pv-empty">未入力</span>
              ) : (
                <div className="pv-counts">
                  <span className="pv-count"><strong>3</strong> キーメッセージ</span>
                  <span className="pv-count"><strong>1</strong> 引用</span>
                  <span className="pv-count"><strong>3</strong> データ</span>
                  <span className="pv-count"><strong>2</strong> 制約</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="preview-voice">
          <div className="pv-voice-line">
            <span className="pv-voice-dot" />
            <span>ブランドボイス: <strong>適用されます</strong></span>
            <a className="pv-voice-link" href="#">プロファイルを確認</a>
          </div>
          <div className="pv-voice-meta">12件のサンプル · 6件のガイドライン · 最終更新 5月7日</div>
        </div>

        <div className="preview-estimates">
          <div className="est-row">
            <span className="est-key"><IconClock size={12} /> 推定生成時間</span>
            <span className="est-val">約 60 秒</span>
          </div>
          <div className="est-row">
            <span className="est-key">使用トークン（推定）</span>
            <span className="est-val faded">~ 18,400 / 月次クォータ 2.1%</span>
          </div>
        </div>

        <div className="preview-cta">
          <div className={'cta-wrap' + (disabled ? ' has-tip' : '')}>
            <button className={'btn primary lg' + (disabled ? ' disabled' : '')} disabled={disabled}>
              <IconSparkles size={14} />
              3つのバージョンを生成
              {!disabled && <IconArrowRight size={13} />}
            </button>
            {disabled && (
              <div className="tooltip">
                <IconAlert size={11} />
                <span>ブリーフを 80 文字以上入力してから生成できます。</span>
              </div>
            )}
          </div>
          <div className="cta-meta">
            <span>下書きとして保存されます · いつでも編集可能</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============== Page ============== */

function NewRequestPage({ state }) {
  return (
    <div className="nr-grid">
      <div className="nr-form">
        <ClientProjectCard />
        <ContentTypeCard />
        <UrgencyCard />
        <BriefTextCard state={state} />
        <StructuredFieldsCard state={state} />
        <VariationAxisCard />
      </div>
      <PreviewPanel state={state} />
    </div>
  );
}

window.NewRequestPage = NewRequestPage;
