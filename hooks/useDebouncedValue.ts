"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delay` milliseconds.
 * Used by server-side search so typing does not fire a request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
