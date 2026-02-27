import { pgTable, uuid, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";
import { users } from "./users";
import { organizations } from "./organizations";

export const timeLogs = pgTable("time_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  mechanicId: uuid("mechanic_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clockIn: timestamp("clock_in", { withTimezone: true }).notNull(),
  clockOut: timestamp("clock_out", { withTimezone: true }),
  clockInLat: real("clock_in_lat"),
  clockInLng: real("clock_in_lng"),
  clockOutLat: real("clock_out_lat"),
  clockOutLng: real("clock_out_lng"),
  startingKm: integer("starting_km"),
  endingKm: integer("ending_km"),
  totalMinutes: integer("total_minutes"),
  totalDistanceKm: real("total_distance_km"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
