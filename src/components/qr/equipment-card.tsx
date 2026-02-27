import type { PortalEquipment } from "@/lib/actions/qr-portal";
import { Badge } from "@/components/ui/badge";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function EquipmentSummaryCard({ equipment }: { equipment: PortalEquipment }) {
  const trackingLabel = equipment.trackingUnit === "hours" ? "Hours" : "Kilometers";
  const isDown = equipment.operatingStatus === "down";

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Unit</p>
          <p className="text-lg font-semibold text-neutral-900">{equipment.unitName}</p>
          <p className="text-sm text-neutral-500">
            {equipment.make ?? ""} {equipment.model ?? ""}
          </p>
        </div>
        <Badge
          variant={isDown ? "destructive" : "secondary"}
          className={isDown ? "bg-red-600 text-white" : "bg-emerald-100 text-emerald-800"}
        >
          {isDown ? "Down" : "Operational"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Customer</dt>
          <dd className="font-medium text-neutral-900">{equipment.customerName}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Current {trackingLabel}</dt>
          <dd className="font-semibold text-neutral-900">{formatNumber(equipment.currentReading)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Next Service</dt>
          <dd className="font-medium text-neutral-900">
            {equipment.nextServiceType ? equipment.nextServiceType : "Pending"}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Tracking</dt>
          <dd className="font-medium capitalize text-neutral-900">{equipment.trackingUnit}</dd>
        </div>
      </dl>
    </section>
  );
}
