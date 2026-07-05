import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, ChefHat, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { digitsOnly, formatInrShort, formatExperience } from "@/lib/format";

type Pkg = {
  id: string;
  name: string;
  price: string; // digits only
  description: string;
};

const fieldLabel = "block text-sm font-medium text-foreground mb-2";
const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";
const previewClass = "mt-1.5 text-xs text-muted-foreground";

const VendorApplicationPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [serviceType, setServiceType] = useState<"" | "photography">("");
  const [vendorName, setVendorName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [social, setSocial] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([
    { id: crypto.randomUUID(), name: "", price: "", description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "List Your Service · Nivora";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { state: { from: { pathname: "/list-your-service" } } });
  }, [user, loading, navigate]);

  const handleImages = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((p) => [...p, ...arr]);
    arr.forEach((f) => {
      const r = new FileReader();
      r.onload = () => setPreviews((p) => [...p, r.result as string]);
      r.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const updatePackage = (id: string, patch: Partial<Pkg>) =>
    setPackages((p) => p.map((pkg) => (pkg.id === id ? { ...pkg, ...patch } : pkg)));
  const addPackage = () =>
    setPackages((p) => [...p, { id: crypto.randomUUID(), name: "", price: "", description: "" }]);
  const removePackage = (id: string) => setPackages((p) => p.filter((pkg) => pkg.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!vendorName.trim() || serviceType !== "photography") {
      toast.error("Vendor name is required");
      return;
    }
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vendor-images")
          .upload(path, f, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("vendor-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const cleanPackages = packages
        .filter((p) => p.name.trim() || p.price.trim() || p.description.trim())
        .map((p) => ({
          id: p.id,
          name: p.name.trim(),
          price: Number(digitsOnly(p.price)) || 0,
          description: p.description.trim(),
        }));

      const { error } = await supabase.from("vendors").insert({
        owner_user_id: user.id,
        vendor_name: vendorName.trim(),
        service_type: "photography",
        description: description.trim(),
        short_description: shortDescription.trim() || description.trim().slice(0, 140),
        price_range: priceRange.trim(),
        services_included: [],
        images: uploadedUrls,
        packages: cleanPackages,
        menu: [],
        experience: experience.trim() || null,
        location: location.trim() || null,
        events: [],
        social: social.trim() || null,
        status: "approved",
      });
      if (error) throw error;
      toast.success("Listing published!");
      navigate("/list-your-service/success", { state: { vendorName, serviceType: "photography" } });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Step 1: choose service type
  if (!serviceType) {
    return (
      <section className="py-12 md:py-20 bg-surface min-h-[80vh]">
        <div className="mx-auto px-6 max-w-3xl">
          <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-foreground">List Your Service</span>
          </nav>

          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden mb-8">
            <div className="h-2 bg-gradient-primary" />
            <div className="p-8 md:p-10">
              <h1 className="text-3xl md:text-4xl text-foreground text-balance">List Your Service on Nivora</h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Choose the service you want to offer. Your listing goes live immediately after you submit.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => setServiceType("photography")}
              className="group rounded-2xl bg-card border border-border shadow-soft p-8 text-left hover:border-primary hover:shadow-card transition-all"
            >
              <div className="h-14 w-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Camera className="h-6 w-6" />
              </div>
              <h2 className="text-xl text-foreground mb-2">Photography</h2>
              <p className="text-sm text-muted-foreground">Wedding, candid, cinematic and event photography & videography.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/list-your-service/catering")}
              className="group rounded-2xl bg-card border border-border shadow-soft p-8 text-left hover:border-primary hover:shadow-card transition-all"
            >
              <div className="h-14 w-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ChefHat className="h-6 w-6" />
              </div>
              <h2 className="text-xl text-foreground mb-2">Catering</h2>
              <p className="text-sm text-muted-foreground">Build a structured menu — starters, mains, desserts and more — with per-dish pricing.</p>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-surface min-h-[80vh]">
      <div className="mx-auto px-6 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <button type="button" onClick={() => setServiceType("")} className="hover:text-primary">List Your Service</button>
          <span>/</span>
          <span className="text-foreground">Photography</span>
        </nav>

        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden mb-8">
          <div className="h-2 bg-gradient-primary" />
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl text-foreground text-balance">
              Photography Listing Details
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Fill in your studio details and packages. Your listing goes live in Photography immediately after submission.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10">
            <label className={fieldLabel}>Upload your service images</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary-soft/40 transition-colors p-10 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Click to upload images</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB each. Multiple files supported.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImages(e.target.files)}
              />
            </div>
            {previews.length > 0 && (
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10 space-y-6">
            <h2 className="text-xl text-foreground">Basic details</h2>
            <div>
              <label className={fieldLabel}>Vendor Name <span className="text-destructive">*</span></label>
              <input required type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Lumière Studios" className={inputClass} maxLength={120} />
            </div>
            <div>
              <label className={fieldLabel}>Short Tagline</label>
              <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary shown on listing cards" className={inputClass} maxLength={160} />
            </div>
            <div>
              <label className={fieldLabel}>Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell couples about your work, experience, and style..." className={inputClass} maxLength={2000} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Starting Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={priceRange}
                    onChange={(e) => setPriceRange(digitsOnly(e.target.value))}
                    placeholder="e.g. 30000"
                    className={`${inputClass} pl-8`}
                    maxLength={12}
                  />
                </div>
                {priceRange && (
                  <p className={previewClass}>Will appear as: <span className="text-foreground font-medium">{formatInrShort(Number(priceRange))}</span></p>
                )}
              </div>
              <div>
                <label className={fieldLabel}>Experience (years)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={experience}
                  onChange={(e) => setExperience(digitsOnly(e.target.value).slice(0, 2))}
                  placeholder="e.g. 5"
                  className={inputClass}
                  maxLength={2}
                />
                {experience && (
                  <p className={previewClass}>Will appear as: <span className="text-foreground font-medium">{formatExperience(experience)}</span></p>
                )}
              </div>
              <div>
                <label className={fieldLabel}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" className={inputClass} maxLength={120} />
              </div>
              <div>
                <label className={fieldLabel}>Social</label>
                <input type="text" value={social} onChange={(e) => setSocial(e.target.value)} placeholder="@your.instagram" className={inputClass} maxLength={120} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-foreground">Packages</h2>
              <span className="text-xs text-muted-foreground">{packages.length} package{packages.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-5">
              {packages.map((pkg, idx) => (
                <div key={pkg.id} className="rounded-xl border border-border p-5 bg-surface/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-secondary font-semibold">Package {idx + 1}</span>
                    {packages.length > 1 && (
                      <button type="button" onClick={() => removePackage(pkg.id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove package">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={fieldLabel}>Package Name</label>
                      <input type="text" value={pkg.name} onChange={(e) => updatePackage(pkg.id, { name: e.target.value })} placeholder="e.g. Essential Wedding Coverage" className={inputClass} maxLength={120} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={pkg.price}
                          onChange={(e) => updatePackage(pkg.id, { price: digitsOnly(e.target.value) })}
                          placeholder="e.g. 50000"
                          className={`${inputClass} pl-8`}
                          maxLength={12}
                        />
                      </div>
                      {pkg.price && (
                        <p className={previewClass}>Will appear as: <span className="text-foreground font-medium">{formatInrShort(Number(pkg.price))}</span></p>
                      )}
                    </div>
                    <div>
                      <label className={fieldLabel}>Package Description</label>
                      <textarea rows={3} value={pkg.description} onChange={(e) => updatePackage(pkg.id, { description: e.target.value })} placeholder="What's included in this package..." className={inputClass} maxLength={1000} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPackage} className="mt-5 inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 text-primary px-5 py-2.5 text-sm font-medium hover:bg-primary-soft transition-colors">
              <Plus className="h-4 w-4" /> Add Another Package
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <button type="button" onClick={() => setServiceType("")} className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
              Back
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default VendorApplicationPage;
