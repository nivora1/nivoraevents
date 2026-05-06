import { Link } from "react-router-dom";
import { ArrowRight, Search, Heart, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-wedding.jpg";
import { services } from "@/data/vendors";

import { Reveal } from "@/components/Reveal";

const Index = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container-narrow relative pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-6 animate-fade-down">
                <span className="h-px w-8 bg-primary" />
                Curated Wedding Vendors
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] text-balance animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
                Find the best wedding services, effortlessly.
              </h1>
              <p
                className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-md animate-fade-up"
                style={{ animationDelay: "200ms" }}
              >
                Browse trusted photographers, caterers and more. We help you
                book the perfect vendors.
              </p>
              <div
                className="mt-9 flex flex-wrap gap-4 animate-fade-up"
                style={{ animationDelay: "320ms" }}
              >
                <Link
                  to="/services"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-medium shadow-soft hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
                >
                  Explore Services
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  How it works
                </a>
              </div>
            </div>

            <div
              className="relative animate-scale-in"
              style={{ animationDelay: "200ms" }}
            >
              <div className="absolute -inset-4 bg-secondary/10 rounded-3xl rotate-2 animate-float" />
              <img
                src={heroImage}
                alt="Elegant wedding ceremony venue"
                width={1600}
                height={1024}
                className="relative rounded-2xl shadow-elegant w-full h-[480px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-28">
        <div className="container-narrow">
          <Reveal className="max-w-xl mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
              Our Services
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl text-foreground text-balance">
              Everything you need for the perfect day
            </h2>
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
                    <h3 className="text-2xl text-foreground">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {s.description}
                    </p>
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

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-surface">
        <div className="container-narrow">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
              How It Works
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl text-foreground text-balance">
              Three simple steps to your perfect vendor
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { icon: Search, step: "01", title: "Browse services", desc: "Explore curated categories of wedding vendors." },
              { icon: Heart, step: "02", title: "Choose a vendor", desc: "Shortlist the ones that match your style and budget." },
              { icon: Sparkles, step: "03", title: "We help you book", desc: "Our team negotiates and helps you lock in the best deal." },
            ].map(({ icon: Icon, step, title, desc }, i) => (
              <Reveal key={step} delay={i * 140} className="relative group">
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-12 w-12 rounded-full bg-primary-soft flex items-center justify-center text-primary transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-[-4deg]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-serif text-2xl text-secondary">{step}</span>
                </div>
                <h3 className="text-xl text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-20 md:py-28">
        <div className="container-narrow">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-primary px-8 py-16 md:p-20 text-center shadow-elegant">
              <div className="absolute top-0 right-0 h-64 w-64 bg-secondary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-float" />
              <div
                className="absolute bottom-0 left-0 h-48 w-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 animate-float"
                style={{ animationDelay: "-3s" }}
              />
              <div className="relative max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl text-primary-foreground text-balance">
                  Are you a vendor?
                </h2>
                <p className="mt-4 text-primary-foreground/85 text-base md:text-lg">
                  List your services and get high-quality leads from couples
                  actively planning their wedding.
                </p>
                <Link
                  to="/list-your-service"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-7 py-3.5 text-sm font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300"
                >
                  List Your Service
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

    </>
  );
};

export default Index;
