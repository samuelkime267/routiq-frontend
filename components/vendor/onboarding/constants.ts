import type {
  BusinessType,
  IdType,
  OperatingDay,
  StoreDocumentType,
} from "@/types/api";

export const ONBOARDING_STEPS = [
  {
    id: "business",
    title: "Business",
    description: "Store identity and contact details",
  },
  {
    id: "location",
    title: "Location",
    description: "Registered address and map pin",
  },
  {
    id: "hours",
    title: "Hours",
    description: "When customers can shop",
  },
  {
    id: "representative",
    title: "Representative",
    description: "The person behind the business",
  },
  {
    id: "payout",
    title: "Payout",
    description: "Where settlements land",
  },
  {
    id: "documents",
    title: "Documents",
    description: "KYB files and store branding",
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm and submit",
  },
] as const;

export const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  hint: string;
}[] = [
  {
    value: "individual",
    label: "Individual",
    hint: "A person selling without a registered company.",
  },
  {
    value: "sole_proprietorship",
    label: "Sole proprietorship",
    hint: "A registered business name owned by one person.",
  },
  {
    value: "partnership",
    label: "Partnership",
    hint: "Two or more owners sharing the business.",
  },
  {
    value: "limited_company",
    label: "Limited company",
    hint: "A CAC-registered limited liability company.",
  },
  {
    value: "other",
    label: "Other",
    hint: "Another registered business structure.",
  },
];

export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export const OPERATING_DAYS: { value: OperatingDay; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: "nin", label: "National Identification Number (NIN)" },
  { value: "bvn", label: "Bank Verification Number (BVN)" },
  { value: "passport", label: "International passport" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "voters_card", label: "Voter's card" },
];

export const DOCUMENT_LABELS: Record<StoreDocumentType, string> = {
  cac_certificate: "CAC certificate",
  business_name_certificate: "Business name certificate",
  tin_certificate: "TIN certificate",
  utility_bill: "Utility bill / proof of address",
  government_id: "Government-issued ID",
  bank_statement: "Bank statement",
  other: "Other supporting document",
};

export const REQUIRED_DOCUMENTS: StoreDocumentType[] = [
  "government_id",
  "utility_bill",
];

export const OPTIONAL_DOCUMENTS: StoreDocumentType[] = [
  "cac_certificate",
  "business_name_certificate",
  "tin_certificate",
  "bank_statement",
  "other",
];

export function isRegisteredBusiness(businessType: BusinessType) {
  return businessType !== "individual";
}
