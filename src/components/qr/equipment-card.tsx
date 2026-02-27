import type { PortalEquipment } from "@/lib/actions/qr-portal";
import { Badge } from "@/components/ui/badge";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function EquipmentSummaryCard({ equipment }: { equipment: PortalEquipment }) {
  const trackingLabel = equipment.trackingUnit === "hours" ? "Hours" : "Kilometers";
  const isDown = equipment.operatingStatus === "down";

  return (
    <section className="rounded-2xl border border-light-gray bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-mid-gray">Unit</p>
          <p className="font-heading text-lg font-extrabold text-near-black">{equipment.unitName}</p>
          <p className="text-sm text-charcoal">
            {equipment.make ?? ""} {equipment.model ?? ""}
          </p>
        </div>
        <Badge
          variant={isDown ? "destructive" : "secondary"}
          className={
            isDown
              ? "border-brand-red/35 bg-brand-red text-white"
              : "border-mid-gray/35 bg-light-gray text-charcoal"
          }
        >
          {isDown ? "Down" : "Operational"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-mid-gray">Customer</dt>
          <dd className="font-medium text-near-black">{equipment.customerName}</dd>
        </div>
        <div>
          <dt className="text-mid-gray">Current {trackingLabel}</dt>
          <dd className="font-semibold text-near-black">{formatNumber(equipment.currentReading)}</dd>
        </div>
        <div>
          <dt className="text-mid-gray">Next Service</dt>
          <dd className="font-medium text-near-black">
            {equipment.nextServiceType ? equipment.nextServiceType : "Pending"}
          </dd>
        </div>
        <div>
          <dt className="text-mid-gray">Tracking</dt>
          <dd className="font-medium capitalize text-near-black">{equipment.trackingUnit}</dd>
        </div>
      </dl>
    </section>
  );
}
