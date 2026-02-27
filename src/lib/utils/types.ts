import type { InferSelectModel } from "drizzle-orm";
import type {
  organizations,
  users,
  organizationMembers,
  customers,
  equipment,
  tasks,
  serviceTemplates,
  prestartTemplates,
  notifications,
  timeLogs,
  fieldReports,
} from "@/lib/db/schema";

// Inferred types from Drizzle schema
export type Organization = InferSelectModel<typeof organizations>;
export type User = InferSelectModel<typeof users>;
export type OrganizationMember = InferSelectModel<typeof organizationMembers>;
export type Customer = InferSelectModel<typeof customers>;
export type Equipment = InferSelectModel<typeof equipment>;
export type Task = InferSelectModel<typeof tasks>;
export type ServiceTemplate = InferSelectModel<typeof serviceTemplates>;
export type PrestartTemplate = InferSelectModel<typeof prestartTemplates>;
export type Notification = InferSelectModel<typeof notifications>;
export type TimeLog = InferSelectModel<typeof timeLogs>;
export type FieldReport = InferSelectModel<typeof fieldReports>;

// Equipment status helpers
export type OperatingStatus = "up" | "down";
export type TrackingUnit = "hours" | "kilometers";

export type UpcomingTaskStatus =
  | "accepted"
  | "scheduled"
  | "preparing"
  | "not_scheduled"
  | "awaiting_approval"
  | "no_upcoming";
