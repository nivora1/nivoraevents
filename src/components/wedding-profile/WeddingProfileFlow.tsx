import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "./steps";
import type { WeddingProfile } from "@/lib/weddingProfile";

type Props = {
  initial: WeddingProfile;
  onComplete: (data: WeddingProfile) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

const WeddingProfileFlow = ({ initial, onComplete, onCancel, submitLabel }: Props) => {
  const [data, setData] = useState<WeddingProfile>(initial);
  const [idx, setIdx] = useState(0);
  const [btnState, setBtnState] = useState<"idle" | "saving" | "saved">("idle");
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);

  const step = STEPS[idx];
  const progress = ((idx + 1) / STEPS.length) * 100;
  const isLast = idx === STEPS.length - 1;
  const valid = step.isValid(data);

  const update = (patch: Partial<WeddingProfile>) =>
    setData((d) => ({ ...d, ...patch }));

  const advance = async () => {
    if (!valid || btnState !== "idle") return;
    setBtnState("saving");
    await new Promise((r) => setTimeout(r, 380));
    setBtnState("saved");
    await new Promise((r) => setTimeout(r, 260));
    if (isLast) {
      await onComplete(data);
      setDone(true);
      // Confetti
      const end = Date.now() + 900;
      const colors = ["#1E2A78", "#E6C27A", "#FAF9F6"];
      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    } else {
      setDirection(1);
      setIdx((i) => i + 1);
      setBtnState("idle");
    }
  };

  const goBack = () => {
    if (idx === 0) return;
    setDirection(-1);
    setIdx((i) => i - 1);
    setBtnState("idle");
  };

  const buttonLabel = useMemo(() => {
    if (btnState === "saving") return null;
    if (btnState === "saved") return null;
    if (isLast) return submitLabel ?? step.cta;
    return step.cta;
  }, [btnState, isLast, step.cta, submitLabel]);

  if (done) return <SuccessScreen />;

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold">
          Your Wedding Profile
        </span>
        <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground text-balance">
          Build Your Wedding Profile
        </h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">
          Tell us a little about your wedding so we can personalise every recommendation for you.
        </p>
      </div>

      {/* Progress */}
      <div className="mt-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-medium">Step {idx + 1}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-secondary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={step.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 text-center text-sm text-muted-foreground italic"
          >
            {step.progressMsg}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Card */}
      <div className="mt-8 max-w-2xl mx-auto relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction * -40, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-border bg-card shadow-elegant p-6 md:p-10"
          >
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              {step.title}
            </h2>
            {step.hint && (
              <p className="mt-1.5 text-sm text-muted-foreground">{step.hint}</p>
            )}
            <div className="mt-6">
              <StepRenderer step={step} value={data} update={update} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={idx === 0 ? onCancel : goBack}
            className={cn(
              "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
              !onCancel && idx === 0 && "invisible"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {idx === 0 ? "Cancel" : "Back"}
          </button>

          <motion.button
            type="button"
            onClick={advance}
            disabled={!valid || btnState !== "idle"}
            whileTap={{ scale: valid ? 0.97 : 1 }}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full px-6 md:px-8 py-3 text-sm font-medium min-w-[180px] transition-all duration-300",
              valid
                ? "bg-primary text-primary-foreground shadow-soft hover:shadow-elegant"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <AnimatePresence mode="wait">
              {btnState === "idle" && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {buttonLabel}
                </motion.span>
              )}
              {btnState === "saving" && (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                </motion.span>
              )}
              {btnState === "saved" && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Check className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const SuccessScreen = () => {
  // Placeholder — parent replaces the view after onComplete resolves.
  // Kept for the brief moment between confetti and route swap.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-elegant"
      >
        <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
      </motion.div>
      <h2 className="mt-6 text-3xl md:text-4xl font-serif text-foreground">
        ✨ Your Wedding Profile is Ready!
      </h2>
      <p className="mt-3 text-muted-foreground text-sm md:text-base max-w-md">
        We've got everything we need to personalise your planning journey.
      </p>
    </motion.div>
  );
};

export default WeddingProfileFlow;

/* Standalone completion screen with Start Planning CTA */
export const CompletionScreen = ({ onStart }: { onStart: () => void }) => {
  useEffect(() => {
    const end = Date.now() + 1000;
    const colors = ["#1E2A78", "#E6C27A", "#FAF9F6"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
        className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-elegant"
      >
        <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
      </motion.div>
      <h2 className="mt-8 text-3xl md:text-5xl font-serif text-foreground text-balance">
        ✨ Your Wedding Profile is Ready!
      </h2>
      <p className="mt-4 text-muted-foreground text-sm md:text-base max-w-md">
        We've got everything we need to personalise your planning journey.
      </p>
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="mt-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3.5 text-sm font-medium shadow-soft hover:shadow-elegant transition-all"
      >
        Start Planning →
      </motion.button>
    </motion.div>
  );
};
