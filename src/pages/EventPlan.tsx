import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLocalPlan,
  setLocalPlan,
  getOrCreatePlanRow,
  savePlanVendors,
  getLocalSelections,
  setLocalSelections,
  type SelectionMap,
} from "@/lib/eventPlan";
import {
  fetchProfile,
  upsertProfile,
  getLocalProfile,
  setLocalProfile,
  type WeddingProfile,
} from "@/lib/weddingProfile";
import { dbRowToVendor } from "@/lib/vendorsDb";
import { displayVendorPrice } from "@/lib/format";
import type { Vendor } from "@/data/vendors";
import { buildBookingWhatsAppUrl } from "@/lib/contact";
import WeddingProfileFlow, {
  CompletionScreen,
} from "@/components/wedding-profile/WeddingProfileFlow";
import WeddingProfileSummary from "@/components/wedding-profile/WeddingProfileSummary";

type ViewState = "loading" | "onboarding" | "celebration" | "dashboard";

const EventPlan = () => {
  const { user } = useAuth();

  // Profile state
  const [profile, setProfile] = useState<WeddingProfile>({});
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
  const [view, setView] = useState<ViewState>("loading");

  // Vendor cart state (unchanged)
  const [ids, setIds] = useState<string[]>(() => getLocalPlan());
  const [selections, setSelections] = useState<SelectionMap>(() => getLocalSelections());
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    document.title = "My Plan · Nivora";
  }, []);

  // Load wedding profile
  useEffect(() => {
    (async () => {
      const local = getLocalProfile();
      if (user) {
        try {
          const remote = await fetchProfile(user.id);
          if (remote?.completed) {
            setProfile(remote.data ?? {});
            setProfileCompleted(true);
            setLocalProfile(remote.data ?? {}, true);
            setView("dashboard");
            return;
          }
          // Prefer remote draft over local if it has more fields
          const remoteData = remote?.data ?? {};
          const seed =
            Object.keys(remoteData).length >= Object.keys(local.data).length
              ? remoteData
              : local.data;
          setProfile(seed);
          setProfileCompleted(false);
          setView("onboarding");
        } catch {
          setProfile(local.data);
          setProfileCompleted(local.completed);
          setView(local.completed ? "dashboard" : "onboarding");
        }
      } else {
        setProfile(local.data);
        setProfileCompleted(local.completed);
        setView(local.completed ? "dashboard" : "onboarding");
      }
    })();
  }, [user]);

  // Sync vendor plan from DB when logged in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const row = await getOrCreatePlanRow(user.id);
      const remote = Array.isArray(row.vendor_ids) ? (row.vendor_ids as string[]) : [];
      const remoteSel = (row as { selections?: SelectionMap }).selections ?? {};
      const local = getLocalPlan();
      const localSel = getLocalSelections();
      const merged = Array.from(new Set([...remote, ...local]));
      const mergedSel: SelectionMap = { ...remoteSel, ...localSel };
      setIds(merged);
      setSelections(mergedSel);
      setLocalPlan(merged);
      setLocalSelections(mergedSel);
      if (
        merged.length !== remote.length ||
        JSON.stringify(mergedSel) !== JSON.stringify(remoteSel)
      ) {
        await savePlanVendors(user.id, merged, mergedSel);
      }
    })();
  }, [user]);

  // Load vendor details
  useEffect(() => {
    if (view !== "dashboard") return;
    if (ids.length === 0) {
      setVendors([]);
      return;
    }
    setVendors(null);
    supabase
      .from("vendors")
      .select("*")
      .in("id", ids)
      .then(({ data }) => setVendors((data ?? []).map(dbRowToVendor)));
  }, [ids, view]);

  const remove = async (id: string) => {
    const next = ids.filter((x) => x !== id);
    const nextSel = { ...selections };
    delete nextSel[id];
    setIds(next);
    setSelections(nextSel);
    setLocalPlan(next);
    setLocalSelections(nextSel);
    if (user) await savePlanVendors(user.id, next, nextSel);
  };

  const buildWaUrl = (v: Vendor) => {
    const sel = selections[v.id];
    const opts: Parameters<typeof buildBookingWhatsAppUrl>[1] = {};
    if (v.service === "catering" && sel?.itemIds?.length) {
      const items = v.menu.filter((m) => sel.itemIds!.includes(m.id));
      if (items.length > 0) {
        opts.items = items.map((i) => i.name);
        opts.total = items.reduce((s, i) => s + (i.price || 0), 0);
      }
    }
    if (v.service === "photography" && sel?.packageId) {
      const pkg = v.packages.find((p) => p.id === sel.packageId);
      if (pkg) {
        opts.packageName = pkg.name;
        opts.packagePrice = pkg.price;
      }
    }
    return buildBookingWhatsAppUrl(v.name, opts);
  };

  const renderSelectionSummary = (v: Vendor) => {
    const sel = selections[v.id];
    if (!sel) return null;
    if (v.service === "catering" && sel.itemIds?.length) {
      const items = v.menu.filter((m) => sel.itemIds!.includes(m.id));
      if (items.length === 0) return null;
      const total = items.reduce((s, i) => s + (i.price || 0), 0);
      return (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {items.length} item{items.length > 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")}
        </p>
      );
    }
    if (v.service === "photography" && sel.packageId) {
      const pkg = v.packages.find((p) => p.id === sel.packageId);
      if (!pkg) return null;
      return (
        <p className="mt-2 text-xs text-muted-foreground">
          Package: {pkg.name}
          {pkg.price ? ` · ₹${pkg.price.toLocaleString("en-IN")}` : ""}
        </p>
      );
    }
    return null;
  };

  const handleProfileComplete = async (data: WeddingProfile) => {
    setProfile(data);
    setProfileCompleted(true);
    setLocalProfile(data, true);
    if (user) {
      try {
        await upsertProfile(user.id, data, true);
      } catch (e) {
        console.error(e);
      }
    }
    // Move to celebration screen after brief pause
    setTimeout(() => setView("celebration"), 900);
  };

  const handleProfileEdit = async (data: WeddingProfile) => {
    setProfile(data);
    setLocalProfile(data, true);
    if (user) {
      try {
        await upsertProfile(user.id, data, true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  /* ---------- Render ---------- */

  if (view === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (view === "onboarding") {
    return (
      <section className="py-12 md:py-16 container-narrow min-h-[80vh]">
        <WeddingProfileFlow initial={profile} onComplete={handleProfileComplete} />
      </section>
    );
  }

  if (view === "celebration") {
    return (
      <section className="container-narrow">
        <CompletionScreen onStart={() => setView("dashboard")} />
      </section>
    );
  }

  // Dashboard
  return (
    <section className="py-12 md:py-16 container-narrow min-h-[80vh] space-y-10">
      <WeddingProfileSummary profile={profile} onSave={handleProfileEdit} />

      <div>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
              Your Plan
            </span>
            <h2 className="mt-2 text-2xl md:text-3xl font-serif text-foreground">
              Shortlisted Vendors
            </h2>
            <p className="mt-1.5 text-muted-foreground text-sm">
              {user ? "Synced to your account." : "Sign in to sync across devices."}
            </p>
          </div>
          <Link
            to="/services"
            className="text-sm text-primary hover:underline font-medium"
          >
            Browse more →
          </Link>
        </div>

        <div className="mt-6">
          {vendors === null ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <p className="text-muted-foreground text-sm">
                Your plan is empty. Browse vendors and add your favourites.
              </p>
              <Link
                to="/services"
                className="mt-6 inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
                >
                  <Link
                    to={`/vendors/${v.id}`}
                    className="aspect-[4/3] overflow-hidden block"
                  >
                    <img
                      src={v.image}
                      alt={v.name}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg text-foreground">{v.name}</h3>
                    <p className="text-xs uppercase tracking-wider text-secondary mt-1">
                      {v.service}
                    </p>
                    <p className="text-sm text-primary font-medium mt-1">
                      {displayVendorPrice(v.service, v.priceRange)}
                    </p>
                    {renderSelectionSummary(v)}
                    <div className="mt-4 flex gap-2">
                      <a
                        href={buildWaUrl(v)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Book
                      </a>
                      <button
                        onClick={() => remove(v.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventPlan;
