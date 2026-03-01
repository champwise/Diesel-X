"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";

type CustomersFiltersProps = {
  organizationId: string;
  search?: string;
};

export function CustomersFilters({
  organizationId,
  search,
}: CustomersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(search ?? "");
  const isInitialSearch = useRef(true);

  const updateParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (!value) {
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

  return (
    <div className="rounded-xl border border-light-gray bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-charcoal">
          <FilterIcon className="size-4" />
          Filters
        </div>
        <CustomerFormDialog
          organizationId={organizationId}
          mode="create"
          title="Add Customer"
          description="Create a customer record before assigning equipment."
          trigger={
            <Button size="sm" className="gap-2">
              <PlusIcon className="size-4" />
              Add Customer
            </Button>
          }
        />
      </div>

      <label className="mt-4 flex flex-col gap-1 text-sm">
        <span className="text-charcoal">Search</span>
        <span className="relative flex items-center">
          <SearchIcon className="absolute left-3 size-4 text-mid-gray" />
          <Input
            placeholder="Search name, email, or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </span>
      </label>
    </div>
  );
}
