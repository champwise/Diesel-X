import { Suspense } from "react";
import type { Metadata } from "next";

import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { getEquipmentList, getCustomerOptions } from "@/lib/actions/equipment";
import { getOrganizationContext } from "@/lib/auth/organization";
import {
  equipmentFiltersSchema,
  type EquipmentListFilters,
} from "@/lib/validations/equipment";

export const metadata: Metadata = {
  title: "Equipment | Diesel-X",
};

type EquipmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EquipmentListPage({ searchParams }: EquipmentPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const { organizationId } = await getOrganizationContext();
  const customers = await getCustomerOptions(organizationId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">
            Track operating status, customers, hours/kms, and upcoming services for every unit.
          </p>
        </div>
      </header>

      <EquipmentFilters
        key={`filters-${filters.search ?? ""}`}
        organizationId={organizationId}
        customers={customers}
        filters={{
          search: filters.search,
          status: filters.status,
          equipmentType: filters.equipmentType,
          customerId: filters.customerId,
        }}
      />

      <Suspense
        key={JSON.stringify(filters)}
        fallback={<EquipmentTableFallback />}
      >
        <EquipmentTableSection organizationId={organizationId} filters={filters} />
      </Suspense>
    </div>
  );
}

function parseFilters(params: Record<string, string | string[] | undefined>): EquipmentListFilters {
  const safeParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    equipmentType: typeof params.equipmentType === "string" ? params.equipmentType : undefined,
    customerId: typeof params.customerId === "string" ? params.customerId : undefined,
    page: typeof params.page === "string" ? Number(params.page) : undefined,
    perPage: typeof params.perPage === "string" ? Number(params.perPage) : undefined,
  };

  const parsed = equipmentFiltersSchema.safeParse(safeParams);
  if (parsed.success) {
    return parsed.data;
  }

  return equipmentFiltersSchema.parse({});
}

async function EquipmentTableSection({
  organizationId,
  filters,
}: {
  organizationId: string;
  filters: EquipmentListFilters;
}) {
  const result = await getEquipmentList(organizationId, filters);
  return <EquipmentTable result={result} />;
}

function EquipmentTableFallback() {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 gap-4 animate-pulse">
          <div className="h-4 rounded bg-neutral-200" />
          <div className="h-4 rounded bg-neutral-200 col-span-2" />
          <div className="h-4 rounded bg-neutral-200" />
          <div className="h-4 rounded bg-neutral-200" />
          <div className="h-4 rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
