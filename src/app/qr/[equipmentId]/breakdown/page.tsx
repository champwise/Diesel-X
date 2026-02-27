export default async function ReportBreakdownPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-bold text-red-600">Report Breakdown</h1>
      {/* TODO: Same as defect but flagged critical, sets equipment to Down */}
    </div>
  );
}
