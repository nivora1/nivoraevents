import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Plus, Trash2, Users, CheckCircle2, Clock, XCircle, Sparkles, Share2, Mail } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { toast } from "sonner";

type Side = "Bride" | "Groom";
type Group = "Family" | "Friends" | "Work" | "VIP";
type RSVP = "Pending" | "Confirmed" | "Declined";
type Invite = "Not Invited" | "Invited" | "RSVP Received";
type Meal = "Veg" | "Non-Veg";

type Guest = {
  id: string;
  name: string;
  side: Side;
  group: Group;
  rsvp: RSVP;
  invite: Invite;
  plusOne: boolean;
  meal: Meal;
  notes: string;
};

type FilterKey = "All" | RSVP | Group;

const uid = () => Math.random().toString(36).slice(2, 9);

const sampleGuests: Guest[] = [
  { id: uid(), name: "Aarav Sharma", side: "Groom", group: "Family", rsvp: "Confirmed", invite: "RSVP Received", plusOne: true, meal: "Veg", notes: "" },
  { id: uid(), name: "Priya Nair", side: "Bride", group: "Friends", rsvp: "Pending", invite: "Invited", plusOne: false, meal: "Non-Veg", notes: "" },
  { id: uid(), name: "Rohan Mehta", side: "Groom", group: "Work", rsvp: "Pending", invite: "Invited", plusOne: false, meal: "Veg", notes: "" },
];

const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const filters: FilterKey[] = ["All", "Confirmed", "Pending", "Declined", "Family", "Friends", "Work", "VIP"];

const GuestPlanner = () => {
  const [guests, setGuests] = useState<Guest[]>(sampleGuests);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [perPlate, setPerPlate] = useState<number | "">(800);

  // Quick add
  const [qName, setQName] = useState("");
  const [qSide, setQSide] = useState<Side>("Bride");
  const [qGroup, setQGroup] = useState<Group>("Family");
  const [qRsvp, setQRsvp] = useState<RSVP>("Pending");

  const updateGuest = (id: string, patch: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const addGuest = () => {
    if (!qName.trim()) {
      toast.error("Please enter a guest name");
      return;
    }
    const newGuest: Guest = {
      id: uid(),
      name: qName.trim(),
      side: qSide,
      group: qGroup,
      rsvp: qRsvp,
      invite: "Not Invited",
      plusOne: false,
      meal: "Veg",
      notes: "",
    };
    setGuests((prev) => [newGuest, ...prev]);
    setQName("");
    toast.success(`${newGuest.name} added to your guest list`);
  };

  const counts = useMemo(() => {
    const total = guests.reduce((sum, g) => sum + 1 + (g.plusOne ? 1 : 0), 0);
    const confirmed = guests.filter((g) => g.rsvp === "Confirmed").reduce((s, g) => s + 1 + (g.plusOne ? 1 : 0), 0);
    const pending = guests.filter((g) => g.rsvp === "Pending").reduce((s, g) => s + 1 + (g.plusOne ? 1 : 0), 0);
    const declined = guests.filter((g) => g.rsvp === "Declined").length;
    return { total, confirmed, pending, declined };
  }, [guests]);

  const groupCounts = useMemo(() => {
    const c: Record<Group, number> = { Family: 0, Friends: 0, Work: 0, VIP: 0 };
    guests.forEach((g) => (c[g.group] += 1));
    return c;
  }, [guests]);

  const topGroup = useMemo(() => {
    const entries = Object.entries(groupCounts) as [Group, number][];
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[1] > 0 ? sorted[0][0] : null;
  }, [groupCounts]);

  const visibleGuests = useMemo(() => {
    if (filter === "All") return guests;
    if (filter === "Confirmed" || filter === "Pending" || filter === "Declined") {
      return guests.filter((g) => g.rsvp === filter);
    }
    return guests.filter((g) => g.group === filter);
  }, [guests, filter]);

  const cateringCost = useMemo(() => {
    const rate = Number(perPlate) || 0;
    return counts.confirmed * rate;
  }, [counts.confirmed, perPlate]);

  const downloadCSV = () => {
    const headers = ["Name", "Side", "Group", "RSVP", "Invite Status", "+1", "Meal", "Notes"];
    const rows = [headers.join(",")];
    guests.forEach((g) => {
      const safe = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      rows.push([safe(g.name), g.side, g.group, g.rsvp, g.invite, g.plusOne ? "Yes" : "No", g.meal, safe(g.notes)].join(","));
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

  const sharePlan = async () => {
    const text = `Our wedding guest list: ${counts.total} total · ${counts.confirmed} confirmed · ${counts.pending} pending`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Nivora Guest Planner", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Summary copied to clipboard");
      }
    } catch {
      // user cancelled
    }
  };

  const simulateInvites = () => {
    const notInvited = guests.filter((g) => g.invite === "Not Invited").length;
    if (notInvited === 0) {
      toast.info("All guests have already been invited");
      return;
    }
    setGuests((prev) => prev.map((g) => (g.invite === "Not Invited" ? { ...g, invite: "Invited" } : g)));
    toast.success(`Invites sent to ${notInvited} guest${notInvited > 1 ? "s" : ""}`);
  };

  const counters = [
    { label: "Total Guests", value: counts.total, Icon: Users, accent: "text-foreground" },
    { label: "Confirmed", value: counts.confirmed, Icon: CheckCircle2, accent: "text-primary" },
    { label: "Pending", value: counts.pending, Icon: Clock, accent: "text-secondary" },
    { label: "Declined", value: counts.declined, Icon: XCircle, accent: "text-destructive" },
  ];

  const selectCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="bg-surface min-h-screen pb-32">
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
              Track RSVPs, manage groups, and estimate catering — all in one calm, controlled view.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Counters */}
      <section className="container-narrow -mt-8 md:-mt-10">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {counters.map(({ label, value, Icon, accent }) => (
              <div
                key={label}
                className="bg-card border border-border rounded-2xl shadow-soft p-4 md:p-5 hover:shadow-elegant transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
                  <Icon className={`h-4 w-4 ${accent}`} />
                </div>
                <p className={`mt-2 text-2xl md:text-3xl font-serif ${accent}`}>{value}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Insights */}
        {(counts.pending > 0 || topGroup) && (
          <Reveal delay={80}>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {counts.pending > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary/15 text-foreground/80 px-3.5 py-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-secondary" />
                  You still have {counts.pending} pending RSVP{counts.pending > 1 ? "s" : ""}
                </span>
              )}
              {topGroup && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-3.5 py-1.5 text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  Most of your guests are from {topGroup}
                </span>
              )}
            </div>
          </Reveal>
        )}

        {/* Quick add */}
        <Reveal delay={120}>
          <div className="mt-8 bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
            <div className="px-5 md:px-7 py-4 border-b border-border bg-surface-muted">
              <h2 className="text-lg md:text-xl text-foreground">Quick add a guest</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add someone in seconds — refine details later.</p>
            </div>
            <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                type="text"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGuest()}
                placeholder="Guest name"
                className="md:col-span-4 rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select value={qSide} onChange={(e) => setQSide(e.target.value as Side)} className={`md:col-span-2 ${selectCls} py-2.5`}>
                <option>Bride</option>
                <option>Groom</option>
              </select>
              <select value={qGroup} onChange={(e) => setQGroup(e.target.value as Group)} className={`md:col-span-2 ${selectCls} py-2.5`}>
                <option>Family</option>
                <option>Friends</option>
                <option>Work</option>
                <option>VIP</option>
              </select>
              <select value={qRsvp} onChange={(e) => setQRsvp(e.target.value as RSVP)} className={`md:col-span-2 ${selectCls} py-2.5`}>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Declined</option>
              </select>
              <button
                onClick={addGuest}
                className="md:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Guest
              </button>
            </div>
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal delay={160}>
          <div className="mt-8 flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                    active
                      ? "bg-foreground text-background border-foreground shadow-soft"
                      : "bg-card text-foreground/70 border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Guest list */}
        <Reveal delay={200}>
          <div className="mt-5 bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-7 py-4 border-b border-border bg-surface-muted">
              <div>
                <h2 className="text-xl md:text-2xl text-foreground">Your Guests</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing {visibleGuests.length} of {guests.length} guest{guests.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={simulateInvites}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Send invites
                </button>
                <button
                  onClick={sharePlan}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-2 py-3 font-medium">Side</th>
                    <th className="px-2 py-3 font-medium">Group</th>
                    <th className="px-2 py-3 font-medium">RSVP</th>
                    <th className="px-2 py-3 font-medium">Invite</th>
                    <th className="px-2 py-3 font-medium">+1</th>
                    <th className="px-2 py-3 font-medium">Meal</th>
                    <th className="px-2 py-3 font-medium">Notes</th>
                    <th className="px-2 py-3 font-medium w-10" />
                  </tr>
                </thead>
                <tbody>
                  {visibleGuests.map((g) => (
                    <tr key={g.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2">
                        <input
                          type="text"
                          value={g.name}
                          onChange={(e) => updateGuest(g.id, { name: e.target.value })}
                          className="w-full bg-transparent border-0 focus:outline-none text-foreground"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select value={g.side} onChange={(e) => updateGuest(g.id, { side: e.target.value as Side })} className={selectCls}>
                          <option>Bride</option>
                          <option>Groom</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={g.group} onChange={(e) => updateGuest(g.id, { group: e.target.value as Group })} className={selectCls}>
                          <option>Family</option>
                          <option>Friends</option>
                          <option>Work</option>
                          <option>VIP</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={g.rsvp} onChange={(e) => updateGuest(g.id, { rsvp: e.target.value as RSVP })} className={selectCls}>
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>Declined</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={g.invite} onChange={(e) => updateGuest(g.id, { invite: e.target.value as Invite })} className={selectCls}>
                          <option>Not Invited</option>
                          <option>Invited</option>
                          <option>RSVP Received</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => updateGuest(g.id, { plusOne: !g.plusOne })}
                          className={`inline-flex items-center justify-center h-6 w-11 rounded-full transition-colors ${
                            g.plusOne ? "bg-primary" : "bg-muted"
                          }`}
                          aria-pressed={g.plusOne}
                          aria-label="Toggle plus one"
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${
                              g.plusOne ? "translate-x-2.5" : "-translate-x-2.5"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <select value={g.meal} onChange={(e) => updateGuest(g.id, { meal: e.target.value as Meal })} className={selectCls}>
                          <option>Veg</option>
                          <option>Non-Veg</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={g.notes}
                          onChange={(e) => updateGuest(g.id, { notes: e.target.value })}
                          placeholder="—"
                          className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => removeGuest(g.id)}
                          aria-label="Remove guest"
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleGuests.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        No guests in this view yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border/60">
              {visibleGuests.map((g) => (
                <div key={g.id} className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={g.name}
                      onChange={(e) => updateGuest(g.id, { name: e.target.value })}
                      placeholder="Guest name"
                      className="flex-1 bg-transparent border-0 border-b border-border focus:outline-none focus:border-primary text-foreground py-1"
                    />
                    <button
                      onClick={() => removeGuest(g.id)}
                      aria-label="Remove guest"
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Side</span>
                      <select value={g.side} onChange={(e) => updateGuest(g.id, { side: e.target.value as Side })} className={`mt-1 ${selectCls} py-2`}>
                        <option>Bride</option>
                        <option>Groom</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Group</span>
                      <select value={g.group} onChange={(e) => updateGuest(g.id, { group: e.target.value as Group })} className={`mt-1 ${selectCls} py-2`}>
                        <option>Family</option>
                        <option>Friends</option>
                        <option>Work</option>
                        <option>VIP</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">RSVP</span>
                      <select value={g.rsvp} onChange={(e) => updateGuest(g.id, { rsvp: e.target.value as RSVP })} className={`mt-1 ${selectCls} py-2`}>
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Declined</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Invite</span>
                      <select value={g.invite} onChange={(e) => updateGuest(g.id, { invite: e.target.value as Invite })} className={`mt-1 ${selectCls} py-2`}>
                        <option>Not Invited</option>
                        <option>Invited</option>
                        <option>RSVP Received</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Meal</span>
                      <select value={g.meal} onChange={(e) => updateGuest(g.id, { meal: e.target.value as Meal })} className={`mt-1 ${selectCls} py-2`}>
                        <option>Veg</option>
                        <option>Non-Veg</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 mt-[18px]">
                      <span className="text-xs text-foreground">Plus one</span>
                      <button
                        onClick={() => updateGuest(g.id, { plusOne: !g.plusOne })}
                        className={`inline-flex items-center justify-center h-6 w-11 rounded-full transition-colors ${
                          g.plusOne ? "bg-primary" : "bg-muted"
                        }`}
                        aria-pressed={g.plusOne}
                      >
                        <span
                          className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${
                            g.plusOne ? "translate-x-2.5" : "-translate-x-2.5"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</span>
                    <input
                      type="text"
                      value={g.notes}
                      onChange={(e) => updateGuest(g.id, { notes: e.target.value })}
                      placeholder="Allergies, seating, etc."
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </label>
                </div>
              ))}
              {visibleGuests.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">No guests in this view yet.</div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Catering cost + CTA */}
        <Reveal delay={240}>
          <div className="mt-10 bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 md:px-8 py-6 border-b border-border bg-gradient-hero">
              <h2 className="text-2xl md:text-3xl text-foreground">Estimated Catering Cost</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your confirmed guests and average cost per plate.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Confirmed Guests</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-foreground">{counts.confirmed}</p>
              </div>
              <div className="p-6 md:p-8">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Avg. cost per plate (₹)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={perPlate}
                    onChange={(e) => setPerPlate(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="800"
                    className="mt-2 w-full max-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
              <div className="p-6 md:p-8">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Total</p>
                <p className="mt-2 text-2xl md:text-3xl font-serif text-primary">{inr(cateringCost)}</p>
              </div>
            </div>
            <div className="px-6 md:px-8 py-5 border-t border-border flex flex-wrap gap-3 justify-end">
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
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

export default GuestPlanner;
