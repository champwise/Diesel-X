import { z } from "zod";

const toTrimmedString = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

const optionalTextField = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().max(max).optional());

export const customerFormSchema = z.object({
  name: z.preprocess(
    toTrimmedString,
    z.string().min(1, "Name is required").max(160)
  ),
  email: optionalTextField(255).refine(
    (value) => !value || z.email().safeParse(value).success,
    "Enter a valid email address"
  ),
  phone: optionalTextField(50),
  address: optionalTextField(500),
  notes: optionalTextField(2000),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const customerFiltersSchema = z.object({
  search: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export type CustomerListFilters = z.infer<typeof customerFiltersSchema>;
