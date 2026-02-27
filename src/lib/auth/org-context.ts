import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/client";

type UserRow = typeof users.$inferSelect;
type MemberRow = typeof organizationMembers.$inferSelect;

export type OrganizationMembership = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MemberRow["role"];
  inviteStatus: MemberRow["inviteStatus"];
};

export type CurrentUserContext = {
  authUser: SupabaseUser;
  profile: UserRow | null;
  memberships: OrganizationMembership[];
};

export async function getCurrentUser(): Promise<CurrentUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  const memberships = await db
    .select({
      membershipId: organizationMembers.id,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      role: organizationMembers.role,
      inviteStatus: organizationMembers.inviteStatus,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(
      and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.inviteStatus, "accepted")
      )
    );

  return {
    authUser: user,
    profile: profile ?? null,
    memberships,
  };
}

export async function requireAuth(): Promise<CurrentUserContext> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireOrg(
  organizationId: string,
  currentUser?: CurrentUserContext
): Promise<MemberRow["role"]> {
  const user = currentUser ?? (await requireAuth());
  const membership = user.memberships.find(
    (item) => item.organizationId === organizationId
  );

  if (!membership) {
    redirect("/dashboard");
  }

  return membership.role;
}

export async function getActiveOrg(
  currentUser?: CurrentUserContext
): Promise<OrganizationMembership | null> {
  const user = currentUser ?? (await requireAuth());

  if (user.memberships.length === 0) {
    return null;
  }

  const headerStore = await headers();
  const cookieStore = await cookies();
  const selectedOrgId =
    headerStore.get("x-org-id") ?? cookieStore.get("dieselx-active-org")?.value;

  if (!selectedOrgId) {
    return user.memberships[0];
  }

  return (
    user.memberships.find((membership) => membership.organizationId === selectedOrgId) ??
    user.memberships[0]
  );
}
