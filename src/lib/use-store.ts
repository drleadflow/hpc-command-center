"use client";

import { useState, useEffect, useCallback } from "react";
import { store } from "./store";

// React hook that syncs with localStorage and triggers re-renders
export function useStore<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(fallback);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = store.read(key as Parameters<typeof store.read>[0], fallback);
    setData(stored);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback((val: T | ((prev: T) => T)) => {
    setData((prev) => {
      const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
      store.write(key as Parameters<typeof store.write>[0], next);
      return next;
    });
  }, [key]);

  // Return fallback until mounted to avoid hydration mismatch
  return [mounted ? data : fallback, setValue];
}
