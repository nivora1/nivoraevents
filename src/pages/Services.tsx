import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/vendors";

const Services = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container-narrow">
        <div className="max-w-2xl mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
            Browse Categories
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">
            Wedding services, thoughtfully curated.
          </h1>
          <p className="mt-5 text-muted-foreground text-lg">
            Hand-picked vendors across every category you need for your big day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((s) => (
            <Link
              to={`/services/${s.slug}`}
              key={s.slug}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-soft hover:shadow-elegant transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-7">
                <h2 className="text-2xl text-foreground">{s.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  View Vendors <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
