export default async function PreStartPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-bold">Pre-Start Check</h1>
      {/* TODO: Operator name/phone (pre-fill from cookie), checklist from template, failure descriptions + media upload */}
    </div>
  );
}
