import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";

export type PendingInvite = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: typeof organizationMembers.$inferSelect.role;
  inviteEmail: string | null;
  userId: string | null;
};

export async function getPendingInviteByToken(
  token: string
): Promise<PendingInvite | null> {
  const [invite] = await db
    .select({
      id: organizationMembers.id,
      organizationId: organizationMembers.organizationId,
      organizationName: organizations.name,
      role: organizationMembers.role,
      inviteEmail: organizationMembers.inviteEmail,
      userId: organizationMembers.userId,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(
      and(
        eq(organizationMembers.inviteToken, token),
        eq(organizationMembers.inviteStatus, "pending")
      )
    )
    .limit(1);

  return invite ?? null;
}
