import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check } from "lucide-react";
import type { WeddingProfile } from "@/lib/weddingProfile";
import WeddingProfileFlow from "./WeddingProfileFlow";

type Props = {
  profile: WeddingProfile;
  onSave: (data: WeddingProfile) => Promise<void>;
};

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="py-3 border-b border-border/60 last:border-0 grid grid-cols-3 gap-4">
      <dt className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium col-span-1">
        {label}
      </dt>
      <dd className="col-span-2 text-sm text-foreground">{value}</dd>
    </div>
  );
};

const WeddingProfileSummary = ({ profile, onSave }: Props) => {
  const [editing, setEditing] = useState(false);

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-primary-soft/40 via-card to-secondary-soft/30 shadow-soft overflow-hidden">
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 md:p-10"
          >
            <WeddingProfileFlow
              initial={profile}
              submitLabel="Save Wedding Profile ✨"
              onCancel={() => setEditing(false)}
              onComplete={async (data) => {
                await onSave(data);
                setEditing(false);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 md:p-8"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold">
                  Wedding Profile
                </span>
                <h2 className="mt-2 text-2xl md:text-3xl font-serif text-foreground">
                  {profile.partner1 && profile.partner2
                    ? `${profile.partner1} & ${profile.partner2}`
                    : "Your Wedding"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" /> Personalising your planning
                </p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <dl className="mt-6">
              <Row
                label="Wedding Type"
                value={
                  profile.weddingType
                    ? `${profile.weddingType}${profile.community ? ` · ${profile.community}` : ""}`
                    : undefined
                }
              />
              <Row
                label="Location"
                value={
                  profile.city
                    ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}${
                        profile.locationType === "destination" && profile.destinationCity
                          ? ` → ${profile.destinationCity}`
                          : ""
                      }`
                    : undefined
                }
              />
              <Row
                label="Celebrations"
                value={
                  profile.events?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.events.map((e) => (
                        <span
                          key={e.name}
                          className="inline-flex items-center rounded-full bg-card border border-border px-2.5 py-0.5 text-[11px]"
                        >
                          {e.name}
                          {e.date ? ` · ${e.date}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : undefined
                }
              />
              <Row
                label="Style"
                value={
                  profile.styles?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.styles.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full bg-primary-soft/60 text-primary px-2.5 py-0.5 text-[11px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : undefined
                }
              />
              <Row
                label="Priorities"
                value={
                  profile.priorities?.length ? (
                    <ol className="flex flex-wrap gap-1.5">
                      {profile.priorities.map((p, i) => (
                        <li
                          key={p}
                          className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-2.5 py-0.5 text-[11px]"
                        >
                          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                            {i + 1}
                          </span>
                          {p}
                        </li>
                      ))}
                    </ol>
                  ) : undefined
                }
              />
              <Row
                label="Already Booked"
                value={profile.booked?.length ? profile.booked.join(", ") : undefined}
              />
              <Row label="Notes" value={profile.notes} />
              <Row
                label="Contact"
                value={
                  profile.phone || profile.email
                    ? [profile.phone, profile.email].filter(Boolean).join(" · ")
                    : undefined
                }
              />
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default WeddingProfileSummary;
