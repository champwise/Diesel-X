export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  void token;

  return (
    <div>
      <h1 className="text-2xl font-bold">Accept Invitation</h1>
      <p className="mt-2 text-neutral-500">
        You&apos;ve been invited to join an organization on Diesel-X.
      </p>
      {/* TODO: Invite acceptance form using token: {token} */}
    </div>
  );
}
