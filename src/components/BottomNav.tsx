import { NavLink, useLocation } from "react-router-dom";
import { Calculator, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/budget-planner", label: "Budget Planner", Icon: Calculator },
  { to: "/guest-planner", label: "Guest Planner", Icon: Users },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:pb-4 pointer-events-none"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="container-narrow pointer-events-auto">
        <nav
          aria-label="Primary tools"
          className="mx-auto flex items-center gap-1 rounded-full bg-foreground/90 backdrop-blur-md border border-foreground/10 shadow-elegant p-1.5"
        >
          {tabs.map(({ to, label, Icon }) => {
            const isActive = pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "group flex-1 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-background/80 hover:text-background hover:bg-background/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span className="whitespace-nowrap">{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
