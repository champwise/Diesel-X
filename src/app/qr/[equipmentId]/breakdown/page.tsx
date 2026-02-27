import Link from "next/link";
import { notFound } from "next/navigation";

import { getEquipmentPublic, submitBreakdownReport } from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOperatorPrefill } from "@/lib/qr/operator-cookie";

type PageProps = {
  params: { equipmentId: string };
  searchParams?: { status?: string; message?: string };
};

export default async function ReportBreakdownPage({ params, searchParams }: PageProps) {
  const { equipmentId } = params;
  const [equipment, operator] = await Promise.all([
    getEquipmentPublic(equipmentId).catch(() => null),
    getOperatorPrefill(),
  ]);

  if (!equipment) {
    notFound();
  }

  const trackingLabel = equipment.trackingUnit === "hours" ? "Hours" : "Kilometers";
  const action = submitBreakdownReport.bind(null, equipmentId);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Diesel-X</p>
        <h1 className="text-2xl font-bold text-red-600">Report Breakdown</h1>
        <p className="text-sm text-neutral-500">
          This marks the equipment as DOWN immediately.
        </p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <div className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <form
          action={action}
          method="post"
          className="space-y-5 rounded-2xl border border-red-200 bg-white p-4 shadow-sm"
          encType="multipart/form-data"
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="operatorName">
                Your name
              </label>
              <Input
                id="operatorName"
                name="operatorName"
                placeholder="e.g. Chris Lopez"
                defaultValue={operator?.name}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="operatorPhone">
                Phone (optional)
              </label>
              <Input
                id="operatorPhone"
                name="operatorPhone"
                placeholder="04xx xxx xxx"
                inputMode="tel"
                defaultValue={operator?.phone}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="equipmentReading">
                Current {trackingLabel}
              </label>
              <Input
                id="equipmentReading"
                name="equipmentReading"
                type="number"
                inputMode="numeric"
                required
                min={equipment.currentReading}
                defaultValue={equipment.currentReading}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-red-300 bg-red-50/70 p-3 text-sm text-red-700">
            Severity is fixed to <strong>Critical</strong>. A breakdown task will be created and this equipment will show
            as DOWN until cleared.
          </div>
          <input type="hidden" name="severity" value="critical" />

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="description">
                What happened?
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the failure, symptoms, and location."
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="media">
                Photos or videos (optional)
              </label>
              <input
                id="media"
                name="media"
                type="file"
                accept="image/*,video/*"
                multiple
                className="mt-1 w-full text-sm text-neutral-700"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Up to 5 photos and 2 short videos (max 2 minutes each).
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-500">
            Mark equipment as broken down
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/qr/${equipmentId}`}>Back to equipment portal</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
