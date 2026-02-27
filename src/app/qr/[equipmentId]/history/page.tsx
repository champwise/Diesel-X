import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Paperclip } from "lucide-react";

import { getEquipmentPublic, getPrestartHistory } from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
import { BrandLogo } from "@/components/shared/brand-logo";
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
    <div className="mx-auto min-h-screen max-w-md bg-light-gray/35 px-4 py-8">
      <header className="text-center">
        <BrandLogo priority className="mx-auto h-8 w-auto" />
        <h1 className="font-heading mt-3 text-2xl font-extrabold text-near-black">Pre-Start History</h1>
        <p className="text-sm text-charcoal">Last 30 days of submissions.</p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <div className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <section className="space-y-4 rounded-2xl border border-light-gray bg-white p-4 shadow-sm">
          {history.length === 0 ? (
            <p className="text-sm text-charcoal">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const hasFailures = entry.items.some((item) => item.result === "fail" || item.result === "no");
                return (
                  <details key={entry.id} className="rounded-2xl border border-light-gray bg-light-gray/35 p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-left">
                      <div>
                        <p className="font-heading text-base font-extrabold text-near-black">{entry.operatorName}</p>
                        <p className="text-xs text-mid-gray">
                          {dateFormatter.format(entry.createdAt)} — {entry.equipmentReading.toLocaleString()}{" "}
                          {equipment.trackingUnit === "hours" ? "hrs" : "km"}
                        </p>
                      </div>
                      <Badge
                        className={
                          hasFailures
                            ? "border-brand-red/35 bg-brand-red text-white"
                            : "border-mid-gray/35 bg-light-gray text-charcoal"
                        }
                      >
                        {hasFailures ? "Attention" : "Pass"}
                      </Badge>
                    </summary>

                    <div className="mt-4 space-y-3 text-sm">
                      {entry.items.map((item) => {
                        const failed = item.result === "fail" || item.result === "no";
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-light-gray bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-near-black">{item.label}</p>
                              {failed ? (
                                <span className="flex items-center gap-1 text-xs font-semibold text-brand-red">
                                  <AlertTriangle className="size-3.5" />
                                  {item.isCritical ? "Critical fail" : "Failed"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-semibold text-charcoal">
                                  <CheckCircle2 className="size-3.5" />
                                  Pass
                                </span>
                              )}
                            </div>
                            {item.failureDescription && (
                              <p className="mt-2 text-sm text-charcoal">{item.failureDescription}</p>
                            )}
                            {item.media.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-charcoal">
                                {item.media.map((media) => (
                                  <a
                                    key={media.id}
                                    href={media.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-mid-gray/45 px-2 py-1 hover:border-brand-red hover:text-brand-red"
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
