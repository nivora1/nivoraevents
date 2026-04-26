import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Upload, X } from "lucide-react";
import {
  VendorApplication as VAppType,
  VendorPackage,
  emptyApplication,
  loadApplication,
  saveApplication,
} from "@/lib/vendorApplication";

const fieldLabel = "block text-sm font-medium text-foreground mb-2";
const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";

const VendorApplicationPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isEditing = params.get("edit") === "1";
  const fileRef = useRef<HTMLInputElement>(null);

  const [app, setApp] = useState<VAppType>(() => {
    if (isEditing) {
      const saved = loadApplication();
      if (saved) return saved;
    }
    return emptyApplication();
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const update = <K extends keyof VAppType>(key: K, value: VAppType[K]) =>
    setApp((p) => ({ ...p, [key]: value }));

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) =>
      setApp((p) => ({ ...p, images: [...p.images, ...urls] }))
    );
  };

  const removeImage = (i: number) =>
    setApp((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));

  const updatePackage = (id: string, patch: Partial<VendorPackage>) =>
    setApp((p) => ({
      ...p,
      packages: p.packages.map((pkg) =>
        pkg.id === id ? { ...pkg, ...patch } : pkg
      ),
    }));

  const addPackage = () =>
    setApp((p) => ({
      ...p,
      packages: [
        ...p.packages,
        { id: crypto.randomUUID(), name: "", priceRange: "", description: "" },
      ],
    }));

  const removePackage = (id: string) =>
    setApp((p) => ({
      ...p,
      packages: p.packages.filter((pkg) => pkg.id !== id),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app.vendorName || !app.serviceType) return;
    const submitted: VAppType = { ...app, submittedAt: new Date().toISOString() };
    saveApplication(submitted);
    navigate("/list-your-service/success");
  };

  return (
    <section className="py-12 md:py-20 bg-surface min-h-[80vh]">
      <div className="mx-auto px-6 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">List Your Service</span>
        </nav>

        {/* Header */}
        <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden mb-8">
          <div className="h-2 bg-gradient-primary" />
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl text-foreground text-balance">
              {isEditing ? "Edit Your Listing" : "List Your Service on Nivora"}
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Get discovered by customers and receive quality booking inquiries.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10">
            <label className={fieldLabel}>Upload your service images</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary-soft/40 transition-colors p-10 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Click to upload images
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB each. Multiple files supported.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImages(e.target.files)}
              />
            </div>

            {app.images.length > 0 && (
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {app.images.map((src, i) => (
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

          {/* Basic Details */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10 space-y-6">
            <h2 className="text-xl text-foreground">Basic details</h2>

            <div>
              <label className={fieldLabel}>
                Vendor Name <span className="text-destructive">*</span>
              </label>
              <input
                required
                type="text"
                value={app.vendorName}
                onChange={(e) => update("vendorName", e.target.value)}
                placeholder="e.g. Lumière Studios"
                className={inputClass}
              />
            </div>

            <div>
              <label className={fieldLabel}>Description</label>
              <textarea
                rows={4}
                value={app.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell couples about your work, experience, and style..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={fieldLabel}>
                Service Type <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={app.serviceType}
                onChange={(e) =>
                  update("serviceType", e.target.value as VAppType["serviceType"])
                }
                className={inputClass}
              >
                <option value="">Select a service type</option>
                <option value="photography">Photography</option>
                <option value="catering">Catering</option>
              </select>
            </div>
          </div>

          {/* Packages */}
          <div className="rounded-2xl bg-card border border-border shadow-soft p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-foreground">Packages</h2>
              <span className="text-xs text-muted-foreground">
                {app.packages.length} package{app.packages.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-5">
              {app.packages.map((pkg, idx) => (
                <div key={pkg.id} className="rounded-xl border border-border p-5 bg-surface/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-secondary font-semibold">
                      Package {idx + 1}
                    </span>
                    {app.packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(pkg.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove package"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={fieldLabel}>Package Name</label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                        placeholder="e.g. Essential Wedding Coverage"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Price Range</label>
                      <input
                        type="text"
                        value={pkg.priceRange}
                        onChange={(e) => updatePackage(pkg.id, { priceRange: e.target.value })}
                        placeholder="e.g. ₹30,000 – ₹80,000"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Package Description</label>
                      <textarea
                        rows={3}
                        value={pkg.description}
                        onChange={(e) => updatePackage(pkg.id, { description: e.target.value })}
                        placeholder="What's included in this package..."
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPackage}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-dashed border-primary/40 text-primary px-5 py-2.5 text-sm font-medium hover:bg-primary-soft transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Another Package
            </button>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default VendorApplicationPage;
