export default async function QrPortalPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">Diesel-X</h1>
        <p className="mt-1 text-sm text-neutral-500">Equipment Portal</p>
      </div>

      {/* TODO: Fetch equipment details, show info card */}
      {/* TODO: Hours/km entry with validation against last reading */}
      {/* TODO: Action buttons: Pre-Start Check, Report Defect, Report Breakdown, Pre-Start History */}
    </div>
  );
}
