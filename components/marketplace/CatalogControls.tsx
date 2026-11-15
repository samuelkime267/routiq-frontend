"use client";

import { Icon } from "@/components/icons";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import SearchInput from "@/components/ui/SearchInput";
import {
  CATALOG_SORT_OPTIONS,
  type CatalogSort,
} from "@/lib/marketplace";
import { cn } from "@/lib/cn";
import type { MarketplaceCategory } from "@/types/api";

export interface CatalogFilterState {
  search: string;
  category: string;
  availability: "" | "in_stock" | "out_of_stock";
  sort: CatalogSort;
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_CATALOG_FILTERS: CatalogFilterState = {
  search: "",
  category: "",
  availability: "",
  sort: "featured",
  minPrice: "",
  maxPrice: "",
};

function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "mb-1 block text-[9px] font-semibold tracking-[0.14em] text-muted uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default function CatalogControls({
  value,
  onChange,
  categories,
  hideCategory = false,
}: {
  value: CatalogFilterState;
  onChange: (patch: Partial<CatalogFilterState>) => void;
  categories: MarketplaceCategory[];
  hideCategory?: boolean;
}) {
  const active =
    Boolean(value.search) ||
    Boolean(value.category) ||
    Boolean(value.availability) ||
    Boolean(value.minPrice) ||
    Boolean(value.maxPrice) ||
    value.sort !== "featured";

  return (
    <div className="rounded-[18px] border border-line bg-white p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1">
          <Label>Search products</Label>
          <SearchInput
            value={value.search}
            onChange={(search) => onChange({ search })}
            placeholder="Search by product, category or store"
            className="[&_input]:h-10"
          />
        </label>

        {hideCategory ? null : (
          <label className="lg:w-48">
            <Label>Category</Label>
            <Select
              value={value.category}
              onChange={(event) => onChange({ category: event.target.value })}
              className="h-10 rounded-xl text-[12px]"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.key} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>
        )}

        <label className="lg:w-40">
          <Label>Availability</Label>
          <Select
            value={value.availability}
            onChange={(event) =>
              onChange({
                availability: event.target
                  .value as CatalogFilterState["availability"],
              })
            }
            className="h-10 rounded-xl text-[12px]"
          >
            <option value="">Any availability</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </Select>
        </label>

        <label className="lg:w-44">
          <Label>Sort by</Label>
          <Select
            value={value.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as CatalogSort })
            }
            className="h-10 rounded-xl text-[12px]"
          >
            {CATALOG_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-2">
          <label className="w-28 sm:w-32">
            <Label>Min price</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={value.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
              placeholder="₦0"
              className="h-9 rounded-xl text-[12px]"
            />
          </label>
          <span className="pb-2.5 text-[10px] text-muted">to</span>
          <label className="w-28 sm:w-32">
            <Label>Max price</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={value.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
              placeholder="Any"
              className="h-9 rounded-xl text-[12px]"
            />
          </label>
        </div>

        {active ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(EMPTY_CATALOG_FILTERS)}
            icon={<Icon name="x" className="size-3.5" />}
          >
            Clear filters
          </Button>
        ) : (
          <span className="text-[10px] text-muted">Prices are in Naira.</span>
        )}
      </div>
    </div>
  );
}
