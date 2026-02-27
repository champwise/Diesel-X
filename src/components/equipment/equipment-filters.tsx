"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { equipmentTypeOptions } from "@/lib/validations/equipment";
import { EquipmentFormDialog } from "./equipment-form-dialog";
import type { EquipmentCustomerOption } from "./equipment-form";

type StatusFilterValue = "all" | "active" | "inactive";

type EquipmentFiltersProps = {
  organizationId: string;
  customers: EquipmentCustomerOption[];
  filters: {
    search?: string;
    status: StatusFilterValue;
    equipmentType: (typeof equipmentTypeOptions)[number] | "all";
    customerId?: string;
  };
};

export function EquipmentFilters({
  organizationId,
  customers,
  filters,
}: EquipmentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(filters.search ?? "");
  const isInitialSearch = useRef(true);

  const updateParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (!value || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }

    const handler = setTimeout(() => {
      updateParams({
        search: searchTerm.length ? searchTerm : undefined,
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, updateParams]);

  const statusOptions = useMemo(
    () =>
      [
        { label: "All statuses", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ] as const,
    []
  );

  return (
    <div className="rounded-xl border border-light-gray bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-charcoal">
          <FilterIcon className="size-4" />
          Filters
        </div>
        <EquipmentFormDialog
          organizationId={organizationId}
          customers={customers}
          mode="create"
          title="Add Equipment"
          description="Capture the basics so everyone can find and service this unit."
          trigger={
            <Button size="sm" className="gap-2">
              <PlusIcon className="size-4" />
              Add Equipment
            </Button>
          }
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="group flex flex-col gap-1 text-sm">
          <span className="text-charcoal">Search</span>
          <span className="relative flex items-center">
            <SearchIcon className="absolute left-3 size-4 text-mid-gray" />
            <Input
              placeholder="Search unit #, make, or model"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-charcoal">Customer</span>
          <Select
            value={filters.customerId ?? "all"}
            onValueChange={(value) =>
              updateParams({
                customerId: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-charcoal">Status</span>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              updateParams({
                status: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-charcoal">Equipment Type</span>
          <Select
            value={filters.equipmentType}
            onValueChange={(value) =>
              updateParams({
                equipmentType: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {equipmentTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}
