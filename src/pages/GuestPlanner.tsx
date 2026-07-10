import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Download,
  Plus,
  Minus,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  Lock,
  Wallet,
  Pencil,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { DataPersistenceBanner } from "@/components/DataPersistenceBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ---------- Types ----------

type Side = "Bride" | "Groom";
type Group = "Family" | "Friends" | "Work" | "VIP";
type RSVP = "Pending" | "Confirmed";
type Meal = "Default" | "Veg" | "Non-Veg" | "Egg" | "Vegan" | "Jain";

type Guest = {
  id: string;
  name: string;
  side: Side | "";
  group: Group | "";
  rsvp: RSVP;
  meal: Meal;
  additionalGuests: number;
};

type Estimates = { bride: number | ""; groom: number | ""; other: number | "" };

type StoredShape = {
  v: 2;
  mode: "basic" | "detailed";
  estimates: Estimates;
  manualTotal: number | null;
  manualConfirmed: number | null;
  defaultMeal: Meal;
  guests: Guest[];
};

const uid = () => Math.random().toString(36).slice(2, 9);
const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const MEAL_OPTIONS: Meal[] = ["Default", "Veg", "Non-Veg", "Egg", "Vegan", "Jain"];
const GROUP_OPTIONS: Group[] = ["Family", "Friends", "Work", "VIP"];
const RSVP_OPTIONS: RSVP[] = ["Confirmed", "Pending"];

// ---------- Budget helpers (in-file to avoid new module) ----------

type BudgetCatShape = {
  key: string;
  title: string;
  vendorLabel: string;
  vendorLink?: string;
  pct: number;
  allocated: number;
  items: { id: string; name: string; amount: number }[];
  locked?: boolean;
};
type BudgetStored = {
  totalBudget: number;
  categories: BudgetCatShape[];
  lockedGuestCount?: number;
};

const roundClean = (n: number) => {
  if (n <= 0) return 0;
  const step = n >= 500000 ? 25000 : n >= 100000 ? 10000 : n >= 20000 ? 5000 : n >= 5000 ? 1000 : 500;
  return Math.round(n / step) * step;
};

const scaleItems = (
  items: { id: string; name: string; amount: number }[],
  oldTotal: number,
  newTotal: number,
) => {
  if (items.length === 0) return items;
  if (oldTotal <= 0) {
    const base = newTotal / items.length;
    return items.map((i) => ({ ...i, amount: roundClean(base) }));
  }
  const ratio = newTotal / oldTotal;
  return items.map((i) => ({ ...i, amount: roundClean(i.amount * ratio) }));
};

// ---------- Component ----------

const GuestPlanner = () => {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const [mode, setMode] = useState<"basic" | "detailed">("basic");
  const [estimates, setEstimates] = useState<Estimates>({ bride: "", groom: "", other: "" });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [defaultMeal, setDefaultMeal] = useState<Meal>("Default");
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [manualConfirmed, setManualConfirmed] = useState<number | null>(null);

  const [perPlate, setPerPlate] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Budget snapshot (for integration)
  const [budget, setBudget] = useState<BudgetStored | null>(null);

  // ---------- Load ----------
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [g, b] = await Promise.all([
        supabase.from("guest_planner_data").select("guests, per_plate").eq("user_id", user.id).maybeSingle(),
        supabase.from("budget_planner_data").select("categories").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancel) return;
      if (g.error) toast.error("Couldn't load guest data");
      else if (g.data) {
        const raw = g.data.guests as unknown;
        if (Array.isArray(raw)) {
          // Legacy: migrate array
          const migrated: Guest[] = (raw as Array<Record<string, unknown>>).map((old) => ({
            id: (old.id as string) || uid(),
            name: (old.name as string) || "",
            side: ((old.side as string) === "Bride" || old.side === "Groom") ? (old.side as Side) : "",
            group: GROUP_OPTIONS.includes(old.group as Group) ? (old.group as Group) : "",
            rsvp: (old.rsvp as RSVP) === "Pending" ? "Pending" : "Confirmed",
            meal: MEAL_OPTIONS.includes(old.meal as Meal) ? (old.meal as Meal) : "Default",
            additionalGuests: old.plusOne ? 1 : 0,
          }));
          setGuests(migrated);
          if (migrated.length > 0) setMode("detailed");
        } else if (raw && typeof raw === "object" && (raw as StoredShape).v === 2) {
          const s = raw as StoredShape;
          setMode(s.mode ?? "basic");
          setEstimates(s.estimates ?? { bride: "", groom: "", other: "" });
          setGuests(Array.isArray(s.guests) ? s.guests : []);
          setDefaultMeal(s.defaultMeal ?? "Default");
          setManualTotal(s.manualTotal ?? null);
          setManualConfirmed(s.manualConfirmed ?? null);
        }
        setPerPlate(g.data.per_plate == null ? "" : Number(g.data.per_plate));
      }
      if (!b.error && b.data && b.data.categories) {
        const raw = b.data.categories as unknown;
        if (raw && typeof raw === "object" && !Array.isArray(raw) && "totalBudget" in (raw as object)) {
          setBudget(raw as BudgetStored);
        }
      }
      setLoaded(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  // ---------- Persist ----------
  const loadedRef = useRef(false);
  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  const persist = useCallback(
    async (
      nextGuests: Guest[],
      nextPerPlate: number | "",
      nextMode: "basic" | "detailed",
      nextEstimates: Estimates,
      nextDefaultMeal: Meal,
      nextManualTotal: number | null,
      nextManualConfirmed: number | null,
    ) => {
      if (!user || !loadedRef.current) return;
      setSaveStatus("saving");
      const payload: StoredShape = {
        v: 2,
        mode: nextMode,
        estimates: nextEstimates,
        manualTotal: nextManualTotal,
        manualConfirmed: nextManualConfirmed,
        defaultMeal: nextDefaultMeal,
        guests: nextGuests,
      };
      const { error } = await supabase.from("guest_planner_data").upsert(
        [{
          user_id: user.id,
          guests: payload as unknown as never,
          per_plate: nextPerPlate === "" ? null : Number(nextPerPlate),
        }],
        { onConflict: "user_id" },
      );
      if (error) {
        toast.error("Failed to save");
        setSaveStatus("idle");
      } else {
        setSaveStatus("saved");
      }
    },
    [user],
  );

  // Debounced auto-save on any change
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      void persist(guests, perPlate, mode, estimates, defaultMeal, manualTotal, manualConfirmed);
    }, 600);
    return () => clearTimeout(t);
  }, [guests, perPlate, mode, estimates, defaultMeal, manualTotal, manualConfirmed, loaded, persist]);

  // ---------- Derived ----------

  const estimatesSum = useMemo(() => {
    const b = Number(estimates.bride) || 0;
    const g = Number(estimates.groom) || 0;
    const o = Number(estimates.other) || 0;
    return b + g + o;
  }, [estimates]);

  const detailedTotal = useMemo(
    () => guests.reduce((s, g) => s + 1 + (g.additionalGuests || 0), 0),
    [guests],
  );
  const detailedConfirmed = useMemo(
    () =>
      guests
        .filter((g) => g.rsvp === "Confirmed")
        .reduce((s, g) => s + 1 + (g.additionalGuests || 0), 0),
    [guests],
  );

  const total = manualTotal ?? (mode === "detailed" ? detailedTotal : estimatesSum);
  const confirmed = manualConfirmed ?? (mode === "detailed" ? detailedConfirmed : total);
  const pending = Math.max(0, total - confirmed);

  const brideSide = useMemo(() => guests.filter((g) => g.side === "Bride"), [guests]);
  const groomSide = useMemo(() => guests.filter((g) => g.side === "Groom"), [guests]);
  const unassigned = useMemo(() => guests.filter((g) => g.side === ""), [guests]);

  // ---------- Guest ops ----------

  const updateGuest = (id: string, patch: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };
  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  // Quick add state
  const [qName, setQName] = useState("");
  const [qSide, setQSide] = useState<Side | "">("");
  const [qGroup, setQGroup] = useState<Group | "">("");
  const [qRsvp, setQRsvp] = useState<RSVP>("Confirmed");
  const [qMeal, setQMeal] = useState<Meal>("Default");
  const [qAddOn, setQAddOn] = useState(false);
  const [qAddCount, setQAddCount] = useState(1);

  const addGuest = () => {
    if (!qName.trim()) {
      toast.error("Please enter a guest name");
      return;
    }
    const meal = qMeal === "Default" && defaultMeal !== "Default" ? defaultMeal : qMeal;
    const g: Guest = {
      id: uid(),
      name: qName.trim(),
      side: qSide,
      group: qGroup,
      rsvp: qRsvp,
      meal,
      additionalGuests: qAddOn ? Math.max(1, qAddCount) : 0,
    };
    setGuests((prev) => [g, ...prev]);
    setQName("");
    setQSide("");
    setQGroup("");
    setQRsvp("Confirmed");
    setQMeal("Default");
    setQAddOn(false);
    setQAddCount(1);
    toast.success(`${g.name} added to your guest list`);
  };

  const applyMealToAll = () => {
    setDefaultMeal(qMeal);
    setGuests((prev) => prev.map((g) => ({ ...g, meal: qMeal })));
    toast.success(
      qMeal === "Default"
        ? "Meal preference cleared for all guests"
        : `${qMeal} applied to all guests`,
    );
  };

  // ---------- CSV ----------

  const downloadCSV = () => {
    const headers = [
      "Name",
      "Bride/Groom Side",
      "Group",
      "Meal Preference",
      "RSVP",
      "Additional Guests",
      "Total People Represented",
    ];
    const rows = [headers.join(",")];
    const safe = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    guests.forEach((g) => {
      rows.push(
        [
          safe(g.name),
          g.side || "",
          g.group || "",
          g.meal,
          g.rsvp,
          g.additionalGuests || 0,
          1 + (g.additionalGuests || 0),
        ].join(","),
      );
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nivora-guest-list.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Guest list downloaded");
  };

  // ---------- Budget integration ----------

  const cateringCat = budget?.categories.find((c) => c.key === "catering");
  const cateringAllocated = cateringCat?.allocated ?? 0;
  const cateringLocked = !!cateringCat?.locked;
  const lockedGuestCount = budget?.lockedGuestCount;

  const suggestedPerPlate = useMemo(() => {
    if (!cateringCat || total <= 0) return null;
    return Math.round(cateringAllocated / total);
  }, [cateringCat, cateringAllocated, total]);

  const cateringCost = useMemo(() => {
    const rate = Number(perPlate) || 0;
    if (rate > 0) return rate * total;
    return cateringAllocated;
  }, [perPlate, total, cateringAllocated]);

  const guestDrift = useMemo(() => {
    if (!cateringLocked || lockedGuestCount == null || lockedGuestCount === 0) return 0;
    return Math.abs(total - lockedGuestCount) / lockedGuestCount;
  }, [cateringLocked, lockedGuestCount, total]);

  const [showGuestDriftBanner, setShowGuestDriftBanner] = useState(true);

  const applyCateringToBudget = async () => {
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    const rate = Number(perPlate) || 0;
    if (rate <= 0) {
      toast.error("Enter a cost per plate first");
      return;
    }
    if (total <= 0) {
      toast.error("Add guests or estimates first");
      return;
    }
    const newCatering = roundClean(rate * total);

    if (!budget) {
      toast.error("Set up your Wedding Budget first");
      return;
    }

    // Update budget: set catering.allocated = newCatering, mark locked, redistribute non-locked others
    const cats = budget.categories.map((c) => ({ ...c }));
    const catIdx = cats.findIndex((c) => c.key === "catering");
    if (catIdx < 0) return;
    const oldCat = cats[catIdx];
    cats[catIdx] = {
      ...oldCat,
      allocated: newCatering,
      items: scaleItems(oldCat.items, oldCat.allocated, newCatering),
      locked: true,
    };

    // Redistribute among non-locked, non-catering categories preserving proportions
    const others = cats.filter((c) => c.key !== "catering" && !c.locked);
    const otherSum = others.reduce((s, c) => s + c.allocated, 0);
    const remaining = Math.max(0, budget.totalBudget - newCatering - cats.filter((c) => c.key !== "catering" && c.locked).reduce((s, c) => s + c.allocated, 0));
    const nextCats = cats.map((c) => {
      if (c.key === "catering" || c.locked) return c;
      const share = otherSum > 0 ? c.allocated / otherSum : 1 / Math.max(1, others.length);
      const alloc = roundClean(remaining * share);
      return { ...c, allocated: alloc, items: scaleItems(c.items, c.allocated, alloc) };
    });

    const nextBudget: BudgetStored = {
      totalBudget: budget.totalBudget,
      categories: nextCats,
      lockedGuestCount: total,
    };

    const { error } = await supabase.from("budget_planner_data").upsert(
      [{ user_id: user.id, categories: nextBudget as unknown as never }],
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error("Failed to update budget");
      return;
    }
    setBudget(nextBudget);
    toast.success("Catering budget updated and locked");
  };

  // ---------- UI helpers ----------

  const selectCls =
    "rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const inputCls =
    "rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

  const numInput = (
    value: number | "",
    onChange: (n: number | "") => void,
    placeholder = "0",
  ) => (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
      placeholder={placeholder}
      className={`${inputCls} w-full`}
    />
  );

  // ---------- Render ----------

  return (
    <div className="bg-surface min-h-screen pb-32">
      <DataPersistenceBanner status={saveStatus === "saving" ? "saving" : "saved"} />

      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container-narrow pt-14 pb-16 md:pt-20 md:pb-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-5">
              <span className="h-px w-8 bg-primary" />
              Guest Planner
            </span>
            <h1 className="text-4xl md:text-5xl text-foreground leading-[1.05] text-balance">
              Organise Your Wedding Guests
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Start with a simple estimate — switch to full guest management whenever you're ready.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-narrow -mt-8 md:-mt-10 space-y-8">
        {/* Summary counters (3) — editable Total & Confirmed */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
            <EditableCounter
              label="Total Guests"
              value={total}
              icon={Users}
              accent="text-foreground"
              onChange={(v) => setManualTotal(v)}
              onClear={() => setManualTotal(null)}
              manual={manualTotal != null}
            />
            <EditableCounter
              label="Confirmed"
              value={confirmed}
              icon={CheckCircle2}
              accent="text-primary"
              onChange={(v) => setManualConfirmed(v)}
              onClear={() => setManualConfirmed(null)}
              manual={manualConfirmed != null}
            />
            <div className="bg-card border border-border rounded-2xl shadow-soft p-4 md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending</span>
                <Clock className="h-4 w-4 text-secondary" />
              </div>
              <p className="mt-2 text-2xl md:text-3xl font-serif text-secondary tabular-nums">{pending}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Auto-calculated</p>
            </div>
          </div>
        </Reveal>

        {/* Guest drift banner */}
        <AnimatePresence>
          {cateringLocked && guestDrift > 0.1 && showGuestDriftBanner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 px-5 py-4 flex flex-wrap items-center gap-3"
            >
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm text-foreground">
                  Your guest count has changed. Your current catering budget may no longer match your guest list.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/budget-planner"
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  Review Catering Budget
                </Link>
                <button
                  onClick={() => setShowGuestDriftBanner(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estimated Guest Count (Basic Mode) */}
        <Reveal delay={80}>
          <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
            <div className="px-5 md:px-7 py-4 border-b border-border bg-surface-muted flex items-center justify-between">
              <div>
                <h2 className="text-lg md:text-xl text-foreground">Estimated Guest Count</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quick estimates for planning and catering.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Basic</span>
            </div>
            <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Bride's Side</span>
                <div className="mt-1.5">{numInput(estimates.bride, (v) => setEstimates((e) => ({ ...e, bride: v })), "e.g. 120")}</div>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Groom's Side</span>
                <div className="mt-1.5">{numInput(estimates.groom, (v) => setEstimates((e) => ({ ...e, groom: v })), "e.g. 120")}</div>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Other Guests (optional)</span>
                <div className="mt-1.5">{numInput(estimates.other, (v) => setEstimates((e) => ({ ...e, other: v })), "e.g. 20")}</div>
              </label>
            </div>
            <div className="px-5 md:px-7 py-4 border-t border-border bg-surface-muted/50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Estimated Total Guests</div>
              <div className="font-serif text-2xl text-foreground tabular-nums">
                <motion.span key={estimatesSum} initial={{ scale: 0.95, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}>
                  {estimatesSum}
                </motion.span>
              </div>
            </div>
            <div className="px-5 md:px-7 py-4 border-t border-border flex justify-center">
              <button
                onClick={() => setMode(mode === "detailed" ? "basic" : "detailed")}
                className="text-sm text-primary font-medium hover:underline"
              >
                {mode === "detailed" ? "Hide Detailed Guest Planner" : "Switch to Detailed Guest Planner →"}
              </button>
            </div>
          </div>
        </Reveal>

        {/* Detailed mode: Export + Add Guest + List */}
        <AnimatePresence initial={false}>
          {mode === "detailed" && (
            <motion.div
              key="detailed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Export CSV — placed prominently between summary and Add Guest */}
              <div className="flex justify-end">
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>

              {/* Add Guest */}
              <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="px-5 md:px-7 py-4 border-b border-border bg-surface-muted">
                  <h2 className="text-lg md:text-xl text-foreground">Add a guest</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Details you can refine later from the list.</p>
                </div>
                <div className="p-5 md:p-7 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input
                      type="text"
                      value={qName}
                      onChange={(e) => setQName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addGuest()}
                      placeholder="Guest name"
                      className={`md:col-span-4 ${inputCls}`}
                    />
                    <select
                      value={qSide}
                      onChange={(e) => setQSide(e.target.value as Side | "")}
                      className={`md:col-span-2 ${selectCls}`}
                    >
                      <option value="">Side</option>
                      <option value="Bride">Bride</option>
                      <option value="Groom">Groom</option>
                    </select>
                    <select
                      value={qGroup}
                      onChange={(e) => setQGroup(e.target.value as Group | "")}
                      className={`md:col-span-2 ${selectCls}`}
                    >
                      <option value="">Group</option>
                      {GROUP_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <select
                      value={qRsvp}
                      onChange={(e) => setQRsvp(e.target.value as RSVP)}
                      className={`md:col-span-2 ${selectCls}`}
                    >
                      {RSVP_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      onClick={addGuest}
                      className="md:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6 flex items-end gap-2">
                      <label className="block flex-1">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Meal Preference</span>
                        <select
                          value={qMeal}
                          onChange={(e) => setQMeal(e.target.value as Meal)}
                          className={`mt-1 w-full ${selectCls}`}
                        >
                          {MEAL_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={applyMealToAll}
                        className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                        title="Apply the selected meal to all existing guests and use as default for new ones"
                      >
                        Apply to All
                      </button>
                    </div>

                    <div className="md:col-span-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Additional Guests</span>
                        <button
                          onClick={() => setQAddOn((v) => !v)}
                          className={`inline-flex items-center h-5 w-9 rounded-full transition-colors ${qAddOn ? "bg-primary" : "bg-muted"}`}
                          aria-pressed={qAddOn}
                        >
                          <span className={`h-4 w-4 rounded-full bg-background shadow transition-transform ${qAddOn ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                      {qAddOn && (
                        <div className="mt-2">
                          <Stepper value={qAddCount} onChange={setQAddCount} min={1} max={20} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest list — two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SideColumn
                  title="Bride's Side"
                  guests={brideSide}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onUpdate={updateGuest}
                  onRemove={removeGuest}
                />
                <SideColumn
                  title="Groom's Side"
                  guests={groomSide}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onUpdate={updateGuest}
                  onRemove={removeGuest}
                />
              </div>

              {unassigned.length > 0 && (
                <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-surface-muted">
                    <h3 className="text-sm text-foreground">Unassigned side</h3>
                  </div>
                  <ul className="divide-y divide-border/60">
                    {unassigned.map((g) => (
                      <GuestRow
                        key={g.id}
                        guest={g}
                        open={expandedId === g.id}
                        onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                        onUpdate={updateGuest}
                        onRemove={removeGuest}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estimated Catering Cost */}
        <Reveal delay={120}>
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 md:px-8 py-6 border-b border-border bg-gradient-hero flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl text-foreground">Estimated Catering Cost</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Linked with your Wedding Budget.
                </p>
              </div>
              {cateringLocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-medium">
                  <Lock className="h-3 w-3" />
                  Catering locked
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Guests</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-foreground">{total}</p>
              </div>
              <div className="p-6 md:p-8">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Cost per plate (₹)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={perPlate}
                    onChange={(e) => setPerPlate(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={suggestedPerPlate ? `Suggested: ${suggestedPerPlate}` : "e.g. 1200"}
                    className="mt-2 w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                {suggestedPerPlate != null && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    From your Wedding Budget: ~{inr(suggestedPerPlate)}/plate
                  </p>
                )}
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Total</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-primary tabular-nums">{inr(cateringCost)}</p>
              </div>
            </div>
            <div className="px-6 md:px-8 py-5 border-t border-border flex flex-wrap gap-3 justify-end">
              {budget && Number(perPlate) > 0 && total > 0 && (
                <button
                  onClick={applyCateringToBudget}
                  className="inline-flex items-center gap-2 rounded-full border border-primary text-primary bg-primary-soft/40 px-5 py-2.5 text-sm font-medium hover:shadow-elegant transition-all"
                >
                  <Wallet className="h-4 w-4" />
                  Sync to Wedding Budget
                </button>
              )}
              <Link
                to="/services/catering"
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
              >
                Find Catering Vendors
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

// ---------- Sub-components ----------

const EditableCounter = ({
  label,
  value,
  icon: Icon,
  accent,
  onChange,
  onClear,
  manual,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  onChange: (n: number) => void;
  onClear: () => void;
  manual: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <div className="bg-card border border-border rounded-2xl shadow-soft p-4 md:p-5 hover:shadow-elegant transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {manual && (
            <button
              onClick={onClear}
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              title="Reset to auto"
            >
              Auto
            </button>
          )}
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      {editing ? (
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            const n = Number(draft);
            if (Number.isFinite(n) && n >= 0) onChange(n);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="mt-2 w-full bg-transparent font-serif text-2xl md:text-3xl text-foreground focus:outline-none tabular-nums"
        />
      ) : (
        <button
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          className={`mt-2 text-2xl md:text-3xl font-serif ${accent} tabular-nums w-full text-left inline-flex items-center gap-2 group`}
        >
          <motion.span key={value} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}>
            {value}
          </motion.span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
};

const Stepper = ({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) => (
  <div className="inline-flex items-center gap-1 rounded-md border border-input bg-background overflow-hidden">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Decrease"
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
      }}
      className="w-12 bg-transparent text-center text-sm tabular-nums focus:outline-none"
    />
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Increase"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

const SideColumn = ({
  title,
  guests,
  expandedId,
  setExpandedId,
  onUpdate,
  onRemove,
}: {
  title: string;
  guests: Guest[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Guest>) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
    <div className="px-5 py-3 border-b border-border bg-surface-muted flex items-center justify-between">
      <h3 className="text-sm md:text-base text-foreground">{title}</h3>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {guests.reduce((s, g) => s + 1 + (g.additionalGuests || 0), 0)} people
      </span>
    </div>
    <ul className="divide-y divide-border/60">
      {guests.length === 0 ? (
        <li className="px-5 py-8 text-center text-xs text-muted-foreground">
          No guests yet on this side.
        </li>
      ) : (
        guests.map((g) => (
          <GuestRow
            key={g.id}
            guest={g}
            open={expandedId === g.id}
            onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))
      )}
    </ul>
  </div>
);

const GuestRow = ({
  guest,
  open,
  onToggle,
  onUpdate,
  onRemove,
}: {
  guest: Guest;
  open: boolean;
  onToggle: () => void;
  onUpdate: (id: string, patch: Partial<Guest>) => void;
  onRemove: (id: string) => void;
}) => {
  const rsvpDot = guest.rsvp === "Confirmed" ? "bg-primary" : "bg-secondary";
  const tightSelect =
    "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring";
  const tightInput =
    "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <li className="bg-card">
      <div className="w-full flex items-center gap-3 px-4 md:px-5 py-2">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
          aria-expanded={open}
        >
          <span className={`h-2 w-2 rounded-full ${rsvpDot}`} aria-hidden />
          <span className="text-sm text-foreground truncate">{guest.name || "Unnamed guest"}</span>
          {guest.additionalGuests > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-primary bg-primary-soft px-1.5 py-0.5 rounded">
              +{guest.additionalGuests}
            </span>
          )}
        </button>
        <button
          onClick={() => onRemove(guest.id)}
          aria-label="Remove guest"
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggle} aria-label="Expand" className="p-1">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-4 md:px-5 py-3 grid grid-cols-2 gap-x-2 gap-y-2">
              <label className="block col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</span>
                <input
                  type="text"
                  value={guest.name}
                  onChange={(e) => onUpdate(guest.id, { name: e.target.value })}
                  className={`mt-0.5 ${tightInput}`}
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Side</span>
                <select
                  value={guest.side}
                  onChange={(e) => onUpdate(guest.id, { side: e.target.value as Side | "" })}
                  className={`mt-0.5 ${tightSelect}`}
                >
                  <option value="">—</option>
                  <option value="Bride">Bride</option>
                  <option value="Groom">Groom</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Group</span>
                <select
                  value={guest.group}
                  onChange={(e) => onUpdate(guest.id, { group: e.target.value as Group | "" })}
                  className={`mt-0.5 ${tightSelect}`}
                >
                  <option value="">—</option>
                  {GROUP_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">RSVP</span>
                <select
                  value={guest.rsvp}
                  onChange={(e) => onUpdate(guest.id, { rsvp: e.target.value as RSVP })}
                  className={`mt-0.5 ${tightSelect}`}
                >
                  {RSVP_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Meal</span>
                <select
                  value={guest.meal}
                  onChange={(e) => onUpdate(guest.id, { meal: e.target.value as Meal })}
                  className={`mt-0.5 ${tightSelect}`}
                >
                  {MEAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="block col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Additional Guests</span>
                <div className="mt-1">
                  <Stepper
                    value={guest.additionalGuests}
                    onChange={(v) => onUpdate(guest.id, { additionalGuests: v })}
                    min={0}
                    max={20}
                  />
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export default GuestPlanner;
