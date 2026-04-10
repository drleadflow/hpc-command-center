"use client";

import { useState, useEffect, useCallback } from "react";
import { store } from "./store";

export function useStore<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(fallback);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = store.read(key, fallback);
    setData(stored);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback((val: T | ((prev: T) => T)) => {
    setData((prev) => {
      const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
      store.write(key, next);
      return next;
    });
  }, [key]);

  return [mounted ? data : fallback, setValue];
}
