import Link from "next/link";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { categoryHref, categoryIcon, categoryTint } from "@/lib/marketplace";
import type { MarketplaceCategory } from "@/types/api";

export default function CategoryCard({
  category,
  className,
}: {
  category: MarketplaceCategory;
  className?: string;
}) {
  return (
    <Link
      href={categoryHref(category.key)}
      className={cn(
        "group flex h-full flex-col rounded-[18px] border border-line bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-pri/25 hover:bg-well/30 focus-visible:ring-4 focus-visible:ring-pri/20 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-2xl transition group-hover:scale-105 motion-reduce:transition-none sm:size-12",
          categoryTint(category.name),
        )}
      >
        <Icon name={categoryIcon(category.name)} className="size-5" />
      </span>

      <div className="mt-4 flex-1">
        <p className="text-[12.5px] leading-snug font-semibold tracking-tight text-ink group-hover:text-pri sm:text-[13px]">
          {category.name}
        </p>
        <p className="mt-1 text-[10.5px] text-muted">
          {category.productCount}{" "}
          {category.productCount === 1 ? "product" : "products"}
        </p>
      </div>

      <span className="mt-3 inline-flex items-center gap-1 text-[9.5px] font-semibold tracking-[0.14em] text-pri uppercase">
        Shop
        <Icon
          name="arrow-right"
          className="size-3 transition group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </span>
    </Link>
  );
}
