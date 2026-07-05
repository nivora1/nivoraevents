import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { digitsOnly, formatExperience, formatInrGrouped, formatPricePerPlate } from "@/lib/format";

type Category = "starters" | "main" | "desserts" | "others";

type Dish = {
  id: string;
  name: string;
  price: string; // string in form, parsed on submit
  category: Category;
};

const CATEGORY_LABELS: Record<Category, string> = {
  starters: "Starters",
  main: "Main Course",
  desserts: "Desserts",
  others: "Others / Miscellaneous",
};

const CATEGORY_ORDER: Category[] = ["starters", "main", "desserts", "others"];

const DISH_PLACEHOLDER: Record<Category, string> = {
  starters: "Dish name (e.g. Paneer Tikka)",
  main: "Dish name (e.g. Biryani)",
  desserts: "Dish name (e.g. Ice Cream)",
  others: "Dish name (e.g. Soft Drink)",
};

const fieldLabel = "block text-sm font-medium text-foreground mb-2";
const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";
const previewClass = "mt-1.5 text-xs text-muted-foreground";

const newDish = (category: Category): Dish => ({
  id: crypto.randomUUID(),
  name: "",
  price: "",
  category,
});

const CateringApplicationPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [vendorName, setVendorName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [social, setSocial] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([
    newDish("starters"),
    newDish("main"),
    newDish("desserts"),
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "List Your Catering · Nivora";
  }, []);

  useEffect(() => {
    if (!loading && !user)
      navigate("/auth", { state: { from: { pathname: "/list-your-service/catering" } } });
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

  const addDish = (category: Category) =>
    setDishes((d) => [...d, newDish(category)]);
  const removeDish = (id: string) =>
    setDishes((d) => d.filter((dish) => dish.id !== id));
  const updateDish = (id: string, patch: Partial<Dish>) =>
    setDishes((d) => d.map((dish) => (dish.id === id ? { ...dish, ...patch } : dish)));

  const dishesByCategory = (cat: Category) => dishes.filter((d) => d.category === cat);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!vendorName.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    const cleanMenu = dishes
      .filter((d) => d.name.trim() && d.price.trim())
      .map((d) => ({
        id: d.id,
        name: d.name.trim(),
        price: Number(d.price) || 0,
        category: d.category,
      }));
    if (cleanMenu.length === 0) {
      toast.error("Add at least one dish with a name and price");
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

      const { error } = await supabase.from("vendors").insert({
        owner_user_id: user.id,
        vendor_name: vendorName.trim(),
        service_type: "catering",
        description: description.trim(),
        short_description: shortDescription.trim() || description.trim().slice(0, 140),
        price_range: priceRange.trim(),
        services_included: [],
        images: uploadedUrls,
        packages: [],
        menu: cleanMenu,
        experience: experience.trim() || null,
        location: location.trim() || null,
        events: [],
        social: social.trim() || null,
        status: "approved",
      });
      if (error) throw error;
      toast.success("Listing published!");
      navigate("/list-your-service/success", {
        state: { vendorName, serviceType: "catering" },
      });
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

  return (
    <section className="py-12 md:py-20 bg-surface min-h-[80vh]">
      <div className="mx-auto px-6 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/list-your-service" className="hover:text-primary">List Your Service</Link>
          <span>/</span>
          <span className="text-foreground">Catering</span>
        </nav>

        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden mb-8">
          <div className="h-2 bg-gradient-primary" />
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl text-foreground text-balance">
              Catering Listing Details
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Build your menu by section. Your listing goes live in Catering immediately after submission.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
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

          {/* Basic */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10 space-y-6">
            <h2 className="text-xl text-foreground">Basic details</h2>
            <div>
              <label className={fieldLabel}>Vendor Name <span className="text-destructive">*</span></label>
              <input required type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. T0.2 Catering" className={inputClass} maxLength={120} />
            </div>
            <div>
              <label className={fieldLabel}>Short Tagline</label>
              <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary shown on listing cards" className={inputClass} maxLength={160} />
            </div>
            <div>
              <label className={fieldLabel}>Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell couples about your kitchen, style and signature dishes..." className={inputClass} maxLength={2000} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Price per Plate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={priceRange}
                    onChange={(e) => setPriceRange(digitsOnly(e.target.value))}
                    placeholder="e.g. 750"
                    className={`${inputClass} pl-8`}
                    maxLength={7}
                  />
                </div>
                {priceRange && (
                  <p className={previewClass}>Will appear as: <span className="text-foreground font-medium">{formatPricePerPlate(priceRange)}</span></p>
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
                  placeholder="e.g. 7"
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

          {/* Menu */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl text-foreground">Menu</h2>
              <span className="text-xs text-muted-foreground">Add dishes by section</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Enter dish name and price (₹) per plate / serving. Empty rows are ignored.
            </p>

            <div className="space-y-6">
              {CATEGORY_ORDER.map((cat) => {
                const items = dishesByCategory(cat);
                return (
                  <div key={cat} className="rounded-xl border border-border bg-surface/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm uppercase tracking-widest text-secondary font-semibold">
                        {CATEGORY_LABELS[cat]}
                      </h3>
                      <span className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className="space-y-3">
                      {items.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No dishes yet.</p>
                      )}
                      {items.map((dish) => (
                        <div key={dish.id} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <input
                            type="text"
                            value={dish.name}
                            onChange={(e) => updateDish(dish.id, { name: e.target.value })}
                            placeholder={DISH_PLACEHOLDER[cat]}
                            className={`${inputClass} sm:flex-1`}
                            maxLength={120}
                          />
                          <div className="flex gap-2">
                            <div className="relative flex-1 sm:flex-none sm:w-40">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={dish.price}
                                onChange={(e) => updateDish(dish.id, { price: digitsOnly(e.target.value) })}
                                placeholder="Price"
                                className={`${inputClass} pl-7`}
                                maxLength={7}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDish(dish.id)}
                              className="h-11 w-11 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive flex items-center justify-center transition-colors"
                              aria-label="Remove dish"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addDish(cat)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 text-primary px-4 py-2 text-sm font-medium hover:bg-primary-soft transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add dish
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <Link to="/list-your-service" className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">
              Back
            </Link>
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

export default CateringApplicationPage;
