import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/budget-planner", label: "Budget Planner" },
  { to: "/my-plan", label: "My Plan" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500 ease-out animate-fade-down",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border shadow-soft"
          : "bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className="container-narrow flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
            Nivora
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-secondary transition-transform duration-300 group-hover:scale-150" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group/nav text-sm font-medium transition-colors relative py-1",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className={cn(
                      "pointer-events-none absolute left-0 -bottom-0.5 h-px w-full origin-left bg-primary transition-transform duration-500 ease-out",
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover/nav:scale-x-100"
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <UserIcon className="h-4 w-4" />
              Sign in
            </Link>
          )}
          <Link
            to="/list-your-service"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
          >
            List Your Service
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="md:hidden p-2 -mr-2 text-foreground transition-transform duration-300 active:scale-90"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-down">
          <div className="container-narrow py-4 flex flex-col gap-1">
            {links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                style={{ animationDelay: `${i * 60}ms` }}
                className={({ isActive }) =>
                  cn(
                    "py-3 px-2 rounded-md text-sm font-medium transition-colors animate-fade-up",
                    isActive
                      ? "text-primary bg-primary-soft"
                      : "text-foreground hover:bg-muted"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={handleSignOut}
                className="mt-1 py-3 px-2 rounded-md text-sm font-medium text-left text-foreground hover:bg-muted inline-flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="mt-1 py-3 px-2 rounded-md text-sm font-medium text-foreground hover:bg-muted inline-flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" /> Sign in
              </Link>
            )}
            <Link
              to="/list-your-service"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium animate-fade-up"
              style={{ animationDelay: `${links.length * 60}ms` }}
            >
              List Your Service
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
