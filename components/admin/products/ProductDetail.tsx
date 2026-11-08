"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Timeline, { type TimelineItem } from "@/components/ui/Timeline";
import { useAdminSession } from "@/components/admin/AdminSession";
import ProductActionDialog from "@/components/admin/products/ProductActionDialog";
import { ProductThumbnail } from "@/components/admin/products/ProductImage";
import { useResource } from "@/hooks/useResource";
import { productAdminApi } from "@/lib/api";
import { formatAdminDate } from "@/lib/admin";
import { formatNaira, formatNumber } from "@/lib/format";
import {
  inventoryState,
  productPublicationLabel,
  productStatusLabel,
  productStore,
  productVendor,
  reviewActionPresentation,
  productReviewActorName,
} from "@/lib/products";
import type { ProductActionKind } from "@/lib/schemas/product";
import { storeStatusLabel } from "@/lib/vendors";
import type {
  AdminProductDetail as ProductDetailResult,
  ApiProductReview,
} from "@/types/api";

interface ProductDetailProps {
  productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const { permissions } = useAdminSession();
  const { data, loading, refreshing, error, reload } =
    useResource<ProductDetailResult>(productId, () =>
      productAdminApi.get(productId),
    );
  const [dialog, setDialog] = useState<ProductActionKind | null>(null);

  const canModerate = permissions.includes("products.moderate");

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Product detail"
          eyebrow="Catalogue"
          breadcrumbs={breadcrumbsForProduct()}
        />
        <ErrorState
          title="Could not load this product"
          description={error ?? "This product may no longer exist."}
          onRetry={reload}
          action={
            <Button variant="outline" size="sm" href="/products">
              Back to products
            </Button>
          }
        />
      </div>
    );
  }

  const { product, history } = data;
  const vendor = productVendor(product);
  const store = productStore(product);
  const inventory = inventoryState(product.stock);

  const actions: ProductActionKind[] = [];

  if (canModerate) {
    if (product.status === "pending") actions.push("approve", "reject");
    if (product.status === "approved") actions.push("suspend");
    if (product.status === "suspended") actions.push("restore");
  }

  const timeline: TimelineItem[] = history.map((review) => {
    const presentation = reviewActionPresentation(review.action);

    return {
      id: review._id,
      title: presentation.label,
      description: reviewDescription(review),
      time: `${formatAdminDate(review.createdAt)} · ${productReviewActorName(review)}`,
      icon: presentation.icon,
      tone: presentation.tone,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={product.name}
        eyebrow="Product listing"
        description={`${product.category} · ${product.sku}`}
        breadcrumbs={breadcrumbsForProduct(product.name)}
        actions={
          <>
            <Button variant="outline" size="sm" href="/products">
              Back to products
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Icon name="refresh" />}
              onClick={reload}
              loading={refreshing}
            >
              Refresh
            </Button>
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              status={product.status}
              label={productStatusLabel(product.status)}
            />
            <Badge
              tone={
                product.publicationStatus === "published" ? "green" : "neutral"
              }
            >
              {productPublicationLabel(product.publicationStatus)}
            </Badge>
            <Badge
              tone={
                inventory.tone === "green"
                  ? "green"
                  : inventory.tone === "amber"
                    ? "amber"
                    : inventory.tone === "red"
                      ? "red"
                      : "neutral"
              }
            >
              {inventory.label}
            </Badge>
            <Badge tone="neutral">
              Created {formatAdminDate(product.createdAt)}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {product.status === "rejected" && product.rejectionReason ? (
            <Callout
              title="Rejected — vendor was told"
              body={product.rejectionReason}
            />
          ) : null}

          {product.status === "suspended" && product.suspensionReason ? (
            <Callout
              title="Suspended — vendor was told"
              body={product.suspensionReason}
              meta={
                product.suspendedAt
                  ? `Suspended ${formatAdminDate(product.suspendedAt)}`
                  : undefined
              }
            />
          ) : null}

          <Card
            title={`Images (${product.images.length})`}
            description="Select an image to open a larger preview."
          >
            {product.images.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {product.images.map((image, index) => (
                  <ProductThumbnail
                    key={`${image}-${index}`}
                    src={image}
                    name={`${product.name} image ${index + 1}`}
                    variant="tile"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
                <Icon
                  name="package"
                  className="mx-auto size-6 text-muted"
                />
                <p className="mt-2 text-[12px] text-muted">
                  No product images were supplied.
                </p>
              </div>
            )}
          </Card>

          <Card
            title="Listing details"
            description="Catalogue information exactly as the vendor submitted it."
          >
            <dl>
              <InfoRow label="Product name" value={product.name} />
              <InfoRow label="Reference (SKU)" value={product.sku} />
              <InfoRow label="Slug" value={product.slug} />
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="Price" value={formatNaira(product.price)} />
              <InfoRow
                label="Compare-at price"
                value={
                  product.compareAtPrice
                    ? formatNaira(product.compareAtPrice)
                    : null
                }
              />
              <InfoRow
                label="Stock on hand"
                value={`${formatNumber(product.stock)} units`}
              />
              <InfoRow
                label="Created"
                value={formatAdminDate(product.createdAt)}
              />
              <InfoRow
                label="Last moderated"
                value={
                  product.reviewedAt ? formatAdminDate(product.reviewedAt) : null
                }
              />
            </dl>
            {product.description ? (
              <p className="mt-3 rounded-xl bg-well/50 px-3.5 py-3 text-[12px] leading-relaxed text-ink">
                {product.description}
              </p>
            ) : null}
          </Card>

          <Card
            title="Moderation history"
            description="Every administrative decision recorded for this listing."
          >
            <Timeline
              items={timeline}
              emptyLabel="No moderation decisions have been recorded yet."
            />
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Decision</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {decisionHint(product.status)}
            </p>

            <div className="mt-3 space-y-2">
              {actions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  fullWidth
                  variant={action === "reject" || action === "suspend" ? "danger" : "primary"}
                  onClick={() => setDialog(action)}
                >
                  {actionButtonLabel(action)}
                </Button>
              ))}

              {actions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3.5 py-3 text-[11px] leading-relaxed text-muted">
                  {canModerate
                    ? "No moderation action applies to this status right now."
                    : "Your account does not include product moderation access."}
                </p>
              ) : null}
            </div>

            <p className="mt-3 rounded-xl bg-well/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Approval does not publish a product. Publication and stock are
              tracked separately from moderation.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Inventory</h2>
            <div className="mt-3 grid gap-2">
              <MetricCard
                label="Price"
                value={formatNaira(product.price)}
                icon="wallet"
              />
              <MetricCard
                label="In stock"
                value={`${formatNumber(product.stock)} units`}
                hint={inventory.label}
                icon="package"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Vendor</h2>
            {vendor ? (
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-full bg-pri text-[12px] font-semibold text-white">
                    {initials(vendor.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">
                      {vendor.name}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {vendor.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  href={`/vendors/${vendor._id}`}
                >
                  Open vendor profile
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted">
                Vendor account not loaded.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-4">
            <h2 className="text-[13px] font-semibold text-ink">Store</h2>
            {store ? (
              <div className="mt-2.5 space-y-2">
                <div>
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {store.name}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {store.category ?? "Catalogue store"} · {storeStatusLabel(store.status)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  href={`/stores/${store._id}`}
                >
                  Open store review
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-muted">
                Store record not loaded.
              </p>
            )}
          </section>
        </aside>
      </div>

      {dialog ? (
        <ProductActionDialog
          key={dialog}
          productId={product._id}
          productName={product.name}
          action={dialog}
          onClose={() => setDialog(null)}
          onCompleted={reload}
        />
      ) : null}
    </div>
  );
}

function breadcrumbsForProduct(productName?: string) {
  return [
    { label: "Admin console", href: "/" },
    { label: "Catalogue" },
    { label: "Products", href: "/products" },
    { label: productName ?? "Product" },
  ];
}

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  const hasValue =
    value !== undefined && value !== null && value !== "" && value !== "—";

  return (
    <div className="flex flex-col gap-0.5 border-b border-line/70 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="text-[12px] break-words text-ink sm:text-right">
        {hasValue ? value : "—"}
      </dd>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-[13px] font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Callout({
  title,
  body,
  meta,
}: {
  title: string;
  body: string;
  meta?: string;
}) {
  return (
    <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
          <Icon name="alert-circle" className="size-4" />
        </span>
        <div>
          <p className="text-[12px] font-semibold text-danger">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink">{body}</p>
          {meta ? <p className="mt-1 text-[11px] text-muted">{meta}</p> : null}
        </div>
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading product detail">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-well" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-well" />
          <div className="h-56 animate-pulse rounded-2xl bg-well" />
          <div className="h-40 animate-pulse rounded-2xl bg-well" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-well" />
      </div>
    </div>
  );
}

function decisionHint(status: string) {
  switch (status) {
    case "pending":
      return "This listing is waiting for catalogue review.";
    case "approved":
      return "The listing passed moderation. Suspend it if policy problems appear.";
    case "suspended":
      return "The listing cannot be sold until it is restored.";
    case "rejected":
      return "The vendor can correct the listing and submit it for review again.";
    case "draft":
      return "The vendor has not submitted this listing for moderation yet.";
    case "archived":
      return "This listing has been archived and is no longer part of the active catalogue.";
    default:
      return "No administrative decisions are available for this status.";
  }
}

function actionButtonLabel(action: ProductActionKind) {
  switch (action) {
    case "approve":
      return "Approve product";
    case "reject":
      return "Reject product";
    case "suspend":
      return "Suspend product";
    case "restore":
      return "Restore product";
  }
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "V"
  );
}

function reviewDescription(review: ApiProductReview) {
  if (review.reason) return review.reason;
  if (review.message) return review.message;

  if (review.fromStatus && review.toStatus) {
    return `Status changed from ${productStatusLabel(review.fromStatus)} to ${productStatusLabel(review.toStatus)}.`;
  }

  return undefined;
}
