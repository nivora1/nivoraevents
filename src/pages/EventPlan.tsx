import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalPlan, setLocalPlan, getOrCreatePlanRow, savePlanVendors } from "@/lib/eventPlan";
import { dbRowToVendor } from "@/lib/vendorsDb";
import type { Vendor } from "@/data/vendors";
import { buildBookingWhatsAppUrl } from "@/lib/contact";

const EventPlan = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(() => getLocalPlan());
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    document.title = "My Event Plan · Nivora";
  }, []);

  // Sync from DB if logged in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const row = await getOrCreatePlanRow(user.id);
      const remote = Array.isArray(row.vendor_ids) ? (row.vendor_ids as string[]) : [];
      const local = getLocalPlan();
      const merged = Array.from(new Set([...remote, ...local]));
      setIds(merged);
      setLocalPlan(merged);
      if (merged.length !== remote.length) {
        await savePlanVendors(user.id, merged);
      }
    })();
  }, [user]);

  // Load vendor details
  useEffect(() => {
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
  }, [ids]);

  const remove = async (id: string) => {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    setLocalPlan(next);
    if (user) await savePlanVendors(user.id, next);
  };

  return (
    <section className="py-12 md:py-16 container-narrow min-h-[80vh]">
      <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Your Plan</span>
      <h1 className="mt-3 text-3xl md:text-4xl font-serif text-foreground">My Event Plan</h1>
      <p className="mt-3 text-muted-foreground text-sm max-w-xl">
        Vendors you've shortlisted for your event. {user ? "Synced to your account." : "Sign in to sync across devices."}
      </p>

      <div className="mt-8">
        {vendors === null ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : vendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <p className="text-muted-foreground text-sm">Your plan is empty. Browse vendors and add your favourites.</p>
            <Link to="/services" className="mt-6 inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
                <Link to={`/vendors/${v.id}`} className="aspect-[4/3] overflow-hidden block">
                  <img src={v.image} alt={v.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg text-foreground">{v.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-secondary mt-1">{v.service}</p>
                  <p className="text-sm text-primary font-medium mt-1">{v.priceRange}</p>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={buildBookingWhatsAppUrl(v.name)}
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
    </section>
  );
};

export default EventPlan;
