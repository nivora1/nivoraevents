import { CheckCircle2, Loader2, CloudOff } from "lucide-react";

type Props = {
  status?: "idle" | "saving" | "saved" | "offline";
};

export const DataPersistenceBanner = ({ status = "saved" }: Props) => {
  const config = {
    idle: { Icon: CheckCircle2, text: "Your changes are saved automatically to your account.", tone: "text-primary" },
    saving: { Icon: Loader2, text: "Saving your changes…", tone: "text-secondary", spin: true },
    saved: { Icon: CheckCircle2, text: "Your changes are saved automatically to your account.", tone: "text-primary" },
    offline: { Icon: CloudOff, text: "You're signed out — sign in to save your data across devices.", tone: "text-muted-foreground" },
  }[status];
  const { Icon, text, tone } = config;
  const spin = status === "saving";

  return (
    <div className="sticky top-16 z-30 bg-primary-soft/40 border-b border-primary/15 backdrop-blur-md">
      <div className="container-narrow flex items-center gap-2.5 py-2 px-4 md:px-6">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${tone} ${spin ? "animate-spin" : ""}`} />
        <p className="text-xs text-foreground/80 leading-snug">{text}</p>
      </div>
    </div>
  );
};
