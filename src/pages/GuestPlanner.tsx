import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Share2,
  Mail,
  ChevronDown,
  Phone,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { DataPersistenceBanner } from "@/components/DataPersistenceBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


type Side = "Bride" | "Groom";
type Group = "Family" | "Friends" | "Work" | "VIP";
type RSVP = "Pending" | "Confirmed" | "Declined";
type Invite = "Not Invited" | "Invited" | "RSVP Received";
type Meal = "Veg" | "Non-Veg";

type Guest = {
  id: string;
  name: string;
  mobile: string;
  side: Side | "";
  group: Group | "";
  rsvp: RSVP | "";
  invite: Invite | "";
  plusOne: boolean;
  meal: Meal | "";
  notes: string;
};

type FilterKey = "All" | RSVP | Group;

const uid = () => Math.random().toString(36).slice(2, 9);

const inr = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const filters: FilterKey[] = ["All", "Confirmed", "Pending", "Declined", "Family", "Friends", "Work", "VIP"];

const GuestPlanner = () => {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [perPlate, setPerPlate] = useState<number | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from("guest_planner_data")
        .select("guests, per_plate")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (error) {
        toast.error("Couldn't load saved data");
      } else if (data) {
        setGuests((data.guests as unknown as Guest[]) ?? []);
        setPerPlate(data.per_plate === null ? "" : Number(data.per_plate));
      }
      setLoaded(true);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  // Explicit save — runs only when guests are added / edited / removed.
  const loadedRef = useRef(false);
  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  const persist = useCallback(
    async (nextGuests: Guest[], nextPerPlate: number | "") => {
      if (!user || !loadedRef.current) return;
      setSaveStatus("saving");
      const { error } = await supabase.from("guest_planner_data").upsert(
        [{
          user_id: user.id,
          guests: nextGuests as unknown as never,
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

  // Quick add
  const [qName, setQName] = useState("");
  const [qMobile, setQMobile] = useState("");
  const [qSide, setQSide] = useState<Side | "">("");
  const [qGroup, setQGroup] = useState<Group | "">("");
  const [qRsvp, setQRsvp] = useState<RSVP | "">("");

  // Invites dialog state
  const [invitedRecently, setInvitedRecently] = useState<Guest[]>([]);

  const updateGuest = (id: string, patch: Partial<Guest>) => {
    setGuests((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...patch } : g));
      void persist(next, perPlate);
      return next;
    });
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => {
      const next = prev.filter((g) => g.id !== id);
      void persist(next, perPlate);
      return next;
    });
    if (expandedId === id) setExpandedId(null);
  };

  const addGuest = () => {
    if (!qName.trim()) {
      toast.error("Please enter a guest name");
      return;
    }
    const newGuest: Guest = {
      id: uid(),
      name: qName.trim(),
      mobile: qMobile.trim(),
      side: qSide,
      group: qGroup,
      rsvp: qRsvp || "Pending",
      invite: "Not Invited",
      plusOne: false,
      meal: "",
      notes: "",
    };
    setGuests((prev) => {
      const next = [newGuest, ...prev];
      void persist(next, perPlate);
      return next;
    });
    setQName("");
    setQMobile("");
    setQSide("");
    setQGroup("");
    setQRsvp("");
    toast.success(`${newGuest.name} added to your guest list`);
  };

  const counts = useMemo(() => {
    const total = guests.reduce((sum, g) => sum + 1 + (g.plusOne ? 1 : 0), 0);
    const confirmed = guests
      .filter((g) => g.rsvp === "Confirmed")
      .reduce((s, g) => s + 1 + (g.plusOne ? 1 : 0), 0);
    const pending = guests
      .filter((g) => g.rsvp === "Pending" || g.rsvp === "")
      .reduce((s, g) => s + 1 + (g.plusOne ? 1 : 0), 0);
    const declined = guests.filter((g) => g.rsvp === "Declined").length;
    return { total, confirmed, pending, declined };
  }, [guests]);

  const groupCounts = useMemo(() => {
    const c: Record<Group, number> = { Family: 0, Friends: 0, Work: 0, VIP: 0 };
    guests.forEach((g) => {
      if (g.group) c[g.group] += 1;
    });
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
    const headers = ["Name", "Mobile", "Side", "Group", "RSVP", "Invite Status", "+1", "Meal", "Notes"];
    const rows = [headers.join(",")];
    guests.forEach((g) => {
      const safe = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      rows.push(
        [
          safe(g.name),
          safe(g.mobile),
          g.side || "",
          g.group || "",
          g.rsvp || "",
          g.invite || "",
          g.plusOne ? "Yes" : "No",
          g.meal || "",
          safe(g.notes),
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

  const sendInvites = () => {
    const eligible = guests.filter((g) => g.mobile.trim() && g.invite !== "RSVP Received");
    if (eligible.length === 0) {
      toast.error("No guests with mobile numbers to invite");
      return;
    }
    setGuests((prev) => {
      const next: Guest[] = prev.map((g) =>
        g.mobile.trim() && g.invite !== "RSVP Received" ? { ...g, invite: "Invited" as Invite } : g,
      );
      void persist(next, perPlate);
      return next;
    });
    setInvitedRecently(eligible);
    toast.success(`Invites sent successfully to ${eligible.length} guest${eligible.length > 1 ? "s" : ""}`);
  };

  const counters = [
    { label: "Total Guests", value: counts.total, Icon: Users, accent: "text-foreground" },
    { label: "Confirmed", value: counts.confirmed, Icon: CheckCircle2, accent: "text-primary" },
    { label: "Pending", value: counts.pending, Icon: Clock, accent: "text-secondary" },
    { label: "Declined", value: counts.declined, Icon: XCircle, accent: "text-destructive" },
  ];

  const selectCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";

  // Color hint when value missing
  const placeholderTone = (val: string) => (val === "" ? "text-muted-foreground/60" : "text-foreground");

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
              <h2 className="text-lg md:text-xl text-foreground">Add a guest</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter a name to add — refine details from the list anytime.
              </p>
            </div>
            <div className="p-5 md:p-7 grid grid-cols-1 md:grid-cols-12 gap-3">
              <input
                type="text"
                value={qName}
                onChange={(e) => setQName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGuest()}
                placeholder="Guest name"
                className={`md:col-span-3 ${inputCls}`}
              />
              <input
                type="tel"
                value={qMobile}
                onChange={(e) => setQMobile(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGuest()}
                placeholder="Mobile number"
                className={`md:col-span-2 ${inputCls}`}
              />
              <select
                value={qSide}
                onChange={(e) => setQSide(e.target.value as Side | "")}
                className={`md:col-span-2 ${selectCls} py-2.5 ${placeholderTone(qSide)}`}
              >
                <option value="">Select side (Bride/Groom)</option>
                <option value="Bride">Bride</option>
                <option value="Groom">Groom</option>
              </select>
              <select
                value={qGroup}
                onChange={(e) => setQGroup(e.target.value as Group | "")}
                className={`md:col-span-2 ${selectCls} py-2.5 ${placeholderTone(qGroup)}`}
              >
                <option value="">Select group</option>
                <option value="Family">Family</option>
                <option value="Friends">Friends</option>
                <option value="Work">Work</option>
                <option value="VIP">VIP</option>
              </select>
              <select
                value={qRsvp}
                onChange={(e) => setQRsvp(e.target.value as RSVP | "")}
                className={`md:col-span-1 ${selectCls} py-2.5 ${placeholderTone(qRsvp)}`}
              >
                <option value="">RSVP</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Declined">Declined</option>
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

        {/* Guest list — compact accordion */}
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
                  onClick={sendInvites}
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

            {/* Accordion list (mobile + desktop) */}
            <ul className="divide-y divide-border/60">
              {visibleGuests.map((g) => {
                const open = expandedId === g.id;
                const rsvpDot =
                  g.rsvp === "Confirmed"
                    ? "bg-primary"
                    : g.rsvp === "Declined"
                    ? "bg-destructive"
                    : "bg-secondary";
                const tightSelect =
                  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring";
                const tightInput =
                  "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring";
                return (
                  <li key={g.id} className="bg-card">
                    <button
                      onClick={() => setExpandedId(open ? null : g.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-2 text-left hover:bg-muted/30 transition-colors"
                      aria-expanded={open}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full ${rsvpDot}`} aria-hidden />
                        <span className="text-sm text-foreground truncate">
                          {g.name || "Unnamed guest"}
                        </span>
                        {g.plusOne && (
                          <span className="text-[10px] uppercase tracking-wider text-primary bg-primary-soft px-1.5 py-0.5 rounded">
                            +1
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>

                    {open && (
                      <div className="px-4 md:px-6 pb-3 pt-1 animate-fade-in border-t border-border/40">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-2 mt-2">
                          <label className="block col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</span>
                            <input
                              type="text"
                              value={g.name}
                              onChange={(e) => updateGuest(g.id, { name: e.target.value })}
                              className={`mt-0.5 ${tightInput}`}
                            />
                          </label>
                          <label className="block col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mobile</span>
                            <input
                              type="tel"
                              value={g.mobile}
                              onChange={(e) => updateGuest(g.id, { mobile: e.target.value })}
                              placeholder="Mobile number"
                              className={`mt-0.5 ${tightInput}`}
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Side</span>
                            <select
                              value={g.side}
                              onChange={(e) => updateGuest(g.id, { side: e.target.value as Side | "" })}
                              className={`mt-0.5 ${tightSelect} ${placeholderTone(g.side)}`}
                            >
                              <option value="">Side</option>
                              <option value="Bride">Bride</option>
                              <option value="Groom">Groom</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Group</span>
                            <select
                              value={g.group}
                              onChange={(e) => updateGuest(g.id, { group: e.target.value as Group | "" })}
                              className={`mt-0.5 ${tightSelect} ${placeholderTone(g.group)}`}
                            >
                              <option value="">Group</option>
                              <option value="Family">Family</option>
                              <option value="Friends">Friends</option>
                              <option value="Work">Work</option>
                              <option value="VIP">VIP</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">RSVP</span>
                            <select
                              value={g.rsvp}
                              onChange={(e) => updateGuest(g.id, { rsvp: e.target.value as RSVP | "" })}
                              className={`mt-0.5 ${tightSelect} ${placeholderTone(g.rsvp)}`}
                            >
                              <option value="">RSVP</option>
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Declined">Declined</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Invite</span>
                            <select
                              value={g.invite}
                              onChange={(e) => updateGuest(g.id, { invite: e.target.value as Invite | "" })}
                              className={`mt-0.5 ${tightSelect} ${placeholderTone(g.invite)}`}
                            >
                              <option value="">Invite</option>
                              <option value="Not Invited">Not Invited</option>
                              <option value="Invited">Invited</option>
                              <option value="RSVP Received">RSVP Received</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Meal</span>
                            <select
                              value={g.meal}
                              onChange={(e) => updateGuest(g.id, { meal: e.target.value as Meal | "" })}
                              className={`mt-0.5 ${tightSelect} ${placeholderTone(g.meal)}`}
                            >
                              <option value="">Meal</option>
                              <option value="Veg">Veg</option>
                              <option value="Non-Veg">Non-Veg</option>
                            </select>
                          </label>
                          <label className="flex items-center justify-between rounded-md border border-input bg-background px-2 py-1.5 mt-[16px] col-span-2 md:col-span-1">
                            <span className="text-[11px] text-foreground">Plus one</span>
                            <button
                              onClick={() => updateGuest(g.id, { plusOne: !g.plusOne })}
                              className={`inline-flex items-center justify-center h-5 w-9 rounded-full transition-colors ${
                                g.plusOne ? "bg-primary" : "bg-muted"
                              }`}
                              aria-pressed={g.plusOne}
                            >
                              <span
                                className={`h-4 w-4 rounded-full bg-background shadow transition-transform ${
                                  g.plusOne ? "translate-x-2" : "-translate-x-2"
                                }`}
                              />
                            </button>
                          </label>
                          <label className="block col-span-2 md:col-span-4">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</span>
                            <input
                              type="text"
                              value={g.notes}
                              onChange={(e) => updateGuest(g.id, { notes: e.target.value })}
                              placeholder="Allergies, seating, etc."
                              className={`mt-0.5 ${tightInput}`}
                            />
                          </label>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => removeGuest(g.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
              {visibleGuests.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  {guests.length === 0
                    ? "Your guest list is empty. Add your first guest above."
                    : "No guests match this filter."}
                </li>
              )}
            </ul>
          </div>
        </Reveal>

        {/* Recently invited summary */}
        {invitedRecently.length > 0 && (
          <Reveal delay={80}>
            <div className="mt-6 bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
              <div className="px-5 md:px-7 py-4 border-b border-border bg-primary-soft/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm md:text-base text-foreground font-medium">
                    Invites sent successfully to selected guests
                  </h3>
                </div>
                <button
                  onClick={() => setInvitedRecently([])}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <ul className="divide-y divide-border/60">
                {invitedRecently.map((g) => (
                  <li key={g.id} className="flex items-center justify-between px-5 md:px-7 py-2.5 text-sm">
                    <span className="text-foreground">{g.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {g.mobile}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

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
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Avg. cost per plate (₹)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={perPlate}
                    onChange={(e) => setPerPlate(e.target.value === "" ? "" : Number(e.target.value))}
                    onBlur={() => void persist(guests, perPlate)}
                    placeholder="e.g. 800"
                    className="mt-2 w-full max-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
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
