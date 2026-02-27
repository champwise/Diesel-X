import { pgTable, uuid, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { equipment } from "./equipment";
import { users } from "./users";
import { organizations } from "./organizations";

export const equipmentVisibility = pgTable(
  "equipment_visibility",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references(() => equipment.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isSelfHidden: boolean("is_self_hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("equip_user_unique").on(table.equipmentId, table.userId),
  ]
);
