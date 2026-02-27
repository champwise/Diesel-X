import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { equipment } from "./equipment";
import { customers } from "./customers";
import { users } from "./users";
import { serviceTemplates } from "./templates";

export const taskTypeEnum = pgEnum("task_type", [
  "breakdown",
  "defect",
  "planned_maintenance",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "created",
  "approved",
  "prepared",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "not_approved",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  type: taskTypeEnum("type").notNull(),
  status: taskStatusEnum("status").notNull().default("created"),
  description: text("description"),
  reportedByName: text("reported_by_name"),
  reportedByPhone: text("reported_by_phone"),
  equipmentReadingAtReport: integer("equipment_reading_at_report"),
  partsEta: timestamp("parts_eta", { withTimezone: true }),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  assignedMechanicId: uuid("assigned_mechanic_id").references(() => users.id, {
    onDelete: "set null",
  }),
  sourceTemplateId: uuid("source_template_id").references(
    () => serviceTemplates.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskParts = pgTable("task_parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  partNumber: text("part_number").notNull(),
  manufacturer: text("manufacturer"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskChecklistItems = pgTable("task_checklist_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  isServiceable: text("is_serviceable"), // "serviceable" | "not_serviceable" | null
  failureDescription: text("failure_description"),
  isCritical: text("is_critical"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskMedia = pgTable("task_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  checklistItemId: uuid("checklist_item_id").references(
    () => taskChecklistItems.id,
    { onDelete: "cascade" }
  ),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // "image" | "video"
  fileName: text("file_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fieldReports = pgTable("field_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" })
    .unique(),
  customerComplaint: text("customer_complaint"),
  failureCause: text("failure_cause"),
  resultantDamage: text("resultant_damage"),
  repairMethod: text("repair_method"),
  additionalWorkNeeded: text("additional_work_needed"),
  additionalParts: text("additional_parts"),
  mechanicName: text("mechanic_name"),
  timeLogged: text("time_logged"),
  travelDistance: text("travel_distance"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
