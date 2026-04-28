import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { services } from "@/data/vendors";
import { Reveal } from "@/components/Reveal";

const Services = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container-narrow">
        <Reveal className="max-w-2xl mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
            Browse Categories
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl text-foreground text-balance">
            Wedding services, thoughtfully curated.
          </h1>
          <p className="mt-5 text-muted-foreground text-lg">
            Hand-picked vendors across every category you need for your big day.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 120}>
              <Link
                to={`/services/${s.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-card border border-border shadow-soft hover-lift"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-[900ms] ease-out"
                  />
                </div>
                <div className="p-7">
                  <h2 className="text-2xl text-foreground">{s.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    View Vendors
                    <ArrowRight className="h-4 w-4 icon-shift" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
