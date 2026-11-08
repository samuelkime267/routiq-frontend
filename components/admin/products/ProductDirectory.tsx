"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import { FilterBar, FilterSelect } from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Form";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { useAdminSession } from "@/components/admin/AdminSession";
import ProductActionDialog from "@/components/admin/products/ProductActionDialog";
import { ProductThumbnail } from "@/components/admin/products/ProductImage";
import { useResource } from "@/hooks/useResource";
import { useServerTable } from "@/hooks/useServerTable";
import { productAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { breadcrumbsFor } from "@/lib/adminNavigation";
import { formatNaira, formatNumber } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import {
  PRODUCT_STATUS_OPTIONS,
  inventoryState,
  productImage,
  productPublicationLabel,
  productStatusLabel,
  productStore,
  productVendor,
} from "@/lib/products";
import type { ProductActionKind } from "@/lib/schemas/product";
import type {
  AdminProductPublicationSummary,
  AdminProductSummary,
  ApiProduct,
  ProductFilterOptions,
} from "@/types/api";

interface ProductDirectoryProps {
  /** `pending` renders the moderation queue instead of the full catalogue. */
  mode?: "all" | "pending";
  /** Pre-selected moderation status, e.g. `/products?status=pending`. */
  initialStatus?: string;
}

interface ActiveDialog {
  product: ApiProduct;
  action: ProductActionKind;
}

const sortOptions = [
  { value: "createdAt:desc", label: "Newest listings" },
  { value: "createdAt:asc", label: "Oldest listings" },
  { value: "name:asc", label: "Product name A–Z" },
  { value: "name:desc", label: "Product name Z–A" },
  { value: "price:desc", label: "Highest price" },
  { value: "price:asc", label: "Lowest price" },
  { value: "stock:asc", label: "Lowest stock" },
  { value: "reviewedAt:desc", label: "Recently moderated" },
];

const publicationOptions = [
  { value: "", label: "All publication states" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

export default function ProductDirectory({
  mode = "all",
  initialStatus,
}: ProductDirectoryProps) {
  const { permissions } = useAdminSession();
  const [summary, setSummary] = useState<AdminProductSummary | null>(null);
  const [publicationSummary, setPublicationSummary] =
    useState<AdminProductPublicationSummary | null>(null);
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);

  const { data: filterOptions } =
    useResource<ProductFilterOptions>("admin-product-filters", () =>
      productAdminApi.filters(),
    );

  const canModerate = permissions.includes("products.moderate");
  const pendingMode = mode === "pending";

  const table = useServerTable<ApiProduct>({
    loader: async (query) => {
      const params = {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: pendingMode ? "pending" : query.filters.status,
        publicationStatus: pendingMode
          ? undefined
          : query.filters.publicationStatus,
        category: query.filters.category,
        vendor: query.filters.vendor,
        store: query.filters.store,
        minPrice: query.filters.minPrice
          ? Number(query.filters.minPrice)
          : undefined,
        maxPrice: query.filters.maxPrice
          ? Number(query.filters.maxPrice)
          : undefined,
        createdFrom: query.filters.createdFrom,
        createdTo: query.filters.createdTo,
      };

      if (pendingMode) {
        const result = await productAdminApi.pending(params);

        setSummary(result.summary);

        return { rows: result.products, pagination: result.pagination };
      }

      const result = await productAdminApi.list(params);

      setSummary(result.summary);
      setPublicationSummary(result.publicationSummary);

      return { rows: result.products, pagination: result.pagination };
    },
    initialFilters:
      !pendingMode && initialStatus ? { status: initialStatus } : {},
    initialSort: { key: "createdAt", direction: "desc" },
  });

  function actionsFor(product: ApiProduct): DropdownItem[] {
    const items: DropdownItem[] = [
      {
        id: "review",
        label: "Open product",
        icon: "eye",
        href: `/products/${product._id}`,
      },
    ];

    if (!canModerate) return items;

    if (product.status === "pending") {
      items.push(
        {
          id: "approve",
          label: "Approve product",
          icon: "check-circle",
          separatorBefore: true,
          onSelect: () => setDialog({ product, action: "approve" }),
        },
        {
          id: "reject",
          label: "Reject product",
          icon: "x",
          danger: true,
          onSelect: () => setDialog({ product, action: "reject" }),
        },
      );
    }

    if (product.status === "approved") {
      items.push({
        id: "suspend",
        label: "Suspend product",
        icon: "lock",
        danger: true,
        separatorBefore: true,
        onSelect: () => setDialog({ product, action: "suspend" }),
      });
    }

    if (product.status === "suspended") {
      items.push({
        id: "restore",
        label: "Restore product",
        icon: "refresh",
        separatorBefore: true,
        onSelect: () => setDialog({ product, action: "restore" }),
      });
    }

    return items;
  }

  const columns: DataTableColumn<ApiProduct>[] = [
    {
      id: "product",
      header: "Product",
      primary: true,
      sortable: true,
      sortKey: "name",
      cell: (product) => {
        const vendor = productVendor(product);
        const store = productStore(product);

        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <ProductThumbnail
              src={productImage(product)}
              name={product.name}
            />
            <div className="min-w-0">
              <Link
                href={`/products/${product._id}`}
                className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 truncate text-[11px] text-muted">
                {product.sku}
                {vendor ? ` · ${vendor.name}` : ""}
                {store ? ` · ${store.name}` : ""}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "seller",
      header: "Vendor / store",
      hideOnMobile: true,
      cell: (product) => {
        const vendor = productVendor(product);
        const store = productStore(product);

        return (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">
              {vendor?.name ?? "—"}
            </p>
            <p className="truncate text-[11px] text-muted">
              {store?.name ?? "—"}
            </p>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-[12px] text-ink">{product.category || "—"}</span>
      ),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      sortable: true,
      cell: (product) => (
        <span className="text-[12px] font-medium text-ink">
          {formatNaira(product.price)}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      align: "right",
      sortable: true,
      hideOnMobile: true,
      cell: (product) => {
        const inventory = inventoryState(product.stock);

        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[12px] text-ink">
              {formatNumber(product.stock)}
            </span>
            <span className="text-[10px] font-medium text-muted">
              {inventory.label}
            </span>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Moderation",
      sortable: true,
      cell: (product) => (
        <StatusBadge
          status={product.status}
          label={productStatusLabel(product.status)}
        />
      ),
    },
    {
      id: "publicationStatus",
      header: "Publication",
      hideOnMobile: true,
      cell: (product) => (
        <Badge
          tone={product.publicationStatus === "published" ? "green" : "neutral"}
        >
          {productPublicationLabel(product.publicationStatus)}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      sortable: true,
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-[12px] text-muted">
          {formatAdminDate(product.createdAt)}
        </span>
      ),
    },
  ];

  const totalStatuses = summary
    ? Object.values(summary).reduce((count, value) => count + value, 0)
    : table.meta.total;

  return (
    <div className="space-y-5">
      <PageHeader
        title={pendingMode ? "Pending moderation" : "Products"}
        eyebrow="Catalogue"
        description={
          pendingMode
            ? "Work through listings waiting for catalogue review. Approval records the moderation decision; it does not publish the product."
            : "Browse the marketplace catalogue, monitor listing quality and moderate products. Moderation, publication and stock stay independent."
        }
        breadcrumbs={breadcrumbsFor("/products")}
        actions={
          <>
            {pendingMode ? (
              <Button variant="outline" size="sm" href="/products">
                Full directory
              </Button>
            ) : (
              <Button variant="outline" size="sm" href="/products/pending">
                Pending queue
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={table.reload}
              disabled={table.loading}
            >
              Refresh
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="amber">
              {summary?.pending ?? 0} awaiting moderation
            </Badge>
            <Badge tone="green">{summary?.approved ?? 0} approved</Badge>
            <Badge tone="red">{summary?.suspended ?? 0} suspended</Badge>
            {!pendingMode && publicationSummary ? (
              <Badge tone="blue">
                {publicationSummary.published} published
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={table.searchInput}
              onChange={table.setSearch}
              placeholder="Search by product, SKU, slug or category"
              label="Search products"
              className="w-full lg:max-w-sm"
            />

            {!pendingMode ? (
              <Tabs
                variant="pill"
                ariaLabel="Filter products by moderation status"
                value={table.filters.status ?? ""}
                onChange={(id) => table.setFilter("status", id)}
                items={[
                  { id: "", label: "All", count: totalStatuses },
                  ...PRODUCT_STATUS_OPTIONS.map((option) => ({
                    id: option.value,
                    label: option.label,
                    count: summary?.[option.value],
                  })),
                ]}
              />
            ) : (
              <Badge tone="amber">
                {summary?.pending ?? table.meta.total} listings in queue
              </Badge>
            )}
          </div>

          <div className="border-t border-line">
            <FilterBar
              onReset={table.resetFilters}
              activeCount={table.activeFilterCount}
            >
              <FilterSelect
                label="Category"
                value={table.filters.category ?? ""}
                onChange={(value) => table.setFilter("category", value)}
                options={[
                  { value: "", label: "All categories" },
                  ...(filterOptions?.categories ?? []).map((category) => ({
                    value: category,
                    label: category,
                  })),
                ]}
              />
              <FilterSelect
                label="Vendor"
                value={table.filters.vendor ?? ""}
                onChange={(value) => table.setFilter("vendor", value)}
                options={[
                  { value: "", label: "All vendors" },
                  ...(filterOptions?.vendors ?? []).map((vendor) => ({
                    value: vendor.value,
                    label: vendor.label,
                  })),
                ]}
              />
              <FilterSelect
                label="Store"
                value={table.filters.store ?? ""}
                onChange={(value) => table.setFilter("store", value)}
                options={[
                  { value: "", label: "All stores" },
                  ...(filterOptions?.stores ?? []).map((store) => ({
                    value: store.value,
                    label: store.label,
                  })),
                ]}
              />
              {!pendingMode ? (
                <FilterSelect
                  label="Publication"
                  value={table.filters.publicationStatus ?? ""}
                  onChange={(value) =>
                    table.setFilter("publicationStatus", value)
                  }
                  options={publicationOptions}
                />
              ) : null}
              <FilterSelect
                label="Sort by"
                value={
                  table.sort
                    ? `${table.sort.key}:${table.sort.direction}`
                    : "createdAt:desc"
                }
                onChange={(value) => {
                  const [key, direction] = value.split(":");
                  table.setSorting(key, direction as SortDirection);
                }}
                options={sortOptions}
              />

              <PriceFilter
                label="Min price (₦)"
                value={table.filters.minPrice ?? ""}
                onChange={(value) => table.setFilter("minPrice", value)}
              />
              <PriceFilter
                label="Max price (₦)"
                value={table.filters.maxPrice ?? ""}
                onChange={(value) => table.setFilter("maxPrice", value)}
              />

              <DateFilter
                label="Created from"
                value={table.filters.createdFrom ?? ""}
                onChange={(value) => table.setFilter("createdFrom", value)}
              />
              <DateFilter
                label="Created to"
                value={table.filters.createdTo ?? ""}
                onChange={(value) => table.setFilter("createdTo", value)}
              />
            </FilterBar>
          </div>
        </div>

        <DataTable
          caption="Product catalogue, sorted and paginated by the server"
          columns={columns}
          rows={table.rows}
          getRowId={(product) => product._id}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          sort={table.sort}
          onSortChange={table.changeSort}
          rowActions={(product) => (
            <DropdownMenu
              label={`Actions for ${product.name}`}
              align="right"
              widthClassName="w-56"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={<Icon name="more-horizontal" className="size-4" />}
              items={actionsFor(product)}
            />
          )}
          emptyTitle={
            table.search || table.activeFilterCount > 0
              ? "No products match these filters"
              : pendingMode
                ? "The moderation queue is clear"
                : "No products yet"
          }
          emptyDescription={
            table.search || table.activeFilterCount > 0
              ? "Try a different search term or clear the filters."
              : pendingMode
                ? "New vendor listings appear here as soon as they are submitted for review."
                : "Vendor listings appear here after they are created."
          }
          emptyAction={
            table.search || table.activeFilterCount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  table.resetFilters();
                  table.setSearch("");
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
          footer={
            <Pagination
              meta={table.meta}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="products"
              disabled={table.loading}
            />
          }
        />
      </div>

      {dialog ? (
        <ProductActionDialog
          key={`${dialog.action}:${dialog.product._id}`}
          productId={dialog.product._id}
          productName={dialog.product.name}
          action={dialog.action}
          onClose={() => setDialog(null)}
          onCompleted={table.reload}
        />
      ) : null}
    </div>
  );
}

function PriceFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full sm:w-36">
      <label className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="h-10 text-[12px] font-medium"
      />
    </div>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full sm:w-40">
      <label className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </label>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 text-[12px] font-medium"
      />
    </div>
  );
}
