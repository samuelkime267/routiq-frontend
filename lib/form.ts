import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * Copies backend validation errors onto react-hook-form fields.
 *
 * Only fields listed in `fields` are applied, so an unexpected server key can
 * never create a phantom form state entry.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string> | undefined,
  fields?: readonly Path<T>[],
) {
  if (!fieldErrors) return;

  for (const [field, message] of Object.entries(fieldErrors)) {
    if (!message) continue;
    if (fields && !fields.includes(field as Path<T>)) continue;

    setError(field as Path<T>, { type: "server", message });
  }
}
