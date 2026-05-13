import { NavLink } from "react-router-dom";
import { SIDEBAR_NAV } from "@/config/routes";
import { BilingualLabel } from "./BilingualLabel";
import { cn } from "@/lib/utils";

export function Sidebar() {
  return (
    <nav className="w-56 border-r p-4 space-y-1">
      {SIDEBAR_NAV.map((item) =>
        item.enabled ? (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "block px-3 py-2 rounded-md hover:bg-accent",
                isActive && "bg-accent font-medium",
              )
            }
          >
            <BilingualLabel ja={item.labelJa} en={item.labelEn} />
          </NavLink>
        ) : (
          <div
            key={item.path}
            className="px-3 py-2 rounded-md text-muted-foreground flex items-center justify-between"
          >
            <BilingualLabel ja={item.labelJa} en={item.labelEn} />
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
              Phase {item.phase}
            </span>
          </div>
        ),
      )}
    </nav>
  );
}
