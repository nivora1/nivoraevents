import { useEffect, useRef } from "react";

/**
 * Calls `save` after `delay`ms when `value` changes. Skips the first run
 * (so we don't immediately overwrite freshly-loaded data).
 */
export function useDebouncedSave<T>(value: T, save: (v: T) => void | Promise<void>, delay = 800, ready = true) {
  const skip = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    const t = setTimeout(() => {
      void save(value);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);
}
