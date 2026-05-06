import { Link, useParams, Navigate } from "react-router-dom";
import { services, type Vendor } from "@/data/vendors";
import { ArrowRight, Loader2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useEffect, useState } from "react";
import { fetchApprovedVendors } from "@/lib/vendorsDb";

const titles: Record<string, { title: string; subtitle: string }> = {
  photography: {
    title: "Wedding Photographers",
    subtitle: "Storytellers who capture the moments you'll cherish forever.",
  },
  catering: {
    title: "Wedding Caterers",
    subtitle: "Curated culinary experiences for guests to remember.",
  },
};

const ServiceListing = () => {
  const { service } = useParams();
  const [filtered, setFiltered] = useState<Vendor[] | null>(null);

  useEffect(() => {
    if (!service || !titles[service]) return;
    setFiltered(null);
    fetchApprovedVendors(service as "photography" | "catering").then(setFiltered);
  }, [service]);

  if (!service || !titles[service]) return <Navigate to="/services" replace />;
  const meta = titles[service];

  return (
    <section className="py-16 md:py-24">
      <div className="container-narrow">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 animate-fade-down">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-primary transition-colors">Services</Link>
          <span>/</span>
          <span className="text-foreground">{services.find((s) => s.slug === service)?.title}</span>
        </nav>

        <div className="max-w-2xl mb-14">
          <h1
            className="text-4xl md:text-5xl text-foreground text-balance animate-fade-up"
          >
            {meta.title}
          </h1>
          <p
            className="mt-4 text-lg text-muted-foreground animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            {meta.subtitle}
          </p>
        </div>

        {filtered === null ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <h2 className="font-serif text-2xl text-foreground">
                Vendors coming soon
              </h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                We're carefully onboarding vendors for this category. Check back
                shortly — or reach out if you'd like to be notified.
              </p>
              <Link
                to="/services"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
              >
                Back to services
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((v, i) => (
              <Reveal key={v.id} delay={i * 100} as="article">
                <div className="group flex flex-col h-full overflow-hidden rounded-2xl bg-card border border-border shadow-soft hover-lift">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={v.image}
                      alt={v.name}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-[900ms] ease-out"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl text-foreground">{v.name}</h3>
                    <p className="mt-1 text-sm font-medium text-secondary">{v.priceRange}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                      {v.shortDescription}
                    </p>
                    <Link
                      to={`/vendors/${v.id}`}
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300 group/btn"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServiceListing;
