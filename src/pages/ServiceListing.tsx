import { Link, useParams, Navigate } from "react-router-dom";
import { vendors, services } from "@/data/vendors";
import { ArrowRight } from "lucide-react";

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
  if (!service || !titles[service]) return <Navigate to="/services" replace />;

  const filtered = vendors.filter((v) => v.service === service);
  const meta = titles[service];

  return (
    <section className="py-16 md:py-24">
      <div className="container-narrow">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-primary">Services</Link>
          <span>/</span>
          <span className="text-foreground">{services.find((s) => s.slug === service)?.title}</span>
        </nav>

        <div className="max-w-2xl mb-14">
          <h1 className="text-4xl md:text-5xl text-foreground text-balance">
            {meta.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{meta.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((v) => (
            <article
              key={v.id}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card border border-border shadow-soft hover:shadow-card transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={v.image}
                  alt={v.name}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
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
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceListing;
