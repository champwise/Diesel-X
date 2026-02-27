export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold">Task Detail</h1>
      {/* TODO: Full task detail — status, checklist, parts, media, field report/service sheet, approval actions, clock in/out */}
    </div>
  );
}
