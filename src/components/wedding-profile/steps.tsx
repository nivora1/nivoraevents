import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EventEntry, WeddingProfile } from "@/lib/weddingProfile";

export type StepProps = {
  value: WeddingProfile;
  update: (patch: Partial<WeddingProfile>) => void;
};

export type StepDef = {
  id: string;
  title: string;
  hint?: string;
  progressMsg: string;
  cta: string;
  render: (p: StepProps) => JSX.Element;
  isValid: (v: WeddingProfile) => boolean;
};

/* ---------- Reusable primitives ---------- */

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.96 }}
    className={cn(
      "px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
      active
        ? "bg-primary text-primary-foreground border-primary shadow-soft"
        : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary-soft/40"
    )}
  >
    <span className="inline-flex items-center gap-1.5">
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </span>
  </motion.button>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
    {children}
  </label>
);

/* ---------- Card 1 ---------- */

const Card1 = ({ value, update }: StepProps) => (
  <div className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <FieldLabel>Partner 1 Name</FieldLabel>
        <Input
          value={value.partner1 ?? ""}
          onChange={(e) => update({ partner1: e.target.value })}
          placeholder="e.g. Aarav"
        />
      </div>
      <div>
        <FieldLabel>Partner 2 Name</FieldLabel>
        <Input
          value={value.partner2 ?? ""}
          onChange={(e) => update({ partner2: e.target.value })}
          placeholder="e.g. Priya"
        />
      </div>
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <FieldLabel>Phone Number</FieldLabel>
        <Input
          inputMode="tel"
          value={value.phone ?? ""}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+91 98xxxxxx"
        />
      </div>
      <div>
        <FieldLabel>Email Address</FieldLabel>
        <Input
          type="email"
          value={value.email ?? ""}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="you@email.com"
        />
      </div>
    </div>
    <div>
      <FieldLabel>Who is filling this form?</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {["Bride", "Groom", "Parent", "Family Member", "Wedding Planner", "Other"].map(
          (opt) => (
            <Chip
              key={opt}
              active={value.filledBy === opt}
              onClick={() => update({ filledBy: opt })}
            >
              {opt}
            </Chip>
          )
        )}
      </div>
    </div>
  </div>
);

/* ---------- Card 2 ---------- */

const COMMUNITIES = [
  "Kannada Brahmin",
  "Tulu",
  "Kodava",
  "Tamil Iyengar",
  "Tamil Iyer",
  "Nair",
  "Punjabi",
  "Marwari",
  "Gujarati",
  "Bengali",
  "Maharashtrian",
  "Telugu",
  "Malayali",
  "Sindhi",
  "Rajput",
  "Kashmiri",
  "Other",
];

const Card2 = ({ value, update }: StepProps) => {
  const [query, setQuery] = useState(value.community ?? "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const trimmed = query.trim();
  const filtered = COMMUNITIES.filter((c) =>
    c.toLowerCase().includes(trimmed.toLowerCase())
  );
  const showCustom =
    trimmed.length > 0 &&
    !COMMUNITIES.some((c) => c.toLowerCase() === trimmed.toLowerCase());

  const select = (val: string) => {
    setQuery(val);
    update({ community: val });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Wedding Type</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {[
            "Hindu",
            "Muslim",
            "Christian",
            "Sikh",
            "Jain",
            "Buddhist",
            "Interfaith",
            "Civil Marriage",
            "Other",
          ].map((opt) => (
            <Chip
              key={opt}
              active={value.weddingType === opt}
              onClick={() => update({ weddingType: opt })}
            >
              {opt}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Community / Tradition (optional)</FieldLabel>
        <div ref={wrapRef} className="relative">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                update({ community: e.target.value });
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              placeholder="Optional – Select or type your community/tradition"
              className="pr-10"
            />
            <button
              type="button"
              aria-label="Toggle community options"
              onClick={() => setOpen((o) => !o)}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </button>
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-popover shadow-elegant overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  {filtered.length === 0 && !showCustom && (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No matches
                    </div>
                  )}
                  {filtered.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => select(c)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm hover:bg-primary-soft/60 transition-colors flex items-center justify-between",
                        value.community === c && "bg-primary-soft/40"
                      )}
                    >
                      <span>{c}</span>
                      {value.community === c && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                  {showCustom && (
                    <button
                      type="button"
                      onClick={() => select(trimmed)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-soft/60 transition-colors flex items-center gap-2 border-t border-border"
                    >
                      <Plus className="h-4 w-4 text-primary" />
                      <span>
                        Use "<span className="font-medium">{trimmed}</span>"
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/* ---------- Card 3 ---------- */

const EVENT_OPTIONS = [
  "Engagement",
  "Mehendi",
  "Haldi",
  "Sangeet",
  "Bachelor / Bachelorette",
  "Wedding Ceremony",
  "Reception",
  "Temple Visit",
  "Family Dinner",
  "Cocktail",
  "After Party",
  "Other",
];

const Card3 = ({ value, update }: StepProps) => {
  const events = value.events ?? [];
  const toggle = (name: string) => {
    const exists = events.find((e) => e.name === name);
    if (exists) update({ events: events.filter((e) => e.name !== name) });
    else update({ events: [...events, { name, dateType: "exact" }] });
  };
  const patchEvent = (name: string, patch: Partial<EventEntry>) => {
    update({
      events: events.map((e) => (e.name === name ? { ...e, ...patch } : e)),
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {EVENT_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            active={!!events.find((e) => e.name === opt)}
            onClick={() => toggle(opt)}
          >
            {opt}
          </Chip>
        ))}
      </div>
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-2"
          >
            {events.map((ev) => (
              <div
                key={ev.name}
                className="rounded-xl border border-border bg-card/60 p-4"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {ev.name}
                  </span>
                  <div className="flex gap-1.5">
                    {(["exact", "tentative", "flexible"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => patchEvent(ev.name, { dateType: t })}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors capitalize",
                          ev.dateType === t
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary-soft"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {ev.dateType === "exact" && (
                  <input
                    type="date"
                    value={ev.date ?? ""}
                    onChange={(e) => patchEvent(ev.name, { date: e.target.value })}
                    className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
                {ev.dateType === "tentative" && (
                  <input
                    type="month"
                    value={ev.date ?? ""}
                    onChange={(e) => patchEvent(ev.name, { date: e.target.value })}
                    className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pt-2">
        <FieldLabel>How flexible are your wedding dates overall?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {([
            { v: "fixed", l: "Fixed" },
            { v: "few-days", l: "Flexible by a few days" },
            { v: "few-weeks", l: "Flexible by a few weeks" },
            { v: "exploring", l: "Still exploring" },
          ] as const).map((o) => (
            <Chip
              key={o.v}
              active={value.dateFlexibility === o.v}
              onClick={() => update({ dateFlexibility: o.v })}
            >
              {o.l}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Card 4 ---------- */

const Card4 = ({ value, update }: StepProps) => (
  <div className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <FieldLabel>City</FieldLabel>
        <Input
          value={value.city ?? ""}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="Bengaluru"
        />
      </div>
      <div>
        <FieldLabel>State</FieldLabel>
        <Input
          value={value.state ?? ""}
          onChange={(e) => update({ state: e.target.value })}
          placeholder="Karnataka"
        />
      </div>
    </div>
    <div>
      <FieldLabel>Type</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {(["local", "destination"] as const).map((t) => (
          <Chip
            key={t}
            active={value.locationType === t}
            onClick={() => update({ locationType: t })}
          >
            {t === "local" ? "Local Wedding" : "Destination Wedding"}
          </Chip>
        ))}
      </div>
    </div>
    <AnimatePresence>
      {value.locationType === "destination" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FieldLabel>Destination City</FieldLabel>
          <Input
            value={value.destinationCity ?? ""}
            onChange={(e) => update({ destinationCity: e.target.value })}
            placeholder="Udaipur, Goa, Jaipur…"
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ---------- Card 5 ---------- */

const BOOKED_OPTIONS = [
  "Nothing Yet",
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Decoration",
  "Entertainment",
  "Accommodation",
  "Transportation",
  "Invitations",
  "Makeup",
  "Mehendi",
  "Priest",
  "Wedding Planner",
  "Other",
];

const Card5 = ({ value, update }: StepProps) => {
  const booked = value.booked ?? [];
  const toggle = (opt: string) => {
    if (opt === "Nothing Yet") {
      update({ booked: booked.includes(opt) ? [] : ["Nothing Yet"] });
      return;
    }
    const next = booked.includes(opt)
      ? booked.filter((b) => b !== opt)
      : [...booked.filter((b) => b !== "Nothing Yet"), opt];
    update({ booked: next });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {BOOKED_OPTIONS.map((opt) => (
        <Chip key={opt} active={booked.includes(opt)} onClick={() => toggle(opt)}>
          {opt}
        </Chip>
      ))}
    </div>
  );
};

/* ---------- Card 6 ---------- */

const STYLE_OPTIONS = [
  { label: "Traditional", emoji: "🪔" },
  { label: "Elegant", emoji: "🕊️" },
  { label: "Royal", emoji: "👑" },
  { label: "Luxury", emoji: "💎" },
  { label: "Minimal", emoji: "🤍" },
  { label: "Beach", emoji: "🌊" },
  { label: "Garden", emoji: "🌿" },
  { label: "Heritage", emoji: "🏛️" },
  { label: "Modern", emoji: "✨" },
  { label: "Floral", emoji: "🌸" },
  { label: "Open to Ideas", emoji: "💭" },
];

const Card6 = ({ value, update }: StepProps) => {
  const styles = value.styles ?? [];
  const toggle = (s: string) => {
    if (styles.includes(s)) update({ styles: styles.filter((x) => x !== s) });
    else if (styles.length < 3) update({ styles: [...styles, s] });
  };
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Choose up to 3.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STYLE_OPTIONS.map((s) => {
          const active = styles.includes(s.label);
          const disabled = !active && styles.length >= 3;
          return (
            <motion.button
              key={s.label}
              type="button"
              onClick={() => toggle(s.label)}
              whileTap={{ scale: 0.97 }}
              disabled={disabled}
              className={cn(
                "relative aspect-[4/3] rounded-2xl border p-4 flex flex-col items-center justify-center gap-2 transition-all duration-300",
                active
                  ? "border-primary bg-gradient-to-br from-primary-soft to-secondary-soft shadow-elegant"
                  : "border-border bg-card hover:border-primary/40",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
              {active && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                  <Check className="h-3.5 w-3.5" />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <div>
        <FieldLabel>Inspiration (optional)</FieldLabel>
        <Input
          value={value.inspirationLinks ?? ""}
          onChange={(e) => update({ inspirationLinks: e.target.value })}
          placeholder="Paste Pinterest / Instagram links…"
        />
      </div>
    </div>
  );
};

/* ---------- Card 7 ---------- */

const PRIORITY_OPTIONS = [
  "Photography",
  "Food",
  "Decor",
  "Guest Experience",
  "Traditional Rituals",
  "Entertainment",
  "Luxury",
  "Budget Friendly",
  "Smooth Planning",
  "Family Comfort",
  "Eco Friendly",
  "Memorable Experience",
];

const Card7 = ({ value, update }: StepProps) => {
  const picks = value.priorities ?? [];
  const toggle = (p: string) => {
    if (picks.includes(p)) update({ priorities: picks.filter((x) => x !== p) });
    else if (picks.length < 5) update({ priorities: [...picks, p] });
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tap to pick your top 5. The order shows what matters most.
      </p>
      <div className="flex flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((p) => {
          const idx = picks.indexOf(p);
          const active = idx >= 0;
          const disabled = !active && picks.length >= 5;
          return (
            <motion.button
              key={p}
              type="button"
              whileTap={{ scale: 0.96 }}
              disabled={disabled}
              onClick={() => toggle(p)}
              className={cn(
                "px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-card border-border text-foreground hover:border-primary/40",
                disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {active && (
                  <span className="h-5 w-5 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                )}
                {p}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Card 8 ---------- */

const Card8 = ({ value, update }: StepProps) => (
  <div>
    <FieldLabel>Anything else? (optional)</FieldLabel>
    <Textarea
      value={value.notes ?? ""}
      onChange={(e) => update({ notes: e.target.value })}
      placeholder="Family traditions, temple restrictions, surprises, accessibility needs, drone rules, pet-friendly requirements…"
      rows={6}
    />
  </div>
);

/* ---------- Registry ---------- */

export const STEPS: StepDef[] = [
  {
    id: "who",
    title: "💍 Who's getting married?",
    hint: "The essentials so we can address you the right way.",
    progressMsg: "✨ Let's get to know your celebration.",
    cta: "Looks Good →",
    render: Card1,
    isValid: (v) => !!(v.partner1?.trim() && v.partner2?.trim() && v.phone?.trim() && v.filledBy),
  },
  {
    id: "type",
    title: "🌸 What kind of wedding are you planning?",
    hint: "Rituals differ, and we want to get yours right.",
    progressMsg: "🌸 Your wedding is starting to take shape.",
    cta: "Tell Us More →",
    render: Card2,
    isValid: (v) => !!v.weddingType,
  },
  {
    id: "events",
    title: "✨ Which celebrations are you planning?",
    hint: "Pick everything you're hosting — big or small.",
    progressMsg: "💫 A wedding is many beautiful moments.",
    cta: "Beautiful →",
    render: Card3,
    isValid: (v) => (v.events?.length ?? 0) > 0,
  },
  {
    id: "location",
    title: "📍 Where will your wedding happen?",
    hint: "We'll shortlist vendors near your celebration.",
    progressMsg: "💍 We're building your Wedding Profile.",
    cta: "Onward →",
    render: Card4,
    isValid: (v) =>
      !!(v.city?.trim() && v.locationType) &&
      (v.locationType !== "destination" || !!v.destinationCity?.trim()),
  },
  {
    id: "booked",
    title: "🏛️ Have you already booked anything?",
    hint: "So we don't recommend what you already have.",
    progressMsg: "🌿 Halfway there — you're doing great.",
    cta: "Sounds Good →",
    render: Card5,
    isValid: (v) => (v.booked?.length ?? 0) > 0,
  },
  {
    id: "style",
    title: "🎨 How do you imagine your wedding?",
    hint: "Pick up to three moods that feel like you.",
    progressMsg: "🎨 Painting the picture of your day.",
    cta: "Love It →",
    render: Card6,
    isValid: (v) => (v.styles?.length ?? 0) > 0,
  },
  {
    id: "priorities",
    title: "❤️ What matters most to you?",
    hint: "Your top 5, in the order they matter.",
    progressMsg: "🎉 Almost done! Just a couple more details.",
    cta: "Almost There 🌸",
    render: Card7,
    isValid: (v) => (v.priorities?.length ?? 0) >= 3,
  },
  {
    id: "notes",
    title: "📝 Anything else you'd like us to know?",
    hint: "Optional — but the little things make it perfect.",
    progressMsg: "✨ One last touch before we celebrate.",
    cta: "Create My Wedding Profile ✨",
    render: Card8,
    isValid: () => true,
  },
];
