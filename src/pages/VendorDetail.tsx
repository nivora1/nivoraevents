import { Link, useParams, Navigate } from "react-router-dom";
import type { Vendor } from "@/data/vendors";
import { Check, Loader2, MessageCircle, Plus, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildBookingWhatsAppUrl } from "@/lib/contact";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchVendorById } from "@/lib/vendorsDb";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalPlan, setLocalPlan, savePlanVendors } from "@/lib/eventPlan";
import { toast } from "sonner";

const VendorDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const [planIds, setPlanIds] = useState<string[]>(() => getLocalPlan());

  useEffect(() => {
    if (!id) return;
    setVendor(undefined);
    fetchVendorById(id).then((v) => {
      setVendor(v);
      setSelectedPackageId(v?.packages?.[0]?.id);
    });
  }, [id]);

  const isCatering = vendor?.service === "catering";
  const isPhotography = vendor?.service === "photography";
  const menu = vendor?.menu ?? [];
  const packages = vendor?.packages ?? [];

  const selected = useMemo(
    () => menu.filter((m) => selectedItems[m.id]),
    [menu, selectedItems]
  );

  if (vendor === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!vendor) return <Navigate to="/services" replace />;
  const total = selected.reduce((sum, m) => sum + m.price, 0);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  const whatsappUrl = buildBookingWhatsAppUrl(vendor.name, {
    ...(isCatering && selected.length > 0
      ? { items: selected.map((s) => s.name), total }
      : {}),
    ...(isPhotography && selectedPackage
      ? { packageName: selectedPackage.name, packagePrice: selectedPackage.price }
      : {}),
  });

  const serviceLabel = isCatering ? "Caterers" : "Photographers";

  const toggleItem = (itemId: string) =>
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  return (
    <section className="py-12 md:py-20">
      <div className="container-narrow">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap animate-fade-down">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-primary transition-colors">Services</Link>
          <span>/</span>
          <Link to={`/services/${vendor.service}`} className="hover:text-primary transition-colors">{serviceLabel}</Link>
          <span>/</span>
          <span className="text-foreground">{vendor.name}</span>
        </nav>

        <div className="mb-10 animate-fade-up">
          <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
            {serviceLabel.replace(/s$/, "")}
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">
            {vendor.name}
          </h1>
          <p className="mt-3 text-lg font-medium text-primary">{vendor.priceRange}</p>
          <p className="mt-1 text-xs text-muted-foreground italic">*Prices are negotiable</p>
        </div>

        {/* Gallery */}
        <div className="grid md:grid-cols-5 gap-4 mb-14">
          <div className="md:col-span-4 aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            <img
              src={vendor.gallery[activeImg]}
              alt={`${vendor.name} portfolio`}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-3">
            {vendor.gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-square overflow-hidden rounded-lg transition-all ${
                  activeImg === i ? "ring-2 ring-primary ring-offset-2" : "opacity-70 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-2xl text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                {vendor.description}
              </p>
            </div>

            <div>
              <h2 className="text-2xl text-foreground mb-5">Services included</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {vendor.servicesIncluded.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Photography packages */}
            {isPhotography && packages.length > 0 && (
              <div>
                <h2 className="text-2xl text-foreground mb-2">Packages</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Select a package to include in your booking enquiry.
                </p>
                <Accordion
                  type="single"
                  collapsible
                  value={selectedPackageId}
                  onValueChange={(v) => setSelectedPackageId(v || undefined)}
                  className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border"
                >
                  {packages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <AccordionItem
                        key={pkg.id}
                        value={pkg.id}
                        className={`border-b-0 px-5 transition-colors ${
                          isSelected ? "bg-primary-soft/40" : ""
                        }`}
                      >
                        <AccordionTrigger className="hover:no-underline py-5">
                          <div className="flex flex-1 items-center justify-between gap-4 pr-3">
                            <div className="flex items-center gap-3 text-left">
                              <span
                                className={`h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/40"
                                }`}
                              />
                              <span className="text-sm font-medium text-foreground">
                                {pkg.name}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-primary whitespace-nowrap">
                              {pkg.price > 0
                                ? `₹${pkg.price.toLocaleString("en-IN")}`
                                : pkg.priceText || ""}
                              {pkg.priceLabel && (
                                <span className="text-muted-foreground font-normal">
                                  {pkg.priceLabel}
                                </span>
                              )}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-7 pr-3">
                          {pkg.description}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                <p className="mt-3 text-xs text-muted-foreground italic">*Prices are negotiable</p>
              </div>
            )}

            {/* Catering menu */}
            {isCatering && menu.length > 0 && (
              <div>
                <h2 className="text-2xl text-foreground mb-2">Menu</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Select items to build your custom quote.
                </p>
                {(() => {
                  const groups: { key: string; label: string }[] = [
                    { key: "starters", label: "Starters" },
                    { key: "main", label: "Main Course" },
                    { key: "desserts", label: "Desserts" },
                    { key: "others", label: "Others" },
                  ];
                  const ungrouped = menu.filter((m) => !m.category);
                  return (
                    <div className="space-y-6">
                      {groups.map((g) => {
                        const items = menu.filter((m) => m.category === g.key);
                        if (items.length === 0) return null;
                        return (
                          <div key={g.key}>
                            <h3 className="text-xs uppercase tracking-[0.18em] text-secondary font-semibold mb-3">
                              {g.label}
                            </h3>
                            <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                              {items.map((item) => {
                                const checked = !!selectedItems[item.id];
                                return (
                                  <li key={item.id}>
                                    <label
                                      htmlFor={`menu-${item.id}`}
                                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                                    >
                                      <Checkbox
                                        id={`menu-${item.id}`}
                                        checked={checked}
                                        onCheckedChange={() => toggleItem(item.id)}
                                      />
                                      <span className="flex-1 text-sm text-foreground">{item.name}</span>
                                      <span className="text-sm font-medium text-foreground">
                                        ₹{item.price.toLocaleString("en-IN")}
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                      {ungrouped.length > 0 && (
                        <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                          {ungrouped.map((item) => {
                            const checked = !!selectedItems[item.id];
                            return (
                              <li key={item.id}>
                                <label
                                  htmlFor={`menu-${item.id}`}
                                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                                >
                                  <Checkbox
                                    id={`menu-${item.id}`}
                                    checked={checked}
                                    onCheckedChange={() => toggleItem(item.id)}
                                  />
                                  <span className="flex-1 text-sm text-foreground">{item.name}</span>
                                  <span className="text-sm font-medium text-foreground">
                                    ₹{item.price.toLocaleString("en-IN")}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })()}
                <p className="mt-3 text-xs text-muted-foreground italic">*Prices are negotiable</p>
              </div>
            )}

            {(vendor.experience || vendor.location || vendor.events?.length || vendor.social) && (
              <div>
                <h2 className="text-2xl text-foreground mb-5">Vendor details</h2>
                <dl className="grid sm:grid-cols-2 gap-5">
                  {vendor.experience && (
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">Experience</dt>
                      <dd className="mt-1 text-sm text-foreground">{vendor.experience}</dd>
                    </div>
                  )}
                  {vendor.location && (
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">Location servicing</dt>
                      <dd className="mt-1 text-sm text-foreground">{vendor.location}</dd>
                    </div>
                  )}
                  {vendor.events && vendor.events.length > 0 && (
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">Events undertaken</dt>
                      <dd className="mt-1 text-sm text-foreground">{vendor.events.join(", ")}</dd>
                    </div>
                  )}
                  {vendor.social && (
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">Social</dt>
                      <dd className="mt-1 text-sm text-foreground">{vendor.social}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Booking card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-7 shadow-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Price range</p>
              <p className="mt-1 font-serif text-2xl text-foreground">{vendor.priceRange}</p>
              <p className="mt-1 text-xs text-muted-foreground italic">*Prices are negotiable</p>

              {isCatering && menu.length > 0 && (
                <>
              {isPhotography && selectedPackage && (
                <>
                  <div className="mt-6 h-px bg-border" />
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Selected package
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {selectedPackage.name}
                      </span>
                      <span className="font-serif text-xl text-primary whitespace-nowrap">
                        ₹{selectedPackage.price.toLocaleString("en-IN")}
                        {selectedPackage.priceLabel && (
                          <span className="text-muted-foreground text-sm font-normal font-sans">
                            {selectedPackage.priceLabel}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 h-px bg-border" />
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Selected items
                    </p>
                    {selected.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No items selected yet.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {selected.map((s) => (
                          <li key={s.id} className="flex justify-between text-sm">
                            <span className="text-foreground">{s.name}</span>
                            <span className="text-muted-foreground">
                              ₹{s.price.toLocaleString("en-IN")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm font-medium text-foreground">Total</span>
                      <span className="font-serif text-xl text-primary">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 h-px bg-border" />
              <p className="mt-6 text-sm text-muted-foreground">
                Reach out to {vendor.name} directly via WhatsApp. Our team will assist with availability and the best deal.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" />
                Book Now
              </a>
              <p className="mt-3 text-xs text-center text-muted-foreground">
                Opens WhatsApp with a pre-filled message
              </p>

              {(() => {
                const inPlan = planIds.includes(vendor.id);
                const togglePlan = async () => {
                  const next = inPlan
                    ? planIds.filter((x) => x !== vendor.id)
                    : [...planIds, vendor.id];
                  setPlanIds(next);
                  setLocalPlan(next);
                  if (user) {
                    try {
                      await savePlanVendors(user.id, next);
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  toast.success(inPlan ? "Removed from your plan" : "Added to your plan");
                };
                return (
                  <button
                    onClick={togglePlan}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {inPlan ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {inPlan ? "Remove from Plan" : "Add to Event Plan"}
                  </button>
                );
              })()}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default VendorDetail;
