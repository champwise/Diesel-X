import { pgTable, uuid, text, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { customers } from "./customers";

export const trackingUnitEnum = pgEnum("tracking_unit", ["hours", "kilometers"]);

export const operatingStatusEnum = pgEnum("operating_status", ["up", "down"]);

export const equipment = pgTable("equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  unitName: text("unit_name").notNull(),
  make: text("make"),
  model: text("model"),
  serialNumber: text("serial_number"),
  registration: text("registration"),
  location: text("location"),
  photoUrl: text("photo_url"),
  trackingUnit: trackingUnitEnum("tracking_unit").notNull().default("hours"),
  currentReading: integer("current_reading").notNull().default(0),
  nextServiceDue: integer("next_service_due"),
  nextServiceType: text("next_service_type"),
  taskCreationThreshold: integer("task_creation_threshold").default(50),
  operatingStatus: operatingStatusEnum("operating_status").notNull().default("up"),
  qrCodeUrl: text("qr_code_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
