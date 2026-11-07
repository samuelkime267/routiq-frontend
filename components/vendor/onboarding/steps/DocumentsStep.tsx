import Alert from "@/components/ui/Alert";
import FileUpload from "@/components/ui/FileUpload";
import {
  DOCUMENT_LABELS,
  OPTIONAL_DOCUMENTS,
  REQUIRED_DOCUMENTS,
  isRegisteredBusiness,
} from "../constants";
import type { StepProps } from "../model";
import type { StoreDocumentType } from "@/types/api";

export default function DocumentsStep({ values, errors, setValue }: StepProps) {
  const registered = isRegisteredBusiness(values.businessType);

  const requiredDocs: StoreDocumentType[] = registered
    ? [...REQUIRED_DOCUMENTS, "cac_certificate"]
    : REQUIRED_DOCUMENTS;

  const optionalDocs = OPTIONAL_DOCUMENTS.filter(
    (type) => !requiredDocs.includes(type),
  );

  function documentUrl(type: StoreDocumentType) {
    return values.documents.find((document) => document.type === type)?.url ?? "";
  }

  function saveDocument(
    type: StoreDocumentType,
    url: string,
    name: string,
  ) {
    const others = values.documents.filter(
      (document) => document.type !== type,
    );

    setValue(
      "documents",
      url ? [...others, { type, url, name }] : others,
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function renderUpload(type: StoreDocumentType) {
    return (
      <FileUpload
        key={type}
        id={`document-${type}`}
        label={DOCUMENT_LABELS[type]}
        description={
          type === "other"
            ? "Anything else that supports your application."
            : "Upload a clear photo or PDF. Up to 10MB."
        }
        purpose="store_document"
        documentType={type}
        value={documentUrl(type)}
        onUploaded={(file) => saveDocument(type, file.url, file.originalName)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {errors.documents?.message ? (
        <Alert tone="error">{errors.documents.message}</Alert>
      ) : null}

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Store branding
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <FileUpload
            id="store-logo"
            label="Store logo"
            description="Square image works best."
            purpose="store_logo"
            accept=".jpg,.jpeg,.png,.webp"
            value={values.logo}
            onUploaded={(file) =>
              setValue("logo", file.url, { shouldDirty: true })
            }
          />
          <FileUpload
            id="store-cover"
            label="Cover image"
            description="A wide banner for your storefront."
            purpose="store_cover"
            accept=".jpg,.jpeg,.png,.webp"
            value={values.coverImage}
            onUploaded={(file) =>
              setValue("coverImage", file.url, { shouldDirty: true })
            }
          />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Required documents
          </p>
          <span className="text-[11px] text-muted">
            {values.documents.length} uploaded
          </span>
        </div>
        <div className="mt-2 grid gap-3">
          {requiredDocs.map((type) => (
            <div key={type}>{renderUpload(type)}</div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Optional documents
        </p>
        <div className="mt-2 grid gap-3">
          {optionalDocs.map((type) => renderUpload(type))}
        </div>
      </section>
    </div>
  );
}
