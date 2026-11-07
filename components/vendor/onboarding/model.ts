import type { ApiStore, StorePayload } from "@/types/api";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { OPERATING_DAYS, isRegisteredBusiness } from "./constants";
import { isHttpUrl } from "@/lib/validation";
import type { StoreFormState } from "./schema";

export type {
  StoreFormState,
  FormOperatingHour,
  FormDocument,
} from "./schema";

export interface StepProps {
  values: StoreFormState;
  register: UseFormRegister<StoreFormState>;
  errors: FieldErrors<StoreFormState>;
  setValue: UseFormSetValue<StoreFormState>;
}

const optional = (value: string) => value.trim() || undefined;

export function createEmptyForm(): StoreFormState {
  return {
    name: "",
    legalBusinessName: "",
    businessType: "individual",
    category: "",
    description: "",
    email: "",
    phoneNumber: "",
    cacRegistrationNumber: "",
    tin: "",
    scumlNumber: "",
    businessRegistrationDate: "",
    logo: "",
    coverImage: "",
    address: {
      street: "",
      city: "",
      lga: "",
      state: "",
      country: "Nigeria",
      landmark: "",
      postalCode: "",
    },
    longitude: "",
    latitude: "",
    operatingHours: OPERATING_DAYS.map((day, index) => ({
      day: day.value,
      isOpen: index < 5,
      openingTime: "08:00",
      closingTime: "18:00",
    })),
    pickupInstructions: "",
    representative: {
      fullName: "",
      dateOfBirth: "",
      nationality: "Nigerian",
      idType: "nin",
      idNumber: "",
      nin: "",
      bvn: "",
    },
    settlementAccount: {
      bankName: "",
      bankCode: "",
      accountName: "",
      accountNumber: "",
    },
    documents: [],
    compliance: {
      termsAccepted: false,
      dataProcessingConsent: false,
    },
  };
}

export function storeToForm(store: ApiStore): StoreFormState {
  const base = createEmptyForm();
  const [longitude, latitude] = store.location?.coordinates ?? [0, 0];

  return {
    ...base,
    name: store.name,
    legalBusinessName: store.legalBusinessName,
    businessType: store.businessType,
    category: store.category,
    description: store.description ?? "",
    email: store.email,
    phoneNumber: store.phoneNumber,
    cacRegistrationNumber: store.cacRegistrationNumber ?? "",
    tin: store.tin ?? "",
    scumlNumber: store.scumlNumber ?? "",
    businessRegistrationDate: store.businessRegistrationDate
      ? store.businessRegistrationDate.slice(0, 10)
      : "",
    logo: store.logo ?? "",
    coverImage: store.coverImage ?? "",
    address: {
      street: store.address.street,
      city: store.address.city,
      lga: store.address.lga,
      state: store.address.state,
      country: store.address.country || "Nigeria",
      landmark: store.address.landmark ?? "",
      postalCode: store.address.postalCode ?? "",
    },
    longitude: String(longitude),
    latitude: String(latitude),
    operatingHours: OPERATING_DAYS.map((day) => {
      const saved = store.operatingHours.find(
        (entry) => entry.day === day.value,
      );

      return {
        day: day.value,
        isOpen: saved?.isOpen ?? false,
        openingTime: saved?.openingTime ?? "08:00",
        closingTime: saved?.closingTime ?? "18:00",
      };
    }),
    pickupInstructions: store.pickupInstructions ?? "",
    representative: {
      fullName: store.representative.fullName,
      dateOfBirth: store.representative.dateOfBirth.slice(0, 10),
      nationality: store.representative.nationality || "Nigerian",
      idType: store.representative.idType,
      idNumber: store.representative.idNumber,
      nin: store.representative.nin ?? "",
      bvn: store.representative.bvn ?? "",
    },
    settlementAccount: {
      bankName: store.settlementAccount.bankName,
      bankCode: store.settlementAccount.bankCode,
      accountName: store.settlementAccount.accountName,
      accountNumber: store.settlementAccount.accountNumber,
    },
    documents: store.documents.map((document) => ({
      type: document.type,
      url: document.url,
      name: document.name ?? "",
    })),
    compliance: {
      termsAccepted: store.compliance.termsAccepted,
      dataProcessingConsent: store.compliance.dataProcessingConsent,
    },
  };
}

export function formToPayload(form: StoreFormState): StorePayload {
  const registered = isRegisteredBusiness(form.businessType);

  return {
    name: form.name.trim(),
    legalBusinessName: form.legalBusinessName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phoneNumber.trim(),
    description: optional(form.description),
    businessType: form.businessType,
    category: form.category.trim(),
    cacRegistrationNumber: registered
      ? optional(form.cacRegistrationNumber)
      : undefined,
    tin: registered ? optional(form.tin) : undefined,
    scumlNumber: optional(form.scumlNumber),
    businessRegistrationDate: optional(form.businessRegistrationDate),
    logo: optional(form.logo),
    coverImage: optional(form.coverImage),
    address: {
      street: form.address.street.trim(),
      city: form.address.city.trim(),
      lga: form.address.lga.trim(),
      state: form.address.state,
      country: "Nigeria",
      landmark: optional(form.address.landmark),
      postalCode: optional(form.address.postalCode),
    },
    location: {
      type: "Point",
      coordinates: [Number(form.longitude), Number(form.latitude)],
    },
    operatingHours: form.operatingHours.map((entry) => ({
      day: entry.day,
      isOpen: entry.isOpen,
      openingTime: entry.isOpen ? entry.openingTime : null,
      closingTime: entry.isOpen ? entry.closingTime : null,
    })),
    pickupInstructions: optional(form.pickupInstructions),
    representative: {
      fullName: form.representative.fullName.trim(),
      dateOfBirth: form.representative.dateOfBirth,
      nationality: form.representative.nationality.trim() || "Nigerian",
      idType: form.representative.idType,
      idNumber: form.representative.idNumber.trim(),
      nin: optional(form.representative.nin),
      bvn: optional(form.representative.bvn),
    },
    settlementAccount: {
      bankName: form.settlementAccount.bankName.trim(),
      bankCode: form.settlementAccount.bankCode.trim(),
      accountName: form.settlementAccount.accountName.trim(),
      accountNumber: form.settlementAccount.accountNumber.trim(),
    },
    documents: form.documents
      .filter((document) => isHttpUrl(document.url))
      .map((document) => ({
        type: document.type,
        url: document.url,
        name: optional(document.name),
      })),
    compliance: {
      termsAccepted: true,
      dataProcessingConsent: true,
    },
  };
}

export function stepForField(field: string) {
  if (
    field.startsWith("address") ||
    field.startsWith("location") ||
    field === "longitude" ||
    field === "latitude" ||
    field === "pickupInstructions"
  ) {
    return 1;
  }
  if (field.startsWith("operatingHours")) return 2;
  if (field.startsWith("representative")) return 3;
  if (field.startsWith("settlementAccount")) return 4;
  if (
    field.startsWith("documents") ||
    field === "logo" ||
    field === "coverImage"
  ) {
    return 5;
  }
  if (
    field === "termsAccepted" ||
    field === "dataProcessingConsent" ||
    field.startsWith("compliance")
  ) {
    return 6;
  }

  return 0;
}

/** Finds the dotted path of the first field carrying a validation message. */
export function firstErrorPath(
  errors: FieldErrors<StoreFormState>,
): string | null {
  function walk(value: unknown, prefix: string): string | null {
    if (!value || typeof value !== "object") return null;

    const record = value as Record<string, unknown>;

    if (typeof record.message === "string") {
      return prefix || null;
    }

    for (const [key, child] of Object.entries(record)) {
      if (key === "ref" || key === "types") continue;

      const path = prefix ? `${prefix}.${key}` : key;
      const found = walk(child, path);
      if (found) return found;
    }

    return null;
  }

  return walk(errors, "");
}
