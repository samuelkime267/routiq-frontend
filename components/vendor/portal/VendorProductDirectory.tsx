"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import DropdownMenu, { type DropdownItem } from "@/components/ui/DropdownMenu";
import {
  FilterBar,
  FilterSelect,
  type FilterOption,
} from "@/components/ui/FilterBar";
import { Input } from "@/components/ui/Form";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import Tabs from "@/components/ui/Tabs";
import { ProductThumbnail } from "@/components/admin/products/ProductImage";
import { useToast } from "@/components/ui/Toast";
import { useServerTable } from "@/hooks/useServerTable";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { formatNaira, formatNumber } from "@/lib/format";
import type { SortDirection } from "@/lib/pagination";
import {
  PRODUCT_STATUS_OPTIONS,
  inventoryState,
  productImage,
  productPublicationLabel,
  productStatusLabel,
} from "@/lib/products";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import {
  INVENTORY_FILTERS,
  productCanBeDeleted,
  productIsEditable,
  productNeedsReview,
} from "@/lib/vendorPortal";
import type {
  ApiProduct,
  ProductPublicationStatus,
  ProductStatus,
} from "@/types/api";

interface ProductSummaryState {
  status: Record<ProductStatus, number>;
  publication: Record<ProductPublicationStatus, number>;
  lowStock: number;
}

interface VendorProductDirectoryProps {
  mode?: "all" | "inventory";
  initialStatus?: string;
}

const sortOptions = [
  { value: "createdAt:desc", label: "Newest listings" },
  { value: "createdAt:asc", label: "Oldest listings" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "price:desc", label: "Highest price" },
  { value: "price:asc", label: "Lowest price" },
  { value: "stock:asc", label: "Lowest stock" },
  { value: "updatedAt:desc", label: "Recently updated" },
];

const publicationOptions: FilterOption[] = [
  { value: "", label: "All publication states" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

export default function VendorProductDirectory({
  mode = "all",
  initialStatus,
}: VendorProductDirectoryProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ProductSummaryState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stockProduct, setStockProduct] = useState<ApiProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null);
  const inventoryMode = mode === "inventory";

  const table = useServerTable<ApiProduct>({
    loader: async (query) => {
      const result = await vendorPortalApi.products({
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: inventoryMode ? undefined : query.filters.status,
        publicationStatus: query.filters.publicationStatus,
        inventory: query.filters.inventory,
      });

      setSummary({
        status: result.summary,
        publication: result.publicationSummary,
        lowStock: result.lowStock,
      });

      return { rows: result.products, pagination: result.pagination };
    },
    initialFilters:
      !inventoryMode && initialStatus ? { status: initialStatus } : {},
    initialSort: { key: "createdAt", direction: "desc" },
  });

  async function runAction(
    product: ApiProduct,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setBusyId(product._id);

    try {
      await action();
      toast({ title: message, tone: "success" });
      table.reload();
    } catch (error) {
      toast({
        title: "Action failed",
        description:
          error instanceof ApiError
            ? error.message
            : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  function actionsFor(product: ApiProduct): DropdownItem[] {
    const items: DropdownItem[] = [];

    if (productIsEditable(product.status)) {
      items.push({
        id: "edit",
        label: "Edit listing",
        icon: "sliders",
        href: `/products/${product._id}/edit`,
      });
    } else {
      items.push({
        id: "view",
        label: "View listing",
        icon: "eye",
        href: `/products/${product._id}/edit`,
      });
    }

    items.push({
      id: "stock",
      label: "Adjust stock",
      icon: "package",
      onSelect: () => setStockProduct(product),
    });

    if (productNeedsReview(product.status)) {
      items.push({
        id: "submit",
        label:
          product.status === "rejected" ? "Resubmit for review" : "Submit for review",
        icon: "upload",
        separatorBefore: true,
        onSelect: () =>
          void runAction(
            product,
            () => vendorPortalApi.submitProduct(product._id),
            "Listing submitted for moderation",
          ),
      });
    }

    if (product.status === "approved") {
      const published = product.publicationStatus === "published";

      items.push({
        id: "publication",
        label: published ? "Unpublish" : "Publish",
        icon: published ? "eye-off" : "eye",
        separatorBefore: true,
        onSelect: () =>
          void runAction(
            product,
            () => vendorPortalApi.setProductPublication(product._id, !published),
            published ? "Listing unpublished" : "Listing published",
          ),
      });
    }

    if (productIsEditable(product.status) || product.status === "archived") {
      items.push({
        id: "archive",
        label: "Archive listing",
        icon: "inbox",
        onSelect: () =>
          void runAction(
            product,
            () => vendorPortalApi.archiveProduct(product._id),
            "Listing archived",
          ),
      });
    }

    if (productCanBeDeleted(product.status)) {
      items.push({
        id: "delete",
        label: "Delete listing",
        icon: "trash",
        danger: true,
        separatorBefore: true,
        onSelect: () => setDeleteTarget(product),
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
      cell: (product) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <ProductThumbnail src={productImage(product)} name={product.name} />
          <div className="min-w-0">
            <Link
              href={`/products/${product._id}/edit`}
              className="block truncate text-[13px] font-semibold text-ink hover:text-pri"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {product.sku} · {product.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      sortable: true,
      cell: (product) => (
        <div className="text-right">
          <p className="text-[12px] font-medium text-ink">
            {formatNaira(product.price)}
          </p>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <p className="text-[10px] text-muted line-through">
              {formatNaira(product.compareAtPrice)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      align: "right",
      sortable: true,
      cell: (product) => {
        const inventory = inventoryState(product.stock);

        return (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[12px] font-medium text-ink">
              {formatNumber(product.stock)}
            </span>
            <Badge
              tone={inventory.tone === "green" ? "green" : inventory.tone}
              className="px-2 py-0.5 text-[10px]"
            >
              {inventory.label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Moderation",
      sortable: true,
      hideOnMobile: true,
      cell: (product) => (
        <StatusBadge
          status={product.status}
          label={productStatusLabel(product.status)}
        />
      ),
    },
    {
      id: "publicationStatus",
      header: "Visibility",
      hideOnMobile: true,
      cell: (product) => (
        <Badge
          tone={product.publicationStatus === "published" ? "green" : "neutral"}
          className="px-2.5 py-0.5 text-[10px]"
        >
          {productPublicationLabel(product.publicationStatus)}
        </Badge>
      ),
    },
  ];

  const totalStatuses = summary
    ? Object.values(summary.status).reduce((count, value) => count + value, 0)
    : table.meta.total;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title={inventoryMode ? "Inventory" : "Products"}
        description={
          inventoryMode
            ? "Every listing and its live stock level. Adjust stock without sending the listing back to moderation."
            : "Create, refine and publish your listings. Content changes after approval go back to moderation before they are visible again."
        }
        breadcrumbs={vendorBreadcrumbs(inventoryMode ? "/inventory" : "/products")}
        actions={
          <>
            {inventoryMode ? (
              <Button variant="outline" size="sm" href="/products">
                All products
              </Button>
            ) : (
              <Button variant="outline" size="sm" href="/inventory">
                Inventory view
              </Button>
            )}
            <Button
              href="/products/new"
              size="sm"
              icon={<Icon name="plus" />}
            >
              Add product
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={summary?.lowStock ? "amber" : "green"}>
              {summary?.lowStock ?? 0} low stock
            </Badge>
            <Badge tone="blue">
              {summary?.publication.published ?? 0} published
            </Badge>
            <Badge tone="amber">
              {summary?.status.pending ?? 0} in moderation
            </Badge>
            <Badge tone="red">
              {summary?.status.rejected ?? 0} rejected
            </Badge>
          </div>
        }
      />

      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={table.searchInput}
            onChange={table.setSearch}
            placeholder="Search by name, SKU or category"
            label="Search products"
            className="w-full lg:max-w-sm"
          />

          {inventoryMode ? (
            <Badge tone={summary?.lowStock ? "amber" : "neutral"}>
              {summary?.lowStock ?? 0} listing
              {(summary?.lowStock ?? 0) === 1 ? "" : "s"} need restocking
            </Badge>
          ) : (
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
                  count: summary?.status[option.value],
                })),
              ]}
            />
          )}
        </div>

        <div className="border-t border-line">
          <FilterBar
            onReset={table.resetFilters}
            activeCount={table.activeFilterCount}
          >
            <FilterSelect
              label="Stock level"
              value={table.filters.inventory ?? ""}
              onChange={(value) => table.setFilter("inventory", value)}
              options={INVENTORY_FILTERS}
            />
            <FilterSelect
              label="Visibility"
              value={table.filters.publicationStatus ?? ""}
              onChange={(value) => table.setFilter("publicationStatus", value)}
              options={publicationOptions}
            />
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
          </FilterBar>
        </div>
      </div>

      <DataTable
        caption="Your product catalogue, sorted and paginated by the server"
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
          <div className="flex items-center justify-end gap-1">
            {product.status === "approved" &&
            product.publicationStatus !== "published" ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden px-2.5 sm:inline-flex"
                loading={busyId === product._id}
                onClick={() =>
                  void runAction(
                    product,
                    () =>
                      vendorPortalApi.setProductPublication(product._id, true),
                    "Listing published",
                  )
                }
              >
                Publish
              </Button>
            ) : null}
            <DropdownMenu
              label={`Actions for ${product.name}`}
              align="right"
              widthClassName="w-56"
              triggerClassName="size-8 justify-center border-transparent bg-transparent p-0 hover:border-line"
              trigger={<Icon name="more-horizontal" className="size-4" />}
              items={actionsFor(product)}
            />
          </div>
        )}
        emptyTitle={
          table.search || table.activeFilterCount > 0
            ? "No listings match these filters"
            : inventoryMode
              ? "No stock records yet"
              : "No products yet"
        }
        emptyDescription={
          table.search || table.activeFilterCount > 0
            ? "Try a different search term or reset the filters."
            : inventoryMode
              ? "Stock appears here once you add your first listing."
              : "Add your first listing to start selling on Routiq."
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
          ) : (
            <Button href="/products/new" size="sm" icon={<Icon name="plus" />}>
              Add product
            </Button>
          )
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

      {stockProduct ? (
        <StockDialog
          key={stockProduct._id}
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSaved={() => {
            setStockProduct(null);
            table.reload();
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.name}?`}
          description="This removes the listing permanently. If the product has already been ordered it will be archived instead so order history stays intact."
          confirmLabel="Delete listing"
          onConfirm={async () => {
            await vendorPortalApi.deleteProduct(deleteTarget._id);
            toast({ title: "Listing removed", tone: "success" });
            setDeleteTarget(null);
            table.reload();
          }}
        >
          <p className="rounded-xl border border-line bg-soft/60 px-3.5 py-2.5 text-[12px] text-muted">
            {deleteTarget.sku} · {deleteTarget.category}
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function StockDialog({
  product,
  onClose,
  onSaved,
}: {
  product: ApiProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState(String(product.stock));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const next = Number(value);

    if (!Number.isInteger(next) || next < 0) {
      setError("Enter a whole number of units, zero or more.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await vendorPortalApi.updateStock(product._id, { stock: next });
      toast({ title: "Stock updated", tone: "success" });
      onSaved();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Stock could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Adjust stock"
      description={`${product.name} · ${product.sku}`}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={busy}
            onClick={() => void save()}
          >
            Save stock
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-ink">
          Units available
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-1"
          />
        </label>
        <p className="text-[11px] leading-relaxed text-muted">
          Current level: {formatNumber(product.stock)} units. Stock changes are
          saved immediately and do not affect your moderation status.
        </p>
        {error ? (
          <p role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
