import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { equipment } from "./equipment";
import { trackingUnitEnum } from "./equipment";

// --- Service Templates ---

export const serviceTemplates = pgTable("service_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  intervalValue: integer("interval_value").notNull(),
  intervalUnit: trackingUnitEnum("interval_unit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceTemplateItems = pgTable("service_template_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => serviceTemplates.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  isCritical: boolean("is_critical").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceTemplateParts = pgTable("service_template_parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => serviceTemplates.id, { onDelete: "cascade" }),
  partNumber: text("part_number").notNull(),
  manufacturer: text("manufacturer"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Pre-Start Templates ---

export const prestartFieldTypeEnum = pgEnum("prestart_field_type", [
  "pass_fail",
  "yes_no",
  "text",
  "number",
]);

export const prestartTemplates = pgTable("prestart_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prestartTemplateItems = pgTable("prestart_template_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => prestartTemplates.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  fieldType: prestartFieldTypeEnum("field_type").notNull().default("pass_fail"),
  isRequired: boolean("is_required").notNull().default(true),
  isCritical: boolean("is_critical").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Equipment ↔ Template Assignments ---

export const equipmentTemplateAssignments = pgTable("equipment_template_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  serviceTemplateId: uuid("service_template_id").references(
    () => serviceTemplates.id,
    { onDelete: "set null" }
  ),
  prestartTemplateId: uuid("prestart_template_id").references(
    () => prestartTemplates.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
