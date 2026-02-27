export default async function PreStartHistoryPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-bold">Pre-Start History</h1>
      {/* TODO: List of past pre-start submissions for this equipment */}
    </div>
  );
}
