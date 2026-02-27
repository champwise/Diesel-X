import { pgTable, uuid, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const roleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "mechanic",
  "customer",
  "viewer",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
]);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("viewer"),
    inviteEmail: text("invite_email"),
    inviteToken: text("invite_token").unique(),
    inviteStatus: inviteStatusEnum("invite_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("org_user_unique").on(table.organizationId, table.userId),
  ]
);
