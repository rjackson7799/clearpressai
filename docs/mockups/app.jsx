// Main app shell
const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "state": "loaded",
  "language": "ja"
}/*EDITMODE-END*/;

function Sidebar() {
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
      <button className="nav-item active">
        <span className="icon"><IconClients size={16} /></span>
        <span>クライアント</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-en)', fontSize: 11, color: '#64748b', background: '#fff', padding: '1px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>14</span>
      </button>
      <button className="nav-item">
        <span className="icon"><IconProjects size={16} /></span>
        <span>プロジェクト</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-en)', fontSize: 11, color: '#64748b' }}>32</span>
      </button>
      <button className="nav-item">
        <span className="icon"><IconSettings size={16} /></span>
        <span>設定</span>
      </button>

      <div className="nav-section-label">最近のクライアント</div>
      <button className="nav-item active" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
        <span>田中製薬</span>
      </button>
      <button className="nav-item" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
        <span>サクラファーマ</span>
      </button>
      <button className="nav-item" style={{ paddingLeft: 14, fontSize: 13 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
        <span>ニチエイバイオ</span>
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

function Header({ language, setLanguage }) {
  return (
    <header className="header">
      <div className="crumbs">
        <button className="crumb"><IconHome size={13} style={{ verticalAlign: '-2px' }} /></button>
        <span className="crumb-sep">/</span>
        <button className="crumb">クライアント</button>
        <span className="crumb-sep">/</span>
        <span className="crumb current">田中製薬株式会社</span>
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

function PageHeader() {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">
          田中製薬株式会社
          <span className="romaji">Tanaka Pharmaceutical Co., Ltd.</span>
        </h1>
        <div className="page-sub">
          <span className="tag"><span className="tag-dot" />製薬 / Pharmaceutical</span>
          <span>aiko.tanaka@tanaka-pharma.co.jp</span>
          <span className="page-sub-dot" />
          <span>担当開始: 2023年4月</span>
          <span className="page-sub-dot" />
          <span>進行中プロジェクト 4件</span>
        </div>
      </div>
      <div className="head-actions">
        <button className="btn icon-only" title="その他"><IconMoreH size={16} /></button>
        <button className="btn primary">
          <IconPlus size={14} />
          新規プロジェクト作成
        </button>
      </div>
    </div>
  );
}

function Tabs() {
  const tabs = [
    { label: '概要', en: 'Overview' },
    { label: 'ブランドボイス', en: 'Brand Voice', active: true },
    { label: 'プロジェクト', en: 'Projects', count: 4 },
    { label: '設定', en: 'Settings' },
  ];
  return (
    <div className="tabs">
      {tabs.map((t, i) => (
        <button key={i} className={'tab' + (t.active ? ' active' : '')}>
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function ProcessingBanner() {
  return (
    <div className="banner" role="status">
      <div className="spinner" />
      <div style={{ flex: 1 }}>
        <strong style={{ fontWeight: 600, color: '#1e40af' }}>ボイスプロファイルを生成中...</strong>
        <span style={{ marginLeft: 8, color: '#1e3a8a' }}>12件のサンプルから文体パターンを抽出しています。約30秒ほどお待ちください。</span>
      </div>
      <span style={{ fontFamily: 'var(--font-en)', fontSize: 12, color: '#1e40af', fontWeight: 500 }}>8 / 12 件処理済み</span>
      <div className="banner-progress" />
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <div className="app">
        <Sidebar />
        <div className="main">
          <Header language={t.language} setLanguage={(v) => setTweak('language', v)} />
          <div className="content">
            <PageHeader />
            <Tabs />
            {t.state === 'processing' && <ProcessingBanner />}
            <BrandVoice state={t.state} />
          </div>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="ページの状態">
          <TweakRadio
            label="State"
            value={t.state}
            options={[
              { value: 'empty', label: '空' },
              { value: 'processing', label: '処理中' },
              { value: 'loaded', label: '完成' },
            ]}
            onChange={(v) => setTweak('state', v)}
          />
        </TweakSection>
        <TweakSection label="言語">
          <TweakRadio
            label="Language"
            value={t.language}
            options={[
              { value: 'ja', label: '日本語' },
              { value: 'en', label: 'English' },
            ]}
            onChange={(v) => setTweak('language', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
