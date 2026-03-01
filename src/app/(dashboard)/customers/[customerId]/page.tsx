import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  getCustomer,
  type CustomerDetailTask,
} from "@/lib/actions/customers";
import { getOrganizationContext } from "@/lib/auth/organization";
import type { CustomerFormValues } from "@/lib/validations/customers";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Customer Detail | Diesel-X",
};

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

const createdDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const updatedDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = await params;
  const { organizationId } = await getOrganizationContext();
  const customer = await getCustomer(organizationId, customerId);

  if (!customer) {
    notFound();
  }

  const formDefaults = mapCustomerToFormValues(customer);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-mid-gray">Customer</p>
          <h1 className="font-heading text-3xl font-extrabold text-near-black">
            {customer.name}
          </h1>
          <p className="text-charcoal">
            Added {createdDateFormatter.format(new Date(customer.createdAt))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CustomerFormDialog
            organizationId={organizationId}
            mode="edit"
            customerId={customer.id}
            initialValues={formDefaults}
            buttonLabel="Edit Customer"
            buttonVariant="outline"
            title={`Edit ${customer.name}`}
            description="Update customer details used across equipment and tasks."
          />

          {customer.equipmentCount === 0 ? (
            <DeleteCustomerButton
              organizationId={organizationId}
              customerId={customer.id}
              customerName={customer.name}
            />
          ) : null}
        </div>
      </header>

      {customer.equipmentCount > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This customer cannot be deleted while {customer.equipmentCount} equipment
          {customer.equipmentCount === 1 ? " unit is" : " units are"} still assigned.
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DataPoint label="Name" value={customer.name} />
                <DataPoint label="Email" value={customer.email ?? "Not provided"} />
                <DataPoint label="Phone" value={customer.phone ?? "Not provided"} />
                <DataPoint label="Address" value={customer.address ?? "Not provided"} />
                <DataPoint label="Equipment Count" value={String(customer.equipmentCount)} />
                <DataPoint
                  label="Last Updated"
                  value={updatedDateFormatter.format(new Date(customer.updatedAt))}
                />
              </dl>

              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-mid-gray">
                  Notes
                </h3>
                <p className="text-sm text-charcoal">
                  {customer.notes ?? "No notes for this customer yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.equipment.length === 0 ? (
                <p className="text-charcoal">
                  No equipment assigned to this customer.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">
                          <Link
                            href={`/equipment/${item.id}`}
                            className="hover:text-brand-red"
                          >
                            {item.unitName}
                          </Link>
                          <p className="text-xs text-mid-gray">
                            {[item.make, item.model].filter(Boolean).join(" ") || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.equipmentType.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{item.status}</Badge>
                            <Badge variant="outline">{item.operatingStatus}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {updatedDateFormatter.format(new Date(item.updatedAt))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.tasks.length === 0 ? (
                <p className="text-charcoal">No tasks for this customer&apos;s equipment yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-semibold">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="hover:text-brand-red"
                          >
                            {formatTaskType(task.type)}
                          </Link>
                          {task.description ? (
                            <p className="max-w-[280px] truncate text-xs text-mid-gray">
                              {task.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/equipment/${task.equipmentId}`}
                            className="hover:text-brand-red"
                          >
                            {task.equipmentName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatTaskStatus(task.status)}</Badge>
                        </TableCell>
                        <TableCell>{formatOptionalDate(task.scheduledDate)}</TableCell>
                        <TableCell>
                          {createdDateFormatter.format(new Date(task.createdAt))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function mapCustomerToFormValues(
  record: Awaited<ReturnType<typeof getCustomer>>
): CustomerFormValues {
  if (!record) {
    throw new Error("Customer not found");
  }

  return {
    name: record.name,
    email: record.email ?? "",
    phone: record.phone ?? "",
    address: record.address ?? "",
    notes: record.notes ?? "",
  };
}

function formatTaskType(type: CustomerDetailTask["type"]) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTaskStatus(status: CustomerDetailTask["status"]) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatOptionalDate(value: Date | null) {
  if (!value) {
    return "—";
  }
  return updatedDateFormatter.format(new Date(value));
}

function DataPoint({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-mid-gray">{label}</span>
      <span className="text-sm font-semibold text-near-black">{value}</span>
    </div>
  );
}
