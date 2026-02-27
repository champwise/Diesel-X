import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Paperclip } from "lucide-react";

import { getEquipmentPublic, getPrestartHistory } from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PageProps = {
  params: { equipmentId: string };
  searchParams?: { status?: string; message?: string };
};

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function PreStartHistoryPage({ params, searchParams }: PageProps) {
  const { equipmentId } = params;
  const [equipment, history] = await Promise.all([
    getEquipmentPublic(equipmentId).catch(() => null),
    getPrestartHistory(equipmentId),
  ]);

  if (!equipment) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Diesel-X</p>
        <h1 className="text-2xl font-bold">Pre-Start History</h1>
        <p className="text-sm text-neutral-500">Last 30 days of submissions.</p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <div className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          {history.length === 0 ? (
            <p className="text-sm text-neutral-500">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const hasFailures = entry.items.some((item) => item.result === "fail" || item.result === "no");
                return (
                  <details key={entry.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-left">
                      <div>
                        <p className="text-base font-semibold text-neutral-900">{entry.operatorName}</p>
                        <p className="text-xs text-neutral-500">
                          {dateFormatter.format(entry.createdAt)} — {entry.equipmentReading.toLocaleString()}{" "}
                          {equipment.trackingUnit === "hours" ? "hrs" : "km"}
                        </p>
                      </div>
                      <Badge className={hasFailures ? "bg-red-600 text-white" : "bg-emerald-100 text-emerald-800"}>
                        {hasFailures ? "Attention" : "Pass"}
                      </Badge>
                    </summary>

                    <div className="mt-4 space-y-3 text-sm">
                      {entry.items.map((item) => {
                        const failed = item.result === "fail" || item.result === "no";
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-neutral-200 bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-neutral-900">{item.label}</p>
                              {failed ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                                  <AlertTriangle className="size-3.5" />
                                  {item.isCritical ? "Critical fail" : "Failed"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="size-3.5" />
                                  Pass
                                </span>
                              )}
                            </div>
                            {item.failureDescription && (
                              <p className="mt-2 text-sm text-neutral-600">{item.failureDescription}</p>
                            )}
                            {item.media.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-600">
                                {item.media.map((media) => (
                                  <a
                                    key={media.id}
                                    href={media.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-2 py-1 hover:border-red-500 hover:text-red-600"
                                  >
                                    <Paperclip className="size-3" />
                                    {media.fileType === "video" ? "Video" : "Photo"}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>

        <Button asChild variant="secondary" className="w-full">
          <Link href={`/qr/${equipmentId}`}>Back to equipment portal</Link>
        </Button>
      </div>
    </div>
  );
}
