import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";
import type { Organization, OrganizationMember } from "@/lib/utils/types";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_ORG_COOKIE = "diesel-x-active-org";

export type OrganizationContext = {
  organizationId: string;
  organization: Pick<Organization, "id" | "name">;
  member: Pick<OrganizationMember, "id" | "role" | "userId" | "organizationId">;
};

export const getOrganizationContext = cache(async (): Promise<OrganizationContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  let membership: OrganizationContext["member"] | null = null;

  if (cookieOrgId) {
    const [record] = await db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        userId: organizationMembers.userId,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, cookieOrgId),
          eq(organizationMembers.userId, user.id)
        )
      )
      .limit(1);

    if (record) {
      membership = record;
    }
  }

  if (!membership) {
    const [record] = await db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        userId: organizationMembers.userId,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id))
      .limit(1);

    if (!record) {
      throw new Error("You are not a member of any organization.");
    }

    membership = record;
  }

  const [organizationRecord] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(organizations)
    .where(eq(organizations.id, membership.organizationId))
    .limit(1);

  if (!organizationRecord) {
    throw new Error("Organization context is invalid.");
  }

  return {
    organizationId: organizationRecord.id,
    organization: organizationRecord,
    member: membership,
  };
});

export async function ensureOrgAccess(orgId: string) {
  const context = await getOrganizationContext();

  if (context.organizationId !== orgId) {
    throw new Error("Unauthorized organization access.");
  }

  return context;
}
