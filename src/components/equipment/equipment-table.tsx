"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EquipmentStatusBadge, OperatingStatusBadge } from "./equipment-status-badges";
import { EquipmentListResult } from "@/lib/actions/equipment";
import { Button } from "@/components/ui/button";
import type { EquipmentFormValues } from "@/lib/validations/equipment";

type EquipmentTableProps = {
  result: EquipmentListResult;
};

const formatter = new Intl.NumberFormat("en-US");
type EquipmentStatus = EquipmentFormValues["status"];
type OperatingStatus = EquipmentFormValues["operatingStatus"];

export function EquipmentTable({ result }: EquipmentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data, total, page, perPage, totalPages } = result;

  const paginationRange = useMemo(() => {
    if (total === 0) {
      return { start: 0, end: 0 };
    }

    const start = (page - 1) * perPage + 1;
    const end = Math.min(total, start + data.length - 1);
    return { start, end };
  }, [data.length, page, perPage, total]);

  const navigateToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-light-gray bg-white p-8 text-center shadow-sm">
        <p className="font-heading text-lg font-extrabold text-near-black">No equipment yet</p>
        <p className="mt-1 text-charcoal">
          Add your first unit to start tracking hours, status, and service intervals.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-light-gray bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit #</TableHead>
            <TableHead>Make / Model</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Hours / Kms</TableHead>
            <TableHead>Next Service</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => router.push(`/equipment/${item.id}`)}
            >
              <TableCell className="font-semibold">{item.unitName}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{[item.make, item.model].filter(Boolean).join(" ") || "—"}</span>
                  <span className="text-xs text-mid-gray">
                    Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="capitalize">
                {item.equipmentType.replace(/_/g, " ")}
              </TableCell>
              <TableCell>{item.customerName}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <EquipmentStatusBadge status={item.status as EquipmentStatus} />
                  <OperatingStatusBadge
                    status={item.operatingStatus as OperatingStatus}
                  />
                </div>
              </TableCell>
              <TableCell>
                {formatReading(item.currentReading, item.trackingUnit)}
              </TableCell>
              <TableCell>
                {(() => {
                  if (item.nextServiceDue) {
                    return formatReading(item.nextServiceDue, item.trackingUnit);
                  }
                  const intervalValue =
                    item.trackingUnit === "hours"
                      ? item.serviceIntervalHours
                      : item.serviceIntervalKms;
                  return intervalValue
                    ? `Every ${formatInterval(intervalValue, item.trackingUnit)}`
                    : "—";
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t border-light-gray px-4 py-3 text-sm text-charcoal md:flex-row md:items-center md:justify-between">
        <span>
          Showing {paginationRange.start}-{paginationRange.end} of {total} units
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeftIcon className="size-4" /> Previous
          </Button>
          <span className="text-xs text-mid-gray">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatReading(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  const suffix = unit === "hours" ? "h" : "km";
  return `${formatter.format(value)} ${suffix}`;
}

function formatInterval(value: number | null | undefined, unit: string) {
  if (!value) {
    return "—";
  }

  const suffix = unit === "hours" ? "h" : "km";
  return `${formatter.format(value)} ${suffix}`;
}
