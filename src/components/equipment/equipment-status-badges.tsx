import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EquipmentFormValues } from "@/lib/validations/equipment";

type EquipmentStatus = EquipmentFormValues["status"];
type OperatingStatus = EquipmentFormValues["operatingStatus"];

const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  active: "border-light-gray bg-light-gray text-near-black",
  inactive: "border-light-gray bg-white text-charcoal",
};

const operatingStatusStyles: Record<OperatingStatus, string> = {
  up: "border-mid-gray/35 bg-light-gray text-charcoal",
  down: "border-brand-red/35 bg-brand-red/10 text-brand-red",
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <Badge className={cn("capitalize", equipmentStatusStyles[status])}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}

export function OperatingStatusBadge({
  status,
}: {
  status: OperatingStatus;
}) {
  return (
    <Badge className={cn("capitalize", operatingStatusStyles[status])}>
      {status === "up" ? "Operating" : "Down"}
    </Badge>
  );
}
