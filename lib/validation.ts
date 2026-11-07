export const PASSWORD_RULES = [
  "At least 6 characters",
  "One uppercase and one lowercase letter",
  "One number and one special character",
];

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function passwordProblems(value: string) {
  const problems: string[] = [];

  if (value.length < 6) problems.push("Use at least 6 characters.");
  if (!/[a-z]/.test(value)) problems.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(value)) problems.push("Add an uppercase letter.");
  if (!/[0-9]/.test(value)) problems.push("Add a number.");
  if (!/[^A-Za-z0-9]/.test(value)) problems.push("Add a special character.");

  return problems;
}

export function isNigerianPhone(value: string) {
  return /^(?:\+234|0)[789][01]\d{8}$/.test(value);
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

export function ageOnDate(dateOfBirth: string, today = new Date()) {
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const month = today.getUTCMonth() - date.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < date.getUTCDate())) {
    age -= 1;
  }

  return age;
}
