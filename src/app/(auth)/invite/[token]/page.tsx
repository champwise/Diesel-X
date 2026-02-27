import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/org-context";
import { getPendingInviteByToken } from "@/lib/auth/invites";
import { InviteAcceptForm } from "./invite-accept-form";
import { InviteSignupForm } from "./invite-signup-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invite, currentUser] = await Promise.all([
    getPendingInviteByToken(token),
    getCurrentUser(),
  ]);

  if (!invite) {
    return (
      <Card className="border-light-gray shadow-sm">
        <CardHeader>
          <CardTitle>Invitation not found</CardTitle>
          <CardDescription>
            This invitation is invalid, expired, or already accepted.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const normalizedInviteEmail = invite.inviteEmail?.toLowerCase() ?? null;
  const normalizedUserEmail = currentUser?.authUser.email?.toLowerCase() ?? null;
  const emailMismatch =
    Boolean(normalizedInviteEmail) &&
    Boolean(normalizedUserEmail) &&
    normalizedInviteEmail !== normalizedUserEmail;

  return (
    <Card className="border-light-gray shadow-sm">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join {invite.organizationName} as {invite.role}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUser ? (
          <>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{currentUser.authUser.email}</span>
            </p>
            {emailMismatch ? (
              <p className="rounded-md border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                This invite was sent to {invite.inviteEmail}. Sign in with that account to accept.
              </p>
            ) : (
              <InviteAcceptForm token={token} />
            )}
          </>
        ) : (
          <InviteSignupForm token={token} inviteEmail={invite.inviteEmail} />
        )}
      </CardContent>
    </Card>
  );
}
