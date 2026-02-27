import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EquipmentFormValues } from "@/lib/validations/equipment";

type EquipmentStatus = EquipmentFormValues["status"];
type OperatingStatus = EquipmentFormValues["operatingStatus"];

const equipmentStatusStyles: Record<EquipmentStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

const operatingStatusStyles: Record<OperatingStatus, string> = {
  up: "bg-emerald-50 text-emerald-700 border-emerald-200",
  down: "bg-red-50 text-red-700 border-red-200",
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
