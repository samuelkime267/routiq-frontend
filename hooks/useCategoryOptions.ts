"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api";
import type { SelectOption } from "@/components/ui/FormField";

/**
 * Loads the fixed category list from the API. Vendors choose from these
 * categories instead of inventing new ones, so the marketplace taxonomy stays
 * consistent. A failed load returns an empty list rather than a free-text
 * fallback: the API rejects unknown categories anyway.
 */
export function useCategoryOptions(current?: string | null) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void marketplaceApi
      .categoryOptions()
      .then((result) => {
        if (cancelled) return;

        const list = result.categories.map((category) => ({
          value: category.name,
          label: category.name,
        }));

        // Keep an older listing's category selectable even if it was removed
        // from the canonical list, so editing does not silently lose it.
        if (current && !list.some((option) => option.value === current)) {
          list.unshift({ value: current, label: current });
        }

        setOptions(list);
      })
      .catch(() => {
        if (cancelled) return;

        setOptions(current ? [{ value: current, label: current }] : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [current]);

  return { options, loading };
}
