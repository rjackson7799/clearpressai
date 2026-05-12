// Brand Voice tab content
const { useState, useRef } = React;

const SAMPLE_FILES = [
  { name: 'TKM-501_第III相試験結果_2024Q4.pdf', size: '245 KB', date: '2024/12/18', type: 'pdf' },
  { name: '新薬承認_DPP-4阻害薬_発表.docx', size: '189 KB', date: '2024/11/22', type: 'doc' },
  { name: '経営統合発表_2024年10月.pdf', size: '412 KB', date: '2024/10/04', type: 'pdf' },
  { name: '抗体医薬_第II相試験_中間報告.pdf', size: '320 KB', date: '2024/09/15', type: 'pdf' },
  { name: '新CEO就任のお知らせ.docx', size: '78 KB', date: '2024/08/30', type: 'doc' },
  { name: '2024年度第3四半期決算.pdf', size: '256 KB', date: '2024/08/12', type: 'pdf' },
  { name: '高血圧治療薬_新適応症取得.pdf', size: '198 KB', date: '2024/07/20', type: 'pdf' },
  { name: '製造拠点拡張計画.docx', size: '124 KB', date: '2024/06/28', type: 'doc' },
  { name: '学会発表予定_欧州心臓病学会.pdf', size: '167 KB', date: '2024/06/10', type: 'pdf' },
  { name: '後発医薬品_発売告知.docx', size: '92 KB', date: '2024/05/02', type: 'doc' },
  { name: 'CSR活動報告書_2024.pdf', size: '489 KB', date: '2024/04/15', type: 'pdf' },
  { name: 'パイプライン更新_2025年1月.pdf', size: '302 KB', date: '2025/01/20', type: 'pdf' },
];

const GUIDELINES = [
  {
    text: 'リード文では試験結果や数値データを最初に提示する。背景説明は2段落目以降に回す。',
    src: 'プロジェクト「TKM-501 第III相」',
    date: '5月7日',
  },
  {
    text: '「画期的」「革命的」「夢の」などの主観的形容詞は使用しない。事実と数値で語る。',
    src: '田中部長レビューコメント',
    date: '5月3日',
  },
  {
    text: '臨床試験データを記載する際は、必ず95%信頼区間とp値を併記する。',
    src: '法務チェック指摘',
    date: '4月28日',
  },
  {
    text: '薬剤名は初出時のみ商品名と一般名を併記し、以降は商品名で統一する。',
    src: 'プロジェクト「新適応症取得」',
    date: '4月22日',
  },
  {
    text: '副作用・有害事象の情報は、リリース本文末尾に独立したセクションを設けて記載する。',
    src: '広報部スタイルガイド',
    date: '4月15日',
  },
  {
    text: '数値は原則半角、単位の前には半角スペースを入れず全角もしくは記号で統一する。',
    src: 'コピー編集ガイドライン',
    date: '3月30日',
    faded: true,
  },
];

function SampleRow({ file }) {
  const color = file.type === 'pdf' ? '#dc2626' : '#2563eb';
  return (
    <div className="sample-row">
      <div className="file-icon" style={{ color }}>
        <IconFile size={16} />
      </div>
      <div className="fcontent">
        <div className="fname">{file.name}</div>
        <div className="fmeta">{file.date}</div>
      </div>
      <div className="fsize">{file.size}</div>
      <button className="fx" title="削除"><IconX size={14} /></button>
    </div>
  );
}

function VoiceSection({ label, en, children }) {
  return (
    <div className="voice-section">
      <div className="vs-label">
        <span className="jp">{label}</span>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span>{en}</span>
      </div>
      <button className="vs-edit" title="編集"><IconPencil size={13} /></button>
      {children}
    </div>
  );
}

function SampleLibrary({ state }) {
  const [dragOver, setDragOver] = useState(false);
  const samples = state === 'empty' ? [] : SAMPLE_FILES;
  const count = samples.length;
  const pct = Math.min(100, (count / 20) * 100);

  return (
    <div>
      <div className="col-head">
        <div className="col-title">
          <span>サンプル素材</span>
          <span className="en">Sample Materials</span>
        </div>
        <div className="col-helper">過去のプレスリリースを5〜20件アップロードしてください。AIが文体・語彙・構成パターンを抽出します。</div>
      </div>

      <div
        className={'dropzone' + (dragOver ? ' drag-over' : '')}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <div className="drop-icon"><IconCloud size={28} /></div>
        <div className="drop-primary">
          ファイルをドラッグ または <span className="blue">クリックしてアップロード</span>
        </div>
        <div className="drop-meta">PDF, DOCX, TXT · 最大 10MB</div>
      </div>

      {count > 0 && (
        <div className="sample-list">
          {samples.map((f, i) => <SampleRow key={i} file={f} />)}
        </div>
      )}

      {count > 0 && (
        <div className="counter-row">
          <div><span className="count-num">{count}</span> / 推奨20件</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          <div style={{ color: '#16a34a', fontWeight: 500, fontSize: 11.5 }}>分析に十分</div>
        </div>
      )}
    </div>
  );
}

function VoiceProfile({ state }) {
  if (state === 'empty') {
    return (
      <div>
        <div className="col-head">
          <div className="col-title">
            <span>抽出されたボイスプロファイル</span>
            <span className="en">Voice Profile</span>
          </div>
          <div className="col-helper">AIが分析した結果がここに表示されます。</div>
        </div>
        <div className="voice-card">
          <div style={{ padding: '20px 18px' }}>
            <div className="skel-line skeleton" style={{ width: '40%', height: 8 }} />
            <div style={{ marginTop: 6 }}>
              <span className="skel-chip skeleton" style={{ width: 52 }} />
              <span className="skel-chip skeleton" style={{ width: 70 }} />
              <span className="skel-chip skeleton" style={{ width: 60 }} />
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px -18px 14px' }} />
            <div className="skel-line skeleton" style={{ width: '40%', height: 8 }} />
            <div className="skel-line skeleton" style={{ width: '92%' }} />
            <div className="skel-line skeleton" style={{ width: '78%' }} />
            <div className="skel-line skeleton" style={{ width: '85%' }} />
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px -18px 14px' }} />
            <div className="skel-line skeleton" style={{ width: '40%', height: 8 }} />
            <div style={{ marginTop: 6 }}>
              <span className="skel-chip skeleton" style={{ width: 80 }} />
              <span className="skel-chip skeleton" style={{ width: 64 }} />
              <span className="skel-chip skeleton" style={{ width: 90 }} />
              <span className="skel-chip skeleton" style={{ width: 56 }} />
            </div>
            <div className="skel-empty-msg">
              サンプルをアップロードすると<br/>ボイスプロファイルが自動生成されます。
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="col-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="col-title">
            <span>抽出されたボイスプロファイル</span>
            <span className="en">Voice Profile</span>
          </div>
          <div className="col-helper">AIが12件のサンプルから分析した結果。各項目はクリックで編集できます。</div>
        </div>
        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>
          <IconPencil size={12} /> 編集
        </button>
      </div>

      <div className="voice-card">
        <VoiceSection label="トーン" en="TONE">
          <div className="chips">
            <span className="chip strong">権威的</span>
            <span className="chip strong">慎重</span>
            <span className="chip strong">データ重視</span>
            <span className="chip">専門的</span>
            <span className="chip">簡潔</span>
          </div>
        </VoiceSection>

        <VoiceSection label="文体の特徴" en="STYLISTIC PATTERNS">
          <p className="vs-paragraph">結論を冒頭に置き、データを根拠として続ける構造が一貫している。リード文は平均45〜60字で簡潔。</p>
          <p className="vs-paragraph">受動態よりも能動態を好み、主語は組織名または薬剤名を明示。数値・パーセンテージは必ず信頼区間または比較対象と併記される。</p>
        </VoiceSection>

        <VoiceSection label="好まれる語彙" en="PREFERRED VOCABULARY">
          <div className="chips">
            <span className="chip">「示唆された」</span>
            <span className="chip">「臨床的意義」</span>
            <span className="chip">「データに基づき」</span>
            <span className="chip">「有意差」</span>
            <span className="chip">「確認された」</span>
            <span className="chip">「貢献する」</span>
          </div>
        </VoiceSection>

        <VoiceSection label="避けるべき表現" en="WORDS TO AVOID">
          <div className="chips">
            <span className="chip warn">「画期的な」</span>
            <span className="chip warn">「革命的」</span>
            <span className="chip warn">「驚異的」</span>
            <span className="chip warn">「夢の薬」</span>
            <span className="chip warn">「奇跡」</span>
          </div>
        </VoiceSection>

        <VoiceSection label="シグネチャーフレーズ" en="SIGNATURE PHRASES">
          <ul className="phrase-list">
            <li>「本剤の有効性と安全性が確認されました。」</li>
            <li>「データに基づき、〜と考えられます。」</li>
            <li>「患者さんのQOL向上に貢献するべく、〜」</li>
            <li>「臨床的に意義のある改善が示唆されました。」</li>
          </ul>
        </VoiceSection>

        <VoiceSection label="コンテンツタイプ別の長さ目安" en="LENGTH NORMS">
          <table className="length-table">
            <thead>
              <tr>
                <th>コンテンツタイプ</th>
                <th style={{ textAlign: 'right' }}>推奨文字数</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>新薬承認発表</td><td className="num">1,000〜1,400字</td></tr>
              <tr><td>臨床試験結果</td><td className="num">700〜1,000字</td></tr>
              <tr><td>経営・人事発表</td><td className="num">400〜600字</td></tr>
              <tr><td>IR・財務発表</td><td className="num">500〜800字</td></tr>
            </tbody>
          </table>
        </VoiceSection>
      </div>
    </div>
  );
}

function VoiceGuidelines({ state }) {
  if (state === 'empty') {
    return (
      <div>
        <div className="col-head">
          <div className="col-title">
            <span>ボイスガイドライン</span>
            <span className="en">Voice Guidelines</span>
          </div>
          <div className="col-helper">クライアントのフィードバックから自動生成されます。</div>
        </div>
        <div className="guidelines-card">
          <div style={{ padding: '28px 18px', textAlign: 'center', color: '#64748b', fontSize: 12.5, lineHeight: 1.7 }}>
            プロジェクトのレビューが完了すると、<br/>フィードバックから自動的にガイドラインが<br/>蓄積されていきます。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="col-head">
        <div className="col-title">
          <span>ボイスガイドライン</span>
          <span className="en">Voice Guidelines</span>
        </div>
        <div className="col-helper" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IconClock size={11} style={{ color: '#94a3b8' }} />
            最終更新: 5月7日
          </span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span>FBから自動生成</span>
        </div>
      </div>
      <div className="guidelines-card">
        <div className="guidelines-list">
          {GUIDELINES.map((g, i) => (
            <div key={i} className={'guideline' + (g.faded ? ' faded' : '')}>
              <p className="gl-text">{g.text}</p>
              <div className="gl-meta">
                <span className="src">{g.src}</span>
                <span>·</span>
                <span className="date">{g.date}</span>
              </div>
              <button className="gl-edit" title="編集"><IconPencil size={12} /></button>
            </div>
          ))}
        </div>
        <div className="guidelines-footer">
          <IconInfo size={12} />
          <span>{GUIDELINES.length}件のガイドライン · 古い順に自動アーカイブ</span>
        </div>
      </div>
    </div>
  );
}

function BrandVoice({ state }) {
  if (state === 'empty') {
    return (
      <div className="empty-grid">
        <div>
          <div className="col-head" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 18px' }}>
            <div className="col-title" style={{ justifyContent: 'center', fontSize: 16 }}>
              <span>ブランドボイスを設定しましょう</span>
            </div>
            <div className="col-helper" style={{ fontSize: 13 }}>
              過去のプレスリリースを5件以上アップロードすると、AIがトーン・語彙・文体パターンを抽出し、このクライアント専用のボイスプロファイルを生成します。
            </div>
          </div>
          <div className="dropzone dropzone-large" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="drop-icon"><IconCloud size={28} /></div>
            <div className="drop-primary">
              ファイルをドラッグ または <span className="blue">クリックしてアップロード</span>
            </div>
            <div className="drop-meta">PDF, DOCX, TXT · 最大 10MB / 1ファイル</div>
          </div>
          <div className="empty-hint">推奨: 10〜20件 · 過去12ヶ月以内のリリースが理想的です</div>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-grid">
      <SampleLibrary state={state} />
      <VoiceProfile state={state} />
      <VoiceGuidelines state={state} />
    </div>
  );
}

window.BrandVoice = BrandVoice;
