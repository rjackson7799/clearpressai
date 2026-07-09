import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  Settings,
} from "lucide-react";

export type NavItem = {
  path: string;
  labelJa: string;
  labelEn: string;
  enabled: boolean;
  phase?: number;
  icon?: LucideIcon;
};

export const SIDEBAR_NAV: NavItem[] = [
  { path: "/",         labelJa: "ダッシュボード", labelEn: "Dashboard", enabled: true, icon: LayoutDashboard },
  { path: "/clients",  labelJa: "クライアント",   labelEn: "Clients",   enabled: true, icon: Users },
  { path: "/projects", labelJa: "プロジェクト",   labelEn: "Projects",  enabled: true, icon: FolderKanban },
  { path: "/feedback", labelJa: "フィードバック", labelEn: "Feedback",  enabled: true, icon: MessageSquare },
  { path: "/settings", labelJa: "設定",           labelEn: "Settings",  enabled: true, icon: Settings },
];
