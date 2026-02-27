export default async function ReportDefectPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-bold">Report Defect</h1>
      {/* TODO: Name/phone, description, photo/video uploads (5 photos, 2 videos max 2min) */}
    </div>
  );
}
