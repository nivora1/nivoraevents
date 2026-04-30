import { Users, Sparkles } from "lucide-react";

const GuestPlanner = () => {
  return (
    <section className="container-narrow py-20 md:py-28 text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary-soft text-primary mb-6 animate-scale-in">
        <Users className="h-6 w-6" />
      </div>
      <h1 className="text-3xl md:text-5xl text-foreground animate-fade-up">
        Guest Planner
      </h1>
      <p
        className="mt-5 text-muted-foreground max-w-xl mx-auto animate-fade-up"
        style={{ animationDelay: "120ms" }}
      >
        Manage your wedding guest list with ease — RSVPs, seating, and
        invitations, all in one place.
      </p>
      <div
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <Sparkles className="h-4 w-4 text-secondary" />
        Coming soon
      </div>
    </section>
  );
};

export default GuestPlanner;
