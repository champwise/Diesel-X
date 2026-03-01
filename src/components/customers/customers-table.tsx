"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerListResult } from "@/lib/actions/customers";

type CustomersTableProps = {
  result: CustomerListResult;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export function CustomersTable({ result }: CustomersTableProps) {
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
        <p className="font-heading text-lg font-extrabold text-near-black">
          No customers yet
        </p>
        <p className="mt-1 text-charcoal">
          Add your first customer to start assigning equipment and tracking work.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-light-gray bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Equipment Count</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer"
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              <TableCell className="font-semibold">{customer.name}</TableCell>
              <TableCell>{customer.email ?? "—"}</TableCell>
              <TableCell>{customer.phone ?? "—"}</TableCell>
              <TableCell className="max-w-[240px] truncate">
                {customer.address ?? "—"}
              </TableCell>
              <TableCell>{customer.equipmentCount}</TableCell>
              <TableCell>{dateFormatter.format(new Date(customer.createdAt))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t border-light-gray px-4 py-3 text-sm text-charcoal md:flex-row md:items-center md:justify-between">
        <span>
          Showing {paginationRange.start}-{paginationRange.end} of {total} customers
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
