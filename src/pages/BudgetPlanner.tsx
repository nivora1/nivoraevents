import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Plus, Trash2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { DataPersistenceBanner } from "@/components/DataPersistenceBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";

type Item = {
  id: string;
  name: string;
  estimated: number | "";
  actual: number | "";
};

type Category = {
  key: string;
  title: string;
  vendorLink?: string;
  items: Item[];
};

const uid = () => Math.random().toString(36).slice(2, 9);

const mk = (name: string): Item => ({ id: uid(), name, estimated: "", actual: "" });

const initialCategories: Category[] = [
  {
    key: "photography",
    title: "Photography",
    vendorLink: "/services/photography",
    items: [mk("Pre-wedding shoot"), mk("Wedding day photography"), mk("Videography"), mk("Albums & prints")],
  },
  {
    key: "catering",
    title: "Catering",
    vendorLink: "/services/catering",
    items: [mk("Welcome drinks & starters"), mk("Main course (per plate)"), mk("Desserts & live counters"), mk("Beverages")],
  },
  {
    key: "venue",
    title: "Venue",
    items: [mk("Wedding venue"), mk("Reception venue"), mk("Accommodation"), mk("Permits & licenses")],
  },
  {
    key: "decoration",
    title: "Decoration",
    items: [mk("Stage & mandap decor"), mk("Floral arrangements"), mk("Lighting"), mk("Entrance decor")],
  },
  {
    key: "entertainment",
    title: "Entertainment",
    items: [mk("DJ / Live music"), mk("Choreographer"), mk("Anchor / MC"), mk("Special performances")],
  },
  {
    key: "invitations",
    title: "Invitations & Stationery",
    items: [mk("Printed invitations"), mk("Digital invitations"), mk("Save the dates"), mk("Thank you cards")],
  },
  {
    key: "attire",
    title: "Bridal & Groom Wear",
    items: [mk("Bridal outfit"), mk("Groom outfit"), mk("Jewellery"), mk("Hair & makeup")],
  },
  {
    key: "transport",
    title: "Transportation",
    items: [mk("Bridal car"), mk("Guest transport"), mk("Outstation travel")],
  },
  {
    key: "gifts",
    title: "Gifts & Favors",
    items: [mk("Guest return gifts"), mk("Family gifts"), mk("Bridesmaid / Groomsmen gifts")],
  },
  {
    key: "misc",
    title: "Miscellaneous",
    items: [mk("Wedding planner fees"), mk("Tips & gratuities"), mk("Contingency")],
  },
];

const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const BudgetPlanner = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
      } else if (data && Array.isArray(data.categories) && (data.categories as unknown as Category[]).length > 0) {
        setCategories(data.categories as unknown as Category[]);
      }
      setLoaded(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  useDebouncedSave(
    categories,
    async (val) => {
      if (!user) return;
      setSaveStatus("saving");
      const { error } = await supabase.from("budget_planner_data").upsert(
        [{ user_id: user.id, categories: val as unknown as never }],
        { onConflict: "user_id" },
      );
      if (error) {
        toast.error("Failed to save");
        setSaveStatus("idle");
      } else {
        setSaveStatus("saved");
      }
    },
    700,
    loaded,
  );


  const updateItem = (cKey: string, id: string, patch: Partial<Item>) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.key === cKey ? { ...c, items: c.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) } : c,
      ),
    );
  };

  const addItem = (cKey: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.key === cKey ? { ...c, items: [...c.items, mk("")] } : c)),
    );
  };

  const removeItem = (cKey: string, id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.key === cKey ? { ...c, items: c.items.filter((it) => it.id !== id) } : c)),
    );
  };

  const totals = useMemo(() => {
    let est = 0;
    let act = 0;
    const perCategory: Record<string, { est: number; act: number }> = {};
    categories.forEach((c) => {
      let cE = 0;
      let cA = 0;
      c.items.forEach((i) => {
        cE += Number(i.estimated) || 0;
        cA += Number(i.actual) || 0;
      });
      perCategory[c.key] = { est: cE, act: cA };
      est += cE;
      act += cA;
    });
    return { est, act, diff: act - est, perCategory };
  }, [categories]);

  const downloadCSV = () => {
    const rows: string[] = [["Category", "Item", "Estimated (INR)", "Actual (INR)"].join(",")];
    categories.forEach((c) => {
      c.items.forEach((i) => {
        const name = `"${(i.name || "").replace(/"/g, '""')}"`;
        rows.push([c.title, name, Number(i.estimated) || 0, Number(i.actual) || 0].join(","));
      });
    });
    rows.push("");
    rows.push(["", "Total Estimated", totals.est, ""].join(","));
    rows.push(["", "Total Actual", totals.act, ""].join(","));
    rows.push(["", "Difference (Actual - Estimated)", totals.diff, ""].join(","));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nivora-wedding-budget.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface min-h-screen pb-32">
      <DataPersistenceBanner />
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container-narrow pt-14 pb-16 md:pt-20 md:pb-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-5">
              <span className="h-px w-8 bg-primary" />
              Budget Planner
            </span>
            <h1 className="text-4xl md:text-5xl text-foreground leading-[1.05] text-balance">
              Plan Your Wedding Budget
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Estimate your expenses and connect with the right vendors.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Categories */}
      <section className="container-narrow -mt-8 md:-mt-10">
        <div className="space-y-6 md:space-y-8">
          {categories.map((c, idx) => {
            const cTotals = totals.perCategory[c.key];
            return (
              <Reveal key={c.key} delay={idx * 60}>
                <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-4 md:py-5 border-b border-border bg-surface-muted">
                    <div>
                      <h2 className="text-xl md:text-2xl text-foreground">{c.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated {inr(cTotals.est)} · Actual {inr(cTotals.act)}
                      </p>
                    </div>
                    {c.vendorLink && (
                      <Link
                        to={c.vendorLink}
                        className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
                      >
                        Find Vendors on Nivora
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    )}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-7 py-3 font-medium w-1/2">Item</th>
                          <th className="px-4 py-3 font-medium">Estimated (₹)</th>
                          <th className="px-4 py-3 font-medium">Actual (₹)</th>
                          <th className="px-4 py-3 font-medium w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {c.items.map((i) => (
                          <tr key={i.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                            <td className="px-7 py-2.5">
                              <input
                                type="text"
                                value={i.name}
                                onChange={(e) => updateItem(c.key, i.id, { name: e.target.value })}
                                placeholder="Item name"
                                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={i.estimated}
                                onChange={(e) =>
                                  updateItem(c.key, i.id, {
                                    estimated: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                                placeholder="0"
                                className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={i.actual}
                                onChange={(e) =>
                                  updateItem(c.key, i.id, {
                                    actual: e.target.value === "" ? "" : Number(e.target.value),
                                  })
                                }
                                placeholder="0"
                                className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => removeItem(c.key, i.id)}
                                aria-label="Remove item"
                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-border/60">
                    {c.items.map((i) => (
                      <div key={i.id} className="p-5 space-y-3">
                        <div className="flex items-start gap-2">
                          <input
                            type="text"
                            value={i.name}
                            onChange={(e) => updateItem(c.key, i.id, { name: e.target.value })}
                            placeholder="Item name"
                            className="flex-1 bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-foreground py-1"
                          />
                          <button
                            onClick={() => removeItem(c.key, i.id)}
                            aria-label="Remove item"
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Estimated ₹</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={i.estimated}
                              onChange={(e) =>
                                updateItem(c.key, i.id, {
                                  estimated: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Actual ₹</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={i.actual}
                              onChange={(e) =>
                                updateItem(c.key, i.id, {
                                  actual: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                              placeholder="0"
                              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 md:px-7 py-3 border-t border-border bg-surface-muted/50">
                    <button
                      onClick={() => addItem(c.key)}
                      className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                    >
                      <Plus className="h-4 w-4" />
                      Add item
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Totals */}
        <Reveal>
          <div className="mt-10 bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 md:px-8 py-6 border-b border-border bg-gradient-hero">
              <h2 className="text-2xl md:text-3xl text-foreground">Summary</h2>
              <p className="text-sm text-muted-foreground mt-1">Totals update in real time as you fill in costs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Estimated</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-foreground">{inr(totals.est)}</p>
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Actual</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-foreground">{inr(totals.act)}</p>
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Difference</p>
                <p
                  className={`mt-2 text-2xl md:text-3xl font-serif ${
                    totals.diff > 0 ? "text-destructive" : "text-primary"
                  }`}
                >
                  {totals.diff >= 0 ? "+" : "−"}
                  {inr(Math.abs(totals.diff))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.diff > 0 ? "Over budget" : totals.diff < 0 ? "Under budget" : "On budget"}
                </p>
              </div>
            </div>
            <div className="px-6 md:px-8 py-5 border-t border-border flex flex-wrap gap-3 justify-end">
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Download className="h-4 w-4" />
                Download as CSV
              </button>
              <Link
                to="/services"
                className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
              >
                Browse Vendors
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default BudgetPlanner;
