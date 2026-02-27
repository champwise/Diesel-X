import Link from "next/link";
import { notFound } from "next/navigation";

import { getEquipmentPublic, submitBreakdownReport } from "@/lib/actions/qr-portal";
import { EquipmentSummaryCard } from "@/components/qr/equipment-card";
import { StatusMessage } from "@/components/qr/status-message";
import { BrandLogo } from "@/components/shared/brand-logo";
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
    <div className="mx-auto min-h-screen max-w-md bg-light-gray/35 px-4 py-8">
      <header className="text-center">
        <BrandLogo priority className="mx-auto h-8 w-auto" />
        <h1 className="font-heading mt-3 text-2xl font-extrabold text-brand-red">Report Breakdown</h1>
        <p className="text-sm text-charcoal">
          This marks the equipment as DOWN immediately.
        </p>
      </header>

      <StatusMessage status={searchParams?.status} message={searchParams?.message} />

      <div className="mt-6 space-y-6">
        <EquipmentSummaryCard equipment={equipment} />

        <form
          action={action}
          method="post"
          className="space-y-5 rounded-2xl border border-brand-red/35 bg-white p-4 shadow-sm"
          encType="multipart/form-data"
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="operatorName">
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
              <label className="text-sm font-medium text-charcoal" htmlFor="operatorPhone">
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
              <label className="text-sm font-medium text-charcoal" htmlFor="equipmentReading">
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

          <div className="rounded-xl border border-dashed border-brand-red/45 bg-brand-red/10 p-3 text-sm text-brand-red">
            Severity is fixed to <strong>Critical</strong>. A breakdown task will be created and this equipment will show
            as DOWN until cleared.
          </div>
          <input type="hidden" name="severity" value="critical" />

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="description">
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
              <label className="text-sm font-medium text-charcoal" htmlFor="media">
                Photos or videos (optional)
              </label>
              <input
                id="media"
                name="media"
                type="file"
                accept="image/*,video/*"
                multiple
                className="mt-1 w-full text-sm text-charcoal"
              />
              <p className="mt-1 text-xs text-mid-gray">
                Up to 5 photos and 2 short videos (max 2 minutes each).
              </p>
            </div>
          </div>

          <Button type="submit" className="h-11 w-full">
            Mark equipment as broken down
          </Button>
          <Button asChild variant="secondary" className="h-11 w-full">
            <Link href={`/qr/${equipmentId}`}>Back to equipment portal</Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
