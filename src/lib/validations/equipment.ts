import { z } from "zod";

export const equipmentTypeOptions = [
  "excavator",
  "truck",
  "loader",
  "dozer",
  "grader",
  "roller",
  "crane",
  "other",
] as const;

export const equipmentStatusOptions = ["active", "inactive"] as const;
export const statusFilterOptions = ["all", ...equipmentStatusOptions] as const;
export const trackingUnitOptions = ["hours", "kilometers"] as const;

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().nonnegative().optional());

const requiredNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().nonnegative());

const currentYear = new Date().getFullYear();

export const equipmentFormSchema = z.object({
  unitName: z.string().min(1, "Unit number is required").max(120),
  make: z.string().max(120).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
  year: optionalNumber
    .refine((val) => val === undefined || (val >= 1900 && val <= currentYear + 1), {
      message: `Enter a year between 1900 and ${currentYear + 1}`,
    })
    .optional(),
  equipmentType: z.enum(equipmentTypeOptions),
  customerId: z.string().uuid("Select a customer"),
  trackingUnit: z.enum(trackingUnitOptions),
  currentReading: requiredNumber,
  nextServiceDue: optionalNumber,
  nextServiceType: z.string().max(120).optional().nullable(),
  serviceIntervalHours: optionalNumber,
  serviceIntervalKms: optionalNumber,
  taskCreationThreshold: optionalNumber,
  vinSerial: z.string().max(180).optional().nullable(),
  status: z.enum(equipmentStatusOptions),
  operatingStatus: z.enum(["up", "down"]),
  notes: z.string().max(2000).optional().nullable(),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export const equipmentFiltersSchema = z.object({
  search: z.string().max(120).optional(),
  status: z.enum(statusFilterOptions).default("active"),
  customerId: z.string().uuid().optional(),
  equipmentType: z.enum([...equipmentTypeOptions, "all"] as const).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

export type EquipmentListFilters = z.infer<typeof equipmentFiltersSchema>;
