import { NavLink } from "react-router-dom";
import { SIDEBAR_NAV } from "@/config/routes";
import { BilingualLabel } from "./BilingualLabel";
import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <nav className="w-64 border-r p-3 space-y-1 bg-sidebar">
      <div className="px-3 pt-2 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
        <BilingualLabel ja="メイン" en="Main" />
      </div>
      {SIDEBAR_NAV.map((item) => {
        const Icon = item.icon;
        return item.enabled ? (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors",
                isActive
                  ? "bg-accent text-foreground font-medium [&_svg]:text-primary"
                  : "text-muted-foreground [&_svg]:text-muted-foreground",
              )
            }
          >
            {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
            <BilingualLabel ja={item.labelJa} en={item.labelEn} className="whitespace-nowrap" />
          </NavLink>
        ) : (
          <div
            key={item.path}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground justify-between"
          >
            <span className="flex items-center gap-2.5">
              {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
              <BilingualLabel ja={item.labelJa} en={item.labelEn} />
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
              Phase {item.phase}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
