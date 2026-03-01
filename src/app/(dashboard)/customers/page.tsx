import { Suspense } from "react";
import type { Metadata } from "next";

import { CustomersFilters } from "@/components/customers/customers-filters";
import { CustomersTable } from "@/components/customers/customers-table";
import { getCustomersList } from "@/lib/actions/customers";
import { getOrganizationContext } from "@/lib/auth/organization";
import {
  customerFiltersSchema,
  type CustomerListFilters,
} from "@/lib/validations/customers";

export const metadata: Metadata = {
  title: "Customers | Diesel-X",
};

type CustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const { organizationId } = await getOrganizationContext();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-near-black">Customers</h1>
          <p className="text-charcoal">
            Manage customer contacts and view every piece of equipment they own.
          </p>
        </div>
      </header>

      <CustomersFilters organizationId={organizationId} search={filters.search} />

      <Suspense
        key={JSON.stringify(filters)}
        fallback={<CustomersTableFallback />}
      >
        <CustomersTableSection organizationId={organizationId} filters={filters} />
      </Suspense>
    </div>
  );
}

function parseFilters(params: Record<string, string | string[] | undefined>): CustomerListFilters {
  const safeParams = {
    search: typeof params.search === "string" ? params.search : undefined,
    page: typeof params.page === "string" ? Number(params.page) : undefined,
    perPage: typeof params.perPage === "string" ? Number(params.perPage) : undefined,
  };

  const parsed = customerFiltersSchema.safeParse(safeParams);
  if (parsed.success) {
    return parsed.data;
  }

  return customerFiltersSchema.parse({});
}

async function CustomersTableSection({
  organizationId,
  filters,
}: {
  organizationId: string;
  filters: CustomerListFilters;
}) {
  const result = await getCustomersList(organizationId, filters);
  return <CustomersTable result={result} />;
}

function CustomersTableFallback() {
  return (
    <div className="space-y-4 rounded-xl border border-light-gray bg-white p-6 shadow-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-6 gap-4 animate-pulse">
          <div className="h-4 rounded bg-light-gray" />
          <div className="h-4 rounded bg-light-gray" />
          <div className="h-4 rounded bg-light-gray" />
          <div className="h-4 rounded bg-light-gray" />
          <div className="h-4 rounded bg-light-gray" />
          <div className="h-4 rounded bg-light-gray" />
        </div>
      ))}
    </div>
  );
}
