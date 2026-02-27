import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  success: "bg-green-50 text-green-800 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

type StatusType = keyof typeof statusStyles;

const statusIcon: Record<StatusType, ReactNode> = {
  success: <CheckCircle2 className="size-4" />,
  error: <TriangleAlert className="size-4" />,
  info: <Info className="size-4" />,
};

export function StatusMessage({
  status,
  message,
}: {
  status?: string | null;
  message?: string | null;
}) {
  if (!status || !message) return null;
  const key: StatusType = statusStyles[status as StatusType] ? (status as StatusType) : "info";

  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        statusStyles[key]
      )}
      role="status"
    >
      {statusIcon[key]}
      <span>{message}</span>
    </div>
  );
}
