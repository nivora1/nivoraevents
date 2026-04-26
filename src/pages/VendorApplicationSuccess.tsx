import { Link, Navigate } from "react-router-dom";
import { CheckCircle2, Pencil } from "lucide-react";
import { loadApplication } from "@/lib/vendorApplication";

const VendorApplicationSuccess = () => {
  const app = loadApplication();
  if (!app || !app.submittedAt) return <Navigate to="/list-your-service" replace />;

  const serviceLabel =
    app.serviceType === "photography" ? "Photography" : "Catering";

  return (
    <section className="py-20 md:py-28 bg-surface min-h-[80vh]">
      <div className="mx-auto px-6 max-w-2xl">
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden text-center">
          <div className="h-2 bg-gradient-primary" />
          <div className="p-10 md:p-14">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl text-foreground text-balance">
              Your listing has been submitted.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Thank you, <span className="text-foreground font-medium">{app.vendorName}</span>.
              Your application will be listed under{" "}
              <span className="text-primary font-medium">{serviceLabel}</span> shortly.
              Our team will review and get in touch.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
              <Link
                to="/list-your-service?edit=1"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Pencil className="h-4 w-4" /> Edit Your Listing
              </Link>
              <Link
                to={`/services/${app.serviceType}`}
                className="inline-flex items-center justify-center rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                View {serviceLabel} Vendors
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorApplicationSuccess;
