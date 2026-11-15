import LegalDocument, {
  type LegalSection,
} from "@/components/marketplace/LegalDocument";

const sections: LegalSection[] = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    paragraphs: [
      "We collect the information you give us directly and a limited amount of technical information needed to run the marketplace. This includes account details, store information from vendors and messages sent to support.",
    ],
    bullets: [
      "Account details such as your name, email address and password when you register.",
      "Profile and shopping information such as saved wishlist items and your selected delivery location, stored on your own device.",
      "Vendor and store details submitted during onboarding, including business registration and settlement information.",
      "Messages, order references and attachments you send to support.",
      "Technical information such as your browser type and the pages you visit, used to keep the service secure and working.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How we use your information",
    paragraphs: [
      "We use information to provide and improve the marketplace, to review vendor applications, to respond to support requests and to keep accounts secure. We do not sell personal information.",
    ],
    bullets: [
      "To create and manage accounts and verify vendor stores.",
      "To display products, prices and store details accurately.",
      "To coordinate an order with the store and delivery partner once you have agreed it with support.",
      "To respond to questions, resolve issues and meet our legal and regulatory obligations.",
      "To detect, prevent and investigate fraud, abuse and security incidents.",
    ],
  },
  {
    id: "cookies-and-local-storage",
    title: "Cookies and local storage",
    paragraphs: [
      "We use cookies to keep you signed in securely. The marketplace also stores your cart, wishlist and selected location in your browser's local storage so they survive a page refresh.",
      "Local cart and wishlist data stays on the device you used. Clearing your browser storage removes it. You can block cookies in your browser, but signing in and keeping a session will no longer work.",
    ],
  },
  {
    id: "sharing",
    title: "When we share information",
    paragraphs: [
      "We share only what is needed to run the marketplace. For an order, the fulfilling store and the delivery partner receive the details required to prepare and deliver it.",
    ],
    bullets: [
      "With the store that fulfils your order, so it can prepare and hand over your items.",
      "With delivery partners, so they can reach you and complete the delivery.",
      "With service providers such as hosting, email delivery and image storage acting on our instructions.",
      "Where required by law, regulation or a valid request from a competent authority.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep information",
    paragraphs: [
      "We keep account and store records for as long as the account or store is active, and afterwards for the period needed to meet legal, tax and dispute-resolution obligations. Support messages are kept only as long as needed to resolve the issue and maintain a record of the outcome.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    paragraphs: [
      "Under the Nigeria Data Protection Act 2023 you have rights over your personal information. You can ask to access, correct or delete it, object to certain processing, or request a copy in a portable format.",
      "To exercise a right, email us from the address linked to your account. We may need to verify your identity before acting. You can also raise a concern with the Nigeria Data Protection Commission.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "Access tokens, password hashing and logged-in sessions are protected, and vendor onboarding data is restricted to authorised staff. No online service is completely secure, so use a strong unique password and tell us promptly if you suspect your account has been compromised.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "Routiq is intended for people aged 18 and over. We do not knowingly collect personal information from children. If you believe a child has created an account, contact us and we will remove it.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy as the marketplace changes. The date at the top of this page shows when it was last revised. If a change materially affects how we use your information, we will make that clear on the marketplace or by email.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Your information"
      title="Privacy policy"
      description="How Routiq collects, uses and protects personal information across the marketplace."
      updated="13 November 2026"
      sections={sections}
    />
  );
}
