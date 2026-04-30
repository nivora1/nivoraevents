import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, X, ArrowRight } from "lucide-react";

const BudgetCTABar = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("nivora-budget-cta-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("nivora-budget-cta-dismissed", "1");
    setVisible(false);
  };

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:px-6 md:pb-6 pointer-events-none transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="container-narrow pointer-events-auto">
        <div className="relative flex items-center gap-3 md:gap-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-elegant px-4 py-3 md:px-6 md:py-4">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium text-foreground leading-tight truncate">
              Plan your wedding budget with Nivora
            </p>
            <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
              Estimate costs by category and stay on track.
            </p>
          </div>
          <Link
            to="/budget-planner"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
          >
            Start Planning
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 p-1.5 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCTABar;
