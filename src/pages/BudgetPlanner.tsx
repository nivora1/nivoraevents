import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, animate as motionAnimate } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Plus,
  Trash2,
  Camera,
  UtensilsCrossed,
  Building2,
  Flower2,
  Music4,
  Mail,
  Shirt,
  Car,
  Gift,
  Sparkles,
  Wallet,
  Pencil,
  Lock,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { DataPersistenceBanner } from "@/components/DataPersistenceBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// ---------- Types ----------

type Item = { id: string; name: string; amount: number };

type CategoryKey =
  | "venue"
  | "catering"
  | "photography"
  | "decoration"
  | "attire"
  | "entertainment"
  | "invitations"
  | "transport"
  | "gifts"
  | "misc";

type Category = {
  key: CategoryKey;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  vendorLabel: string;
  vendorLink?: string;
  pct: number; // recommended baseline percentage
  allocated: number; // current allocation in INR
  items: Item[];
  locked?: boolean;
};

type StoredShape = { totalBudget: number; categories: Category[]; lockedGuestCount?: number };

// ---------- Presets ----------

const uid = () => Math.random().toString(36).slice(2, 9);

const PRESETS: Omit<Category, "allocated" | "items"> & { itemNames: string[] }[] = [] as never;

const CATEGORY_DEFS: Array<{
  key: CategoryKey;
  title: string;
  icon: Category["icon"];
  vendorLabel: string;
  vendorLink?: string;
  pct: number;
  itemNames: string[];
}> = [
  {
    key: "venue",
    title: "Venue",
    icon: Building2,
    vendorLabel: "Find Venues",
    pct: 25,
    itemNames: ["Wedding venue", "Reception venue", "Accommodation", "Permits & licenses"],
  },
  {
    key: "catering",
    title: "Catering",
    icon: UtensilsCrossed,
    vendorLabel: "Find Caterers",
    vendorLink: "/services/catering",
    pct: 20,
    itemNames: ["Welcome drinks & starters", "Main course", "Desserts & live counters", "Beverages"],
  },
  {
    key: "decoration",
    title: "Decoration",
    icon: Flower2,
    vendorLabel: "Find Decorators",
    pct: 12,
    itemNames: ["Stage & mandap decor", "Floral arrangements", "Lighting", "Entrance decor"],
  },
  {
    key: "photography",
    title: "Photography",
    icon: Camera,
    vendorLabel: "Find Photographers",
    vendorLink: "/services/photography",
    pct: 10,
    itemNames: ["Pre-wedding shoot", "Wedding day photography", "Videography", "Albums & prints", "Drone coverage"],
  },
  {
    key: "attire",
    title: "Bridal & Groom Wear",
    icon: Shirt,
    vendorLabel: "Find Designers",
    pct: 10,
    itemNames: ["Bridal outfit", "Groom outfit", "Jewellery", "Hair & makeup"],
  },
  {
    key: "entertainment",
    title: "Entertainment",
    icon: Music4,
    vendorLabel: "Find Entertainment",
    pct: 5,
    itemNames: ["DJ / Live music", "Choreographer", "Anchor / MC", "Special performances"],
  },
  {
    key: "invitations",
    title: "Invitations & Stationery",
    icon: Mail,
    vendorLabel: "Find Stationers",
    pct: 2,
    itemNames: ["Printed invitations", "Digital invitations", "Save the dates", "Thank you cards"],
  },
  {
    key: "transport",
    title: "Transportation",
    icon: Car,
    vendorLabel: "Find Transport",
    pct: 3,
    itemNames: ["Bridal car", "Guest transport", "Outstation travel"],
  },
  {
    key: "gifts",
    title: "Gifts & Favors",
    icon: Gift,
    vendorLabel: "Find Gifting Vendors",
    pct: 3,
    itemNames: ["Guest return gifts", "Family gifts", "Bridesmaid / Groomsmen gifts"],
  },
  {
    key: "misc",
    title: "Miscellaneous",
    icon: Sparkles,
    vendorLabel: "Find Planners",
    pct: 10,
    itemNames: ["Wedding planner fees", "Tips & gratuities", "Contingency"],
  },
];

// ---------- Helpers ----------

const roundClean = (n: number) => {
  if (n <= 0) return 0;
  const step = n >= 500000 ? 25000 : n >= 100000 ? 10000 : n >= 20000 ? 5000 : n >= 5000 ? 1000 : 500;
  return Math.round(n / step) * step;
};

const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const inrShort = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 2)} L`;
  return inr(n);
};

const distributeItems = (categoryTotal: number, names: string[]): Item[] => {
  if (names.length === 0) return [];
  const base = categoryTotal / names.length;
  return names.map((name) => ({ id: uid(), name, amount: roundClean(base) }));
};

const buildFromTotal = (total: number): Category[] =>
  CATEGORY_DEFS.map((d) => {
    const alloc = roundClean((total * d.pct) / 100);
    return {
      key: d.key,
      title: d.title,
      icon: d.icon,
      vendorLabel: d.vendorLabel,
      vendorLink: d.vendorLink,
      pct: d.pct,
      allocated: alloc,
      items: distributeItems(alloc, d.itemNames),
    };
  });

// Redistribute across categories preserving proportions, excluding `keepKey`.
const redistributeKeepingTotal = (
  cats: Category[],
  changedKey: CategoryKey,
  newTotal: number
): Category[] => {
  const changed = cats.find((c) => c.key === changedKey)!;
  const lockedElsewhere = cats
    .filter((c) => c.key !== changedKey && c.locked)
    .reduce((s, c) => s + c.allocated, 0);
  const remainingBudget = Math.max(0, newTotal - changed.allocated - lockedElsewhere);
  const others = cats.filter((c) => c.key !== changedKey && !c.locked);
  const othersSum = others.reduce((s, c) => s + c.allocated, 0);
  return cats.map((c) => {
    if (c.key === changedKey || c.locked) return c;
    const share = othersSum > 0 ? c.allocated / othersSum : 1 / Math.max(1, others.length);
    const newAlloc = roundClean(remainingBudget * share);
    return { ...c, allocated: newAlloc, items: scaleItems(c.items, c.allocated, newAlloc) };
  });
};

// Scale total-budget uniformly by category pct (locked categories keep their allocation).
const rescaleAllToTotal = (cats: Category[], newTotal: number): Category[] => {
  const lockedSum = cats.filter((c) => c.locked).reduce((s, c) => s + c.allocated, 0);
  const remaining = Math.max(0, newTotal - lockedSum);
  const unlockedPctSum = cats.filter((c) => !c.locked).reduce((s, c) => s + c.pct, 0);
  return cats.map((c) => {
    if (c.locked) return c;
    const share = unlockedPctSum > 0 ? c.pct / unlockedPctSum : 0;
    const alloc = roundClean(remaining * share);
    return { ...c, allocated: alloc, items: scaleItems(c.items, c.allocated, alloc) };
  });
};

const scaleItems = (items: Item[], oldTotal: number, newTotal: number): Item[] => {
  if (items.length === 0) return items;
  if (oldTotal <= 0) return distributeItems(newTotal, items.map((i) => i.name));
  const ratio = newTotal / oldTotal;
  return items.map((i) => ({ ...i, amount: roundClean(i.amount * ratio) }));
};

// ---------- Animated number ----------

const AnimatedNumber = ({ value, format = inr }: { value: number; format?: (n: number) => string }) => {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const controls = motionAnimate(mv, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, mv]);
  return <span className="tabular-nums">{format(Math.round(display))}</span>;
};

// ---------- Component ----------

const MEANINGFUL_PCT = 0.03; // 3% of total budget

const BudgetPlanner = () => {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lockedGuestCount, setLockedGuestCount] = useState<number | undefined>(undefined);
  const [expanded, setExpanded] = useState<CategoryKey | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Setup flow
  const [step, setStep] = useState<"intake" | "generating" | "planner">("intake");
  const [intakeValue, setIntakeValue] = useState("");

  // Sheet state for category-increase decision
  const [pending, setPending] = useState<
    | null
    | {
        key: CategoryKey;
        oldAlloc: number;
        newAlloc: number;
      }
  >(null);

  // Editing total budget inline
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalDraft, setTotalDraft] = useState("");

  // Load
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from("budget_planner_data")
        .select("categories")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (error) {
        toast.error("Couldn't load saved budget");
      } else if (data && data.categories) {
        const raw = data.categories as unknown;
        // Backward compat: array => needs migration (skip, treat as fresh); object with totalBudget
        if (raw && typeof raw === "object" && !Array.isArray(raw) && "totalBudget" in (raw as object)) {
          const shape = raw as StoredShape;
          if (shape.totalBudget > 0 && Array.isArray(shape.categories) && shape.categories.length > 0) {
            // Rehydrate icons (icons aren't serialized)
            const rehydrated: Category[] = shape.categories.map((c) => {
              const def = CATEGORY_DEFS.find((d) => d.key === c.key);
              return { ...c, icon: def?.icon ?? Sparkles, vendorLabel: def?.vendorLabel ?? "Find Vendors", vendorLink: def?.vendorLink };
            });
            setTotalBudget(shape.totalBudget);
            setCategories(rehydrated);
            setLockedGuestCount(shape.lockedGuestCount);
            setStep("planner");
          }
        }
      }
      setLoaded(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  // Save
  useDebouncedSave(
    { totalBudget, categories, lockedGuestCount },
    async (val) => {
      if (!user || step !== "planner" || val.totalBudget <= 0) return;
      setSaveStatus("saving");
      const serializable = {
        totalBudget: val.totalBudget,
        categories: val.categories.map(({ icon, ...rest }) => rest),
        lockedGuestCount: val.lockedGuestCount,
      };
      const { error } = await supabase.from("budget_planner_data").upsert(
        [{ user_id: user.id, categories: serializable as unknown as never }],
        { onConflict: "user_id" }
      );
      if (error) {
        toast.error("Failed to save");
        setSaveStatus("idle");
      } else {
        setSaveStatus("saved");
      }
    },
    800,
    loaded && step === "planner"
  );

  // Derived totals
  const totals = useMemo(() => {
    const allocated = categories.reduce((s, c) => s + c.allocated, 0);
    return {
      allocated,
      remaining: totalBudget - allocated,
      progress: totalBudget > 0 ? Math.min(100, (allocated / totalBudget) * 100) : 0,
    };
  }, [categories, totalBudget]);

  // Handlers ----------

  const handleIntakeSubmit = () => {
    const parsed = Number(intakeValue.replace(/[^\d]/g, ""));
    if (!parsed || parsed < 50000) {
      toast.error("Please enter a realistic budget");
      return;
    }
    const rounded = roundClean(parsed);
    setTotalBudget(rounded);
    setStep("generating");
    setTimeout(() => {
      setCategories(buildFromTotal(rounded));
      setStep("planner");
    }, 1100);
  };

  const commitCategoryAllocation = (key: CategoryKey, newAllocRaw: number) => {
    const newAlloc = roundClean(Math.max(0, newAllocRaw));
    const cat = categories.find((c) => c.key === key);
    if (!cat) return;
    if (newAlloc === cat.allocated) return;
    const diff = newAlloc - cat.allocated;
    const threshold = Math.max(totalBudget * MEANINGFUL_PCT, 5000);
    if (Math.abs(diff) < threshold) {
      setCategories((prev) =>
        prev.map((c) =>
          c.key === key
            ? { ...c, allocated: newAlloc, items: scaleItems(c.items, c.allocated, newAlloc), locked: c.key === "catering" ? true : c.locked }
            : c,
        ),
      );
      return;
    }
    setPending({ key, oldAlloc: cat.allocated, newAlloc });
  };

  const applyIncreaseTotal = () => {
    if (!pending) return;
    const { key, oldAlloc, newAlloc } = pending;
    const diff = newAlloc - oldAlloc;
    const newTotal = roundClean(totalBudget + diff);
    setCategories((prev) => {
      const withChange = prev.map((c) =>
        c.key === key
          ? { ...c, allocated: newAlloc, items: scaleItems(c.items, c.allocated, newAlloc), locked: c.key === "catering" ? true : c.locked }
          : c,
      );
      const lockedOthersSum = withChange
        .filter((c) => c.key !== key && c.locked)
        .reduce((s, c) => s + c.allocated, 0);
      const unlockedOthers = withChange.filter((c) => c.key !== key && !c.locked);
      const otherPctSum = unlockedOthers.reduce((s, c) => s + c.pct, 0);
      const otherBudget = Math.max(0, newTotal - newAlloc - lockedOthersSum);
      return withChange.map((c) => {
        if (c.key === key || c.locked) return c;
        const share = otherPctSum > 0 ? c.pct / otherPctSum : 0;
        const alloc = roundClean(otherBudget * share);
        return { ...c, allocated: alloc, items: scaleItems(c.items, c.allocated, alloc) };
      });
    });
    setTotalBudget(newTotal);
    setPending(null);
    toast.success("Total wedding budget updated");
  };

  const applyKeepTotal = () => {
    if (!pending) return;
    const { key, newAlloc } = pending;
    setCategories((prev) => {
      const withChange = prev.map((c) =>
        c.key === key
          ? { ...c, allocated: newAlloc, items: scaleItems(c.items, c.allocated, newAlloc), locked: c.key === "catering" ? true : c.locked }
          : c,
      );
      return redistributeKeepingTotal(withChange, key, totalBudget);
    });
    setPending(null);
    toast.success("Redistributed across other categories");
  };

  const cancelPending = () => setPending(null);

  const updateItem = (cKey: CategoryKey, id: string, patch: Partial<Item>) => {
    setCategories((prev) =>
      prev.map((c) => (c.key === cKey ? { ...c, items: c.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : c))
    );
  };

  const addItem = (cKey: CategoryKey) => {
    setCategories((prev) => prev.map((c) => (c.key === cKey ? { ...c, items: [...c.items, { id: uid(), name: "", amount: 0 }] } : c)));
  };

  const removeItem = (cKey: CategoryKey, id: string) => {
    setCategories((prev) => prev.map((c) => (c.key === cKey ? { ...c, items: c.items.filter((it) => it.id !== id) } : c)));
  };

  const commitTotalEdit = () => {
    const parsed = Number(totalDraft.replace(/[^\d]/g, ""));
    setEditingTotal(false);
    if (!parsed || parsed < 50000) return;
    const rounded = roundClean(parsed);
    if (rounded === totalBudget) return;
    setCategories((prev) => rescaleAllToTotal(prev, rounded));
    setTotalBudget(rounded);
    toast.success("Budget updated — allocations recalculated");
  };

  // ---------- Render: intake ----------

  if (step === "intake") {
    return (
      <div className="bg-surface min-h-screen">
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="container-narrow pt-14 pb-16 md:pt-24 md:pb-24">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-5">
                <span className="h-px w-8 bg-primary" />
                Budget Planner
              </span>
              <h1 className="text-4xl md:text-5xl text-foreground leading-[1.05] text-balance">
                Let's build your wedding budget
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Just one number and Nivora will design a professional, personalised budget for you.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="container-narrow -mt-8 md:-mt-16 pb-24">
          <Reveal>
            <div className="mx-auto max-w-xl bg-card border border-border rounded-3xl shadow-card overflow-hidden">
              <div className="p-8 md:p-10">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                  <Wallet className="h-4 w-4" />
                  Step 1 of 1
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl text-foreground text-balance">
                  💰 What's your estimated total wedding budget?
                </h2>
                <p className="mt-3 text-sm md:text-base text-muted-foreground">
                  Don't worry if it's not exact. You can change it anytime and Nivora will automatically update your recommendations.
                </p>

                <div className="mt-8">
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Budget (INR)</span>
                    <div className="mt-2 flex items-center rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
                      <span className="pl-5 text-3xl md:text-4xl font-serif text-muted-foreground">₹</span>
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        value={intakeValue}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          setIntakeValue(digits ? Number(digits).toLocaleString("en-IN") : "");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleIntakeSubmit()}
                        placeholder="25,00,000"
                        className="w-full bg-transparent px-4 py-5 text-3xl md:text-4xl font-serif text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                      />
                    </div>
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1000000, 2500000, 4000000, 7500000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setIntakeValue(v.toLocaleString("en-IN"))}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {inrShort(v)}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleIntakeSubmit}
                    className="mt-8 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Build my budget
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    );
  }

  // ---------- Render: generating ----------

  if (step === "generating") {
    return (
      <div className="bg-surface min-h-screen">
        <section className="container-narrow pt-24 pb-24 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-md"
          >
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-6">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Personalising
            </div>
            <div className="text-5xl md:text-6xl font-serif text-foreground tabular-nums">
              <AnimatedNumber value={totalBudget} />
            </div>
            <p className="mt-6 text-lg text-muted-foreground">✨ Creating your personalised wedding budget…</p>
            <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                className="h-full w-1/3 bg-primary"
              />
            </div>
          </motion.div>
        </section>
      </div>
    );
  }

  // ---------- Render: planner ----------

  return (
    <div className="bg-surface min-h-screen pb-32">
      <DataPersistenceBanner status={saveStatus === "saving" ? "saving" : "saved"} />
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container-narrow pt-14 pb-16 md:pt-20 md:pb-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-5">
              <span className="h-px w-8 bg-primary" />
              Wedding Budget
            </span>
            <h1 className="text-4xl md:text-5xl text-foreground leading-[1.05] text-balance">
              Your personalised wedding budget
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Expand any category to fine-tune, connect with vendors, and watch your plan come together.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-narrow -mt-8 md:-mt-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
          {/* Categories column */}
          <div className="space-y-4 min-w-0">
            {categories.map((c, idx) => {
              const Icon = c.icon;
              const pctOfTotal = totalBudget > 0 ? (c.allocated / totalBudget) * 100 : 0;
              const isOpen = expanded === c.key;
              return (
                <Reveal key={c.key} delay={idx * 40}>
                  <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-4 px-5 md:px-6 py-4 md:py-5">
                      <button
                        onClick={() => setExpanded(isOpen ? null : c.key)}
                        className="flex flex-1 min-w-0 items-center gap-4 text-left"
                      >
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-primary-soft/60 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base md:text-lg text-foreground truncate inline-flex items-center gap-2">
                            {c.title}
                            {c.locked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft text-primary px-2 py-0.5 text-[10px] font-medium">
                                <Lock className="h-2.5 w-2.5" />
                                Locked
                              </span>
                            )}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                            <AnimatedNumber value={c.allocated} /> · {pctOfTotal.toFixed(0)}% of total
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <Link
                        to={c.vendorLink ?? "/services"}
                        className="group inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
                      >
                        {c.vendorLabel}
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden border-t border-border bg-surface-muted/40"
                        >
                          <div className="p-5 md:p-6">
                            {/* Category budget input */}
                            <div className="rounded-xl bg-card border border-border p-4 md:p-5 flex flex-wrap items-center gap-3">
                              <div className="flex-1 min-w-[180px]">
                                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Category Budget</div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-lg font-serif text-muted-foreground">₹</span>
                                  <CategoryAmountInput
                                    value={c.allocated}
                                    onCommit={(v) => commitCategoryAllocation(c.key, v)}
                                  />
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Share</div>
                                <div className="mt-1 font-serif text-lg text-foreground tabular-nums">{pctOfTotal.toFixed(1)}%</div>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="mt-5">
                              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Line items</div>
                              <div className="space-y-2">
                                {c.items.map((i) => (
                                  <div
                                    key={i.id}
                                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2"
                                  >
                                    <input
                                      type="text"
                                      value={i.name}
                                      onChange={(e) => updateItem(c.key, i.id, { name: e.target.value })}
                                      placeholder="Item name"
                                      className="flex-1 min-w-0 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
                                    />
                                    <span className="text-sm text-muted-foreground">₹</span>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={0}
                                      value={i.amount || ""}
                                      onChange={(e) =>
                                        updateItem(c.key, i.id, { amount: e.target.value === "" ? 0 : Number(e.target.value) })
                                      }
                                      placeholder="0"
                                      className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <button
                                      onClick={() => removeItem(c.key, i.id)}
                                      aria-label="Remove"
                                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => addItem(c.key)}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                              >
                                <Plus className="h-4 w-4" />
                                Add item
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-gradient-hero">
                <h3 className="text-lg font-serif text-foreground">Wedding Budget</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Updates as you plan</p>
              </div>
              <dl className="divide-y divide-border">
                <div className="px-6 py-4">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Budget</dt>
                  <dd className="mt-1 flex items-center justify-between gap-2">
                    {editingTotal ? (
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-lg font-serif text-muted-foreground">₹</span>
                        <input
                          autoFocus
                          type="text"
                          inputMode="numeric"
                          value={totalDraft}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^\d]/g, "");
                            setTotalDraft(digits ? Number(digits).toLocaleString("en-IN") : "");
                          }}
                          onBlur={commitTotalEdit}
                          onKeyDown={(e) => e.key === "Enter" && commitTotalEdit()}
                          className="w-full bg-transparent font-serif text-xl text-foreground focus:outline-none"
                        />
                      </div>
                    ) : (
                      <span className="font-serif text-xl text-foreground tabular-nums">
                        <AnimatedNumber value={totalBudget} />
                      </span>
                    )}
                    {!editingTotal && (
                      <button
                        onClick={() => {
                          setTotalDraft(totalBudget.toLocaleString("en-IN"));
                          setEditingTotal(true);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        aria-label="Edit total budget"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dd>
                </div>
                <div className="px-6 py-4">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Allocated</dt>
                  <dd className="mt-1 font-serif text-xl text-foreground tabular-nums">
                    <AnimatedNumber value={totals.allocated} />
                  </dd>
                </div>
                <div className="px-6 py-4">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Remaining</dt>
                  <dd
                    className={`mt-1 font-serif text-xl tabular-nums ${
                      totals.remaining < 0 ? "text-destructive" : "text-primary"
                    }`}
                  >
                    <AnimatedNumber value={totals.remaining} />
                  </dd>
                </div>
                <div className="px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Planning Progress</dt>
                    <span className="text-xs tabular-nums text-muted-foreground">{totals.progress.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={false}
                      animate={{ width: `${totals.progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        {/* Mobile summary */}
        <div className="lg:hidden mt-8">
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gradient-hero flex items-center justify-between">
              <h3 className="text-base font-serif text-foreground">Wedding Budget</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{totals.progress.toFixed(0)}% allocated</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                <div className="mt-1 font-serif text-sm text-foreground tabular-nums">
                  <AnimatedNumber value={totalBudget} format={inrShort} />
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Allocated</div>
                <div className="mt-1 font-serif text-sm text-foreground tabular-nums">
                  <AnimatedNumber value={totals.allocated} format={inrShort} />
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</div>
                <div
                  className={`mt-1 font-serif text-sm tabular-nums ${
                    totals.remaining < 0 ? "text-destructive" : "text-primary"
                  }`}
                >
                  <AnimatedNumber value={totals.remaining} format={inrShort} />
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${totals.progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom sheet for meaningful changes */}
      <Sheet open={!!pending} onOpenChange={(o) => !o && cancelPending()}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t">
          {pending && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-serif">
                  Your {categories.find((c) => c.key === pending.key)?.title.toLowerCase()} budget has{" "}
                  {pending.newAlloc > pending.oldAlloc ? "increased" : "decreased"}.
                </SheetTitle>
                <SheetDescription className="text-base">
                  How would you like Nivora to handle this change?
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid gap-3 md:grid-cols-2 pb-6">
                <button
                  onClick={applyIncreaseTotal}
                  className="text-left rounded-2xl border-2 border-primary bg-primary-soft/40 p-5 hover:shadow-elegant transition-all"
                >
                  <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">Recommended</div>
                  <div className="mt-1 font-serif text-lg text-foreground">
                    {pending.newAlloc > pending.oldAlloc ? "Increase" : "Adjust"} my total wedding budget
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nivora will {pending.newAlloc > pending.oldAlloc ? "raise" : "lower"} your total budget to{" "}
                    <span className="text-foreground font-medium">
                      {inr(roundClean(totalBudget + (pending.newAlloc - pending.oldAlloc)))}
                    </span>{" "}
                    and rebalance every category.
                  </p>
                </button>
                <button
                  onClick={applyKeepTotal}
                  className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary transition-all"
                >
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Alternative</div>
                  <div className="mt-1 font-serif text-lg text-foreground">Keep my total budget the same</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Redistribute the difference across other categories, keeping{" "}
                    <span className="text-foreground font-medium">{inr(totalBudget)}</span> as your total.
                  </p>
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ---------- Category amount input with commit-on-blur ----------

const CategoryAmountInput = ({ value, onCommit }: { value: number; onCommit: (v: number) => void }) => {
  const [draft, setDraft] = useState(value.toLocaleString("en-IN"));
  const [focused, setFocused] = useState(false);
  const lastValue = useRef(value);
  useEffect(() => {
    if (!focused && value !== lastValue.current) {
      setDraft(value.toLocaleString("en-IN"));
      lastValue.current = value;
    }
  }, [value, focused]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^\d]/g, "");
        setDraft(digits ? Number(digits).toLocaleString("en-IN") : "");
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = Number(draft.replace(/[^\d]/g, "")) || 0;
        onCommit(parsed);
        lastValue.current = parsed;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="w-full bg-transparent font-serif text-xl text-foreground focus:outline-none tabular-nums"
    />
  );
};

export default BudgetPlanner;
