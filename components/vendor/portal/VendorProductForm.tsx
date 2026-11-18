"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Icon } from "@/components/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FileUpload from "@/components/ui/FileUpload";
import { Field } from "@/components/ui/Form";
import {
  TextareaField,
  TextField,
} from "@/components/ui/FormField";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useVendorSession } from "@/components/vendor/portal/VendorSession";
import { ApiError, vendorPortalApi } from "@/lib/api";
import { applyApiFieldErrors } from "@/lib/form";
import { formatNaira } from "@/lib/format";
import { productStatusLabel } from "@/lib/products";
import {
  vendorProductFormSchema,
  type VendorProductFormValues,
} from "@/lib/schemas/vendorProduct";
import { vendorBreadcrumbs } from "@/lib/vendorNavigation";
import { productNeedsReview } from "@/lib/vendorPortal";
import type { ApiProduct, UploadedFile } from "@/types/api";

interface VendorProductFormProps {
  product?: ApiProduct;
}

const MAX_IMAGES = 8;

export default function VendorProductForm({ product }: VendorProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { access } = useVendorSession();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const readOnly =
    product?.status === "suspended" || product?.status === "archived";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorProductFormValues>({
    resolver: zodResolver(vendorProductFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      compareAtPrice: product?.compareAtPrice ?? undefined,
      stock: product?.stock ?? 0,
      sku: product?.sku ?? "",
    },
  });

  function addImageUrl() {
    const value = imageUrl.trim();

    if (!value) return;

    if (!/^https?:\/\/.+/i.test(value)) {
      setFormError("Image URLs must start with http:// or https://");
      return;
    }

    if (images.length >= MAX_IMAGES) {
      setFormError(`Add at most ${MAX_IMAGES} images.`);
      return;
    }

    setImages((current) => [...current, value]);
    setImageUrl("");
    setFormError(null);
  }

  function handleUploaded(file: UploadedFile) {
    setImages((current) =>
      current.length >= MAX_IMAGES ? current : [...current, file.url],
    );
  }

  function removeImage(url: string) {
    setImages((current) => current.filter((item) => item !== url));
  }

  async function save(
    values: VendorProductFormValues,
    submitForReview: boolean,
  ) {
    setFormError(null);

    const payload = {
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim() || undefined,
      price: values.price,
      compareAtPrice: values.compareAtPrice,
      stock: values.stock,
      sku: values.sku.trim() || undefined,
      images,
    };

    try {
      let productId = product?._id;
      let status = product?.status;

      if (productId) {
        const result = await vendorPortalApi.updateProduct(productId, payload);
        status = result.product.status;
      } else {
        const result = await vendorPortalApi.createProduct(payload);
        productId = result.product._id;
        status = result.product.status;
      }

      if (submitForReview && productId) {
        const result = await vendorPortalApi.submitProduct(productId);
        status = result.product.status;
      }

      toast({
        tone: "success",
        title: submitForReview
          ? "Listing submitted for moderation"
          : product
            ? "Listing updated"
            : "Listing created",
        description: submitForReview
          ? "We will review the details before it can be published."
          : status === "pending"
            ? "Content changes sent this listing back to moderation."
            : "Your listing is saved.",
      });

      router.push("/products");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        applyApiFieldErrors(setError, error.fieldErrors, [
          "name",
          "category",
          "description",
          "price",
          "compareAtPrice",
          "stock",
          "sku",
        ]);
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "The listing could not be saved.",
        );
      }
    }
  }

  const onSubmit = handleSubmit((values) => save(values, false));
  const onSubmitForReview = handleSubmit((values) => save(values, true));
  const canSubmitForReview =
    !product || productNeedsReview(product.status);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catalogue"
        title={product ? "Edit listing" : "New listing"}
        description={
          product
            ? "Update the content shoppers see. Price and stock changes apply immediately; name, category, description or image changes send an approved listing back to moderation."
            : "Add a product to your store. New listings start as drafts and can be submitted for moderation when you are ready."
        }
        breadcrumbs={vendorBreadcrumbs(
          "/products",
          product
            ? [{ label: "Edit listing" }]
            : [{ label: "New listing" }],
        )}
        actions={
          <Button
            variant="outline"
            size="sm"
            href="/products"
            icon={<Icon name="arrow-left" />}
          >
            Back to products
          </Button>
        }
        meta={
          product ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge
                status={product.status}
                label={productStatusLabel(product.status)}
              />
              <Badge
                tone={
                  product.publicationStatus === "published"
                    ? "green"
                    : "neutral"
                }
              >
                {product.publicationStatus === "published"
                  ? "Published"
                  : "Unpublished"}
              </Badge>
              <Badge tone="neutral">{formatNaira(product.price)}</Badge>
            </div>
          ) : undefined
        }
      />

      {!access.canSell ? (
        <Alert tone="error" title="Your store cannot sell yet">
          {access.restriction ??
            "Your store must be approved before listings can be published."}
        </Alert>
      ) : null}

      {readOnly ? (
        <Alert tone="error" title="This listing is read-only">
          {product?.status === "suspended"
            ? product?.suspensionReason ??
              "A suspended listing cannot be edited. Contact support if you believe this was a mistake."
            : "An archived listing cannot be edited. Create a new listing instead."}
        </Alert>
      ) : null}

      {product?.status === "rejected" && product.rejectionReason ? (
        <Alert tone="error" title="Moderation feedback">
          {product.rejectionReason} Update the listing and resubmit it for
          review.
        </Alert>
      ) : null}

      {product?.status === "pending" ? (
        <Alert tone="info" title="Waiting for moderation">
          This listing is in the review queue. Editing it keeps it in moderation
          until an administrator approves the changes.
        </Alert>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"
        aria-label={product ? "Edit product" : "Create product"}
      >
        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Product details
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              Clear names and honest descriptions sell better and pass review
              faster.
            </p>
          </div>

          <TextField
            label="Product name"
            placeholder="e.g. Handwoven Aso Oke shoulder bag"
            register={register("name")}
            error={errors.name?.message}
            disabled={readOnly}
          />

          <TextField
            label="Category"
            placeholder="e.g. Bags & accessories"
            hint="Use the same category wording you used for similar products so shoppers can find them together."
            register={register("category")}
            error={errors.category?.message}
            disabled={readOnly}
          />

          <TextareaField
            label="Description"
            placeholder="What is it, what is it made of, and what should the buyer know?"
            rows={5}
            register={register("description")}
            error={errors.description?.message}
            disabled={readOnly}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Price (₦)"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              register={register("price", { valueAsNumber: true })}
              error={errors.price?.message}
              disabled={readOnly}
            />
            <TextField
              label="Compare-at price (₦)"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              optional
              hint="Shown struck through when higher than the price."
              register={register("compareAtPrice", {
                setValueAs: (value) =>
                  value === "" || value === null ? undefined : Number(value),
              })}
              error={errors.compareAtPrice?.message}
              disabled={readOnly}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              register={register("stock", { valueAsNumber: true })}
              error={errors.stock?.message}
              disabled={readOnly}
            />
            <TextField
              label="SKU"
              optional
              placeholder="Auto-generated when left blank"
              register={register("sku")}
              error={errors.sku?.message}
              disabled={readOnly}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <div>
            <h2 className="text-[13px] font-semibold tracking-tight text-ink">
              Images
            </h2>
            <p className="mt-1 text-[11px] text-muted">
              Add up to {MAX_IMAGES} images. The first image is the catalogue
              thumbnail.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-well"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                {index === 0 ? (
                  <span className="absolute top-1 left-1 rounded-full bg-pri px-1.5 py-0.5 text-[9px] font-semibold text-lime">
                    Cover
                  </span>
                ) : null}
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-ink/70 text-white transition hover:bg-danger"
                  >
                    <Icon name="x" className="size-3" />
                  </button>
                ) : null}
              </div>
            ))}

            {!readOnly && images.length < MAX_IMAGES ? (
              <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-line bg-soft/40 text-muted">
                <Icon name="image" className="size-5" />
              </div>
            ) : null}
          </div>

          {!readOnly ? (
            <>
              <FileUpload
                id="product-image"
                label="Upload an image"
                description="JPEG, PNG or WebP · up to 10MB"
                purpose="product_image"
                accept=".jpg,.jpeg,.png,.webp"
                onUploaded={handleUploaded}
              />

              <Field label="Or paste an image URL" htmlFor="product-image-url">
                <div className="flex gap-2">
                  <input
                    id="product-image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://…"
                    className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink transition focus:border-pri focus:ring-4 focus:ring-pri/10 focus:outline-none"
                  />
                  <Button variant="outline" size="sm" onClick={addImageUrl}>
                    Add
                  </Button>
                </div>
              </Field>
            </>
          ) : null}

          <div className="rounded-xl border border-line bg-soft/50 px-3.5 py-3">
            <p className="text-[11px] leading-relaxed text-muted">
              {product
                ? "Changing images on an approved listing sends it back to moderation before it can be published again."
                : "Listings without an image still work, but shoppers rarely buy them."}
            </p>
          </div>
        </section>

        <div className="lg:col-span-2">
          {formError ? (
            <Alert tone="error" className="mb-3">
              {formError}
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted">
              {product
                ? "Saved changes are reflected in your catalogue immediately."
                : "New listings are saved as drafts until you submit them."}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                href="/products"
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {canSubmitForReview && !readOnly ? (
                <Button
                  variant="lime"
                  size="sm"
                  loading={isSubmitting}
                  onClick={() => void onSubmitForReview()}
                >
                  Save &amp; submit for review
                </Button>
              ) : null}

              <Button
                type="submit"
                size="sm"
                loading={isSubmitting}
                disabled={readOnly}
              >
                {product ? "Save changes" : "Create listing"}
              </Button>
            </div>
          </div>

          {product ? (
            <p className="mt-2 text-[10px] text-muted">
              Need to change legal store details?{" "}
              <Link href="/settings" className="font-semibold text-pri underline">
                Open settings
              </Link>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
