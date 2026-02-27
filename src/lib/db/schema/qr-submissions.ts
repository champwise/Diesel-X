import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { equipment } from "./equipment";
import { organizations } from "./organizations";
import { prestartTemplates, prestartTemplateItems } from "./templates";
import { tasks } from "./tasks";

// --- Pre-Start Submissions ---

export const prestartSubmissions = pgTable("prestart_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => prestartTemplates.id, { onDelete: "restrict" }),
  operatorName: text("operator_name").notNull(),
  operatorPhone: text("operator_phone"),
  equipmentReading: integer("equipment_reading").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prestartSubmissionItems = pgTable("prestart_submission_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => prestartSubmissions.id, { onDelete: "cascade" }),
  templateItemId: uuid("template_item_id")
    .notNull()
    .references(() => prestartTemplateItems.id, { onDelete: "restrict" }),
  result: text("result").notNull(), // "pass", "fail", "yes", "no", or text/number value
  failureDescription: text("failure_description"),
  generatedTaskId: uuid("generated_task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prestartSubmissionItemMedia = pgTable("prestart_submission_item_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionItemId: uuid("submission_item_id")
    .notNull()
    .references(() => prestartSubmissionItems.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // "image" | "video"
  fileName: text("file_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- QR Defect/Breakdown Reports ---

export const qrDefectReports = pgTable("qr_defect_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  operatorName: text("operator_name").notNull(),
  operatorPhone: text("operator_phone"),
  equipmentReading: integer("equipment_reading").notNull(),
  description: text("description").notNull(),
  isEquipmentDown: boolean("is_equipment_down").notNull().default(false),
  generatedTaskId: uuid("generated_task_id").references(() => tasks.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const qrDefectReportMedia = pgTable("qr_defect_report_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => qrDefectReports.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // "image" | "video"
  fileName: text("file_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
