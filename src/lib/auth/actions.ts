"use server";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/client";
import { getPendingInviteByToken } from "@/lib/auth/invites";
import {
  inviteAcceptSchema,
  inviteSignupSchema,
  loginSchema,
  signupSchema,
  type InviteSignupInput,
  type LoginInput,
  type SignupInput,
} from "@/lib/auth/schemas";

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

function getDisplayName(fullName: string, email: string) {
  const name = fullName.trim();
  if (name.length > 0) {
    return name;
  }

  const [emailPrefix] = email.split("@");
  return emailPrefix || "Diesel-X User";
}

function buildOrgSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return `${base || "organization"}-${randomUUID().slice(0, 8)}`;
}

function getDefaultOrgName(fullName: string) {
  const [firstName] = fullName.trim().split(" ");
  const ownerName = firstName?.trim() || "My";
  return `${ownerName}'s Organization`;
}

export async function signIn(values: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid sign in details.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signUp(values: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid sign up details.",
    };
  }

  const supabase = await createClient();
  const { fullName, email, password } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "Unable to create your account.",
    };
  }
  const authUser = data.user;

  try {
    await db.transaction(async (tx) => {
      const displayName = getDisplayName(fullName, email);

      await tx
        .insert(users)
        .values({
          id: authUser.id,
          email,
          fullName: displayName,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email,
            fullName: displayName,
            updatedAt: new Date(),
          },
        });

      const orgName = getDefaultOrgName(displayName);
      const [createdOrg] = await tx
        .insert(organizations)
        .values({
          name: orgName,
          slug: buildOrgSlug(orgName),
        })
        .returning({ id: organizations.id });

      await tx.insert(organizationMembers).values({
        organizationId: createdOrg.id,
        userId: authUser.id,
        role: "owner",
        inviteEmail: email,
        inviteStatus: "accepted",
      });
    });
  } catch {
    return {
      ok: false,
      error: "Your account was created, but we could not initialize your organization.",
    };
  }

  return { ok: true };
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const parsed = inviteAcceptSchema.safeParse({ token });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid invitation token.",
    };
  }

  const invite = await getPendingInviteByToken(parsed.data.token);
  if (!invite) {
    return {
      ok: false,
      error: "This invitation is invalid or has already been used.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return {
      ok: false,
      error: "You must be logged in to accept this invite.",
    };
  }
  const userEmail = user.email;

  if (invite.inviteEmail && invite.inviteEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      ok: false,
      error: "This invite was sent to a different email address.",
    };
  }

  if (invite.userId && invite.userId !== user.id) {
    return {
      ok: false,
      error: "This invitation is already linked to another account.",
    };
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = getDisplayName(metadataName, userEmail);

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        id: user.id,
        email: userEmail,
        fullName,
      })
      .onConflictDoNothing({ target: users.id });

    const [updatedMembership] = await tx
      .update(organizationMembers)
      .set({
        userId: user.id,
        inviteStatus: "accepted",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizationMembers.id, invite.id),
          eq(organizationMembers.inviteStatus, "pending")
        )
      )
      .returning({ id: organizationMembers.id });

    if (!updatedMembership) {
      throw new Error("Invite no longer available");
    }
  });

  return { ok: true };
}

export async function acceptInviteWithSignup(
  values: InviteSignupInput
): Promise<ActionResult> {
  const parsed = inviteSignupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid invitation details.",
    };
  }

  const invite = await getPendingInviteByToken(parsed.data.token);
  if (!invite) {
    return {
      ok: false,
      error: "This invitation is invalid or has already been used.",
    };
  }

  if (
    invite.inviteEmail &&
    invite.inviteEmail.toLowerCase() !== parsed.data.email.toLowerCase()
  ) {
    return {
      ok: false,
      error: "This invite was sent to a different email address.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "Unable to create your account.",
    };
  }
  const authUser = data.user;

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(users)
        .values({
          id: authUser.id,
          email: parsed.data.email,
          fullName: getDisplayName(parsed.data.fullName, parsed.data.email),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: parsed.data.email,
            fullName: getDisplayName(parsed.data.fullName, parsed.data.email),
            updatedAt: new Date(),
          },
        });

      const [updatedMembership] = await tx
        .update(organizationMembers)
        .set({
          userId: authUser.id,
          inviteStatus: "accepted",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMembers.id, invite.id),
            eq(organizationMembers.inviteStatus, "pending")
          )
        )
        .returning({ id: organizationMembers.id });

      if (!updatedMembership) {
        throw new Error("Invite no longer available");
      }
    });
  } catch {
    return {
      ok: false,
      error: "Your account was created, but we could not accept the invitation.",
    };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
