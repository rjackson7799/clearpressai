export type NavItem = {
  path: string;
  labelJa: string;
  labelEn: string;
  enabled: boolean;
  phase?: number;
};

export const SIDEBAR_NAV: NavItem[] = [
  { path: "/",         labelJa: "ダッシュボード", labelEn: "Dashboard", enabled: true },
  { path: "/clients",  labelJa: "クライアント",   labelEn: "Clients",   enabled: true },
  { path: "/projects", labelJa: "プロジェクト",   labelEn: "Projects",  enabled: true },
  { path: "/settings", labelJa: "設定",           labelEn: "Settings",  enabled: true },
];
