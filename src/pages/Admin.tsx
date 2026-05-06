import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type VendorRow = {
  id: string;
  vendor_name: string;
  service_type: string;
  status: string;
  price_range: string | null;
  description: string | null;
  images: any;
  owner_user_id: string | null;
  created_at: string;
};

const Admin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<VendorRow[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    document.title = "Admin · Nivora";
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading]);

  const load = async () => {
    setRows(null);
    let q = supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(data as VendorRow[]);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] container-narrow flex flex-col items-center justify-center text-center py-20">
        <h1 className="text-2xl font-serif text-foreground">Access denied</h1>
        <p className="mt-3 text-muted-foreground text-sm">You don't have permission to view this page.</p>
        <Link to="/" className="mt-6 text-primary text-sm hover:underline">Back to home</Link>
      </div>
    );
  }

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this vendor permanently?")) return;
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <section className="py-12 md:py-16 container-narrow min-h-[80vh]">
      <h1 className="text-3xl md:text-4xl font-serif text-foreground">Vendor Admin</h1>
      <p className="mt-2 text-muted-foreground text-sm">Approve or reject vendor applications.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {rows === null ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No vendors in this view.</p>
        ) : (
          rows.map((v) => {
            const imgs = Array.isArray(v.images) ? (v.images as string[]) : [];
            return (
              <div key={v.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col md:flex-row gap-4">
                <div className="md:w-32 h-24 md:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {imgs[0] ? (
                    <img src={imgs[0]} alt={v.vendor_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="text-lg font-medium text-foreground">{v.vendor_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      v.status === "approved" ? "bg-primary-soft text-primary" :
                      v.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{v.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{v.service_type} · {v.price_range || "—"}</p>
                  <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{v.description}</p>
                </div>
                <div className="flex md:flex-col gap-2 md:w-32">
                  <Link to={`/vendors/${v.id}`} className="text-xs text-center rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary transition-colors">View</Link>
                  {v.status !== "approved" && (
                    <button onClick={() => setStatus(v.id, "approved")} className="text-xs inline-flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90">
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  )}
                  {v.status !== "rejected" && (
                    <button onClick={() => setStatus(v.id, "rejected")} className="text-xs inline-flex items-center justify-center gap-1 rounded-full border border-border px-3 py-1.5 hover:border-destructive hover:text-destructive transition-colors">
                      <X className="h-3 w-3" /> Reject
                    </button>
                  )}
                  <button onClick={() => remove(v.id)} className="text-xs inline-flex items-center justify-center gap-1 rounded-full text-destructive hover:bg-destructive/10 px-3 py-1.5 transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default Admin;
