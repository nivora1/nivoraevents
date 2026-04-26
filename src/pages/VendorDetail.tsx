import { Link, useParams, Navigate } from "react-router-dom";
import { vendors } from "@/data/vendors";
import { Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { buildBookingWhatsAppUrl } from "@/lib/contact";

const VendorDetail = () => {
  const { id } = useParams();
  const vendor = vendors.find((v) => v.id === id);
  const [activeImg, setActiveImg] = useState(0);

  if (!vendor) return <Navigate to="/services" replace />;

  const whatsappUrl = buildBookingWhatsAppUrl(vendor.name);

  const serviceLabel = vendor.service === "photography" ? "Photographers" : "Caterers";

  return (
    <section className="py-12 md:py-20">
      <div className="container-narrow">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-primary">Services</Link>
          <span>/</span>
          <Link to={`/services/${vendor.service}`} className="hover:text-primary">{serviceLabel}</Link>
          <span>/</span>
          <span className="text-foreground">{vendor.name}</span>
        </nav>

        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
            {serviceLabel.replace("s", "")}
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">
            {vendor.name}
          </h1>
          <p className="mt-3 text-lg font-medium text-primary">{vendor.priceRange}</p>
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
          </div>

          {/* Booking card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-7 shadow-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Price range</p>
              <p className="mt-1 font-serif text-2xl text-foreground">{vendor.priceRange}</p>
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
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default VendorDetail;
