import { ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
  as?: "div" | "section" | "article" | "li" | "header";
};

/**
 * Wrap content to fade-up into view on scroll. Premium and minimal —
 * no bouncy easing, single-shot, respects prefers-reduced-motion.
 */
export const Reveal = ({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealProps) => {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};
