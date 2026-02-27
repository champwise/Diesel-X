export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold">Equipment Detail</h1>
      {/* TODO: Editable details, Outstanding Tasks, Task History (filterable/searchable) */}
    </div>
  );
}
