import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentStatusBadge, OperatingStatusBadge } from "@/components/equipment/equipment-status-badges";
import { EquipmentFormDialog } from "@/components/equipment/equipment-form-dialog";
import { getEquipment, getCustomerOptions } from "@/lib/actions/equipment";
import { getOrganizationContext } from "@/lib/auth/organization";
import type { EquipmentFormValues } from "@/lib/validations/equipment";
import { Button } from "@/components/ui/button";
import { generateEquipmentQr } from "@/lib/utils/qr";

export const metadata: Metadata = {
  title: "Equipment Detail | Diesel-X",
};

type EquipmentDetailPageProps = {
  params: Promise<{ equipmentId: string }>;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function EquipmentDetailPage({ params }: EquipmentDetailPageProps) {
  const { equipmentId } = await params;
  const { organizationId } = await getOrganizationContext();
  const equipment = await getEquipment(organizationId, equipmentId);

  if (!equipment) {
    notFound();
  }

  const customers = await getCustomerOptions(organizationId);
  const qrCode = await generateEquipmentQr(equipmentId);

  const intervalValue =
    equipment.trackingUnit === "hours"
      ? equipment.serviceIntervalHours
      : equipment.serviceIntervalKms;
  const projectedNextService = intervalValue
    ? equipment.currentReading + intervalValue
    : null;

  const formDefaults = mapEquipmentToFormValues(equipment);
  const equipmentStatus = equipment.status as EquipmentFormValues["status"];
  const operatingStatus = equipment.operatingStatus as EquipmentFormValues["operatingStatus"];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-mid-gray">Unit</p>
          <h1 className="font-heading text-3xl font-extrabold text-near-black">{equipment.unitName}</h1>
          <p className="text-charcoal">
            {[equipment.year, equipment.make, equipment.model].filter(Boolean).join(" · ") ||
              "Details coming soon"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <EquipmentStatusBadge status={equipmentStatus} />
          <OperatingStatusBadge status={operatingStatus} />
          <EquipmentFormDialog
            organizationId={organizationId}
            customers={customers}
            mode="edit"
            equipmentId={equipment.id}
            initialValues={formDefaults}
            buttonLabel="Edit Equipment"
            buttonVariant="outline"
            title={`Edit ${equipment.unitName}`}
            description="Update the core details that flow into tasks, QR checks, and reports."
          />
        </div>
      </header>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Task History</TabsTrigger>
          <TabsTrigger value="prestart">Pre-Start History</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Equipment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DataPoint label="Customer" value={equipment.customerName} />
                  <DataPoint label="Status" value={<EquipmentStatusBadge status={equipmentStatus} />} />
                  <DataPoint label="Operating Status" value={<OperatingStatusBadge status={operatingStatus} />} />
                  <DataPoint label="Equipment Type" value={formatType(equipment.equipmentType)} />
                  <DataPoint
                    label={`Current ${equipment.trackingUnit === "hours" ? "Hours" : "Kms"}`}
                    value={formatReading(equipment.currentReading, equipment.trackingUnit)}
                  />
                  <DataPoint
                    label="VIN / Serial"
                    value={equipment.vinSerial ?? "Not provided"}
                  />
                  <DataPoint
                    label="Registration"
                    value={equipment.registration ?? "Not provided"}
                  />
                  <DataPoint label="Location" value={equipment.location ?? "Not set"} />
                  <DataPoint
                    label="Last Updated"
                    value={equipment.updatedAt ? dateFormatter.format(equipment.updatedAt) : "—"}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DataPoint
                  label="Next Service Setpoint"
                  value={
                    equipment.nextServiceDue
                      ? formatReading(equipment.nextServiceDue, equipment.trackingUnit)
                      : "Not set"
                  }
                />
                <DataPoint
                  label="Projected Next Service"
                  value={
                    projectedNextService
                      ? formatReading(projectedNextService, equipment.trackingUnit)
                      : "Add interval to forecast"
                  }
                />
                <DataPoint
                  label="Next Service Type"
                  value={equipment.nextServiceType ?? "Not specified"}
                />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-near-black">Service Intervals</p>
                  <div className="text-sm text-charcoal">
                    <p>
                      Hours: {formatInterval(equipment.serviceIntervalHours)} h
                    </p>
                    <p>
                      Kilometers: {formatInterval(equipment.serviceIntervalKms)} km
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {equipment.notes ? (
                <p>{equipment.notes}</p>
              ) : (
                <p className="text-charcoal">
                  No internal notes yet. Use this space to capture site-specific quirks, safety requirements, or customer preferences.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task History</CardTitle>
            </CardHeader>
            <CardContent className="text-charcoal">
              Task history filters, drill-ins, and exports will land here. For now, use the Tasks tab to review assignments.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prestart">
          <Card>
            <CardHeader>
              <CardTitle>Pre-Start History</CardTitle>
            </CardHeader>
            <CardContent className="text-charcoal">
              Pre-start submissions from the QR portal will appear here with filters for template, operator, and failed items.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Image
                src={qrCode.dataUrl}
                alt={`QR code for ${equipment.unitName}`}
                width={192}
                height={192}
                unoptimized
                className="h-48 w-48 rounded-lg border border-light-gray bg-white p-4"
              />
              <div className="space-y-3">
                <p className="text-sm text-charcoal">
                  Print this code and stick it on the unit. Anyone can scan it to log pre-starts, defects, or breakdowns without logging in.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a
                      href={qrCode.dataUrl}
                      download={`diesel-x-${equipment.unitName}.png`}
                    >
                      Download PNG
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={qrCode.targetUrl} target="_blank" rel="noreferrer">
                      Open QR Portal
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function mapEquipmentToFormValues(
  record: Awaited<ReturnType<typeof getEquipment>>
): EquipmentFormValues {
  if (!record) {
    throw new Error("Equipment not found");
  }

  return {
    unitName: record.unitName,
    make: record.make ?? "",
    model: record.model ?? "",
    year: record.year ?? undefined,
    equipmentType: record.equipmentType as EquipmentFormValues["equipmentType"],
    customerId: record.customerId,
    trackingUnit: record.trackingUnit as EquipmentFormValues["trackingUnit"],
    currentReading: record.currentReading,
    nextServiceDue: record.nextServiceDue ?? undefined,
    nextServiceType: record.nextServiceType ?? "",
    serviceIntervalHours: record.serviceIntervalHours ?? undefined,
    serviceIntervalKms: record.serviceIntervalKms ?? undefined,
    taskCreationThreshold: record.taskCreationThreshold ?? undefined,
    vinSerial: record.vinSerial ?? "",
    status: record.status as EquipmentFormValues["status"],
    operatingStatus: record.operatingStatus as EquipmentFormValues["operatingStatus"],
    notes: record.notes ?? "",
  };
}

function formatReading(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return "—";
  }
  const suffix = unit === "hours" ? "h" : "km";
  return `${numberFormatter.format(value)} ${suffix}`;
}

function formatInterval(value: number | null | undefined) {
  if (!value) {
    return "—";
  }
  return numberFormatter.format(value);
}

function formatType(value: string | null) {
  if (!value) {
    return "—";
  }
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function DataPoint({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-mid-gray">
        {label}
      </span>
      <span className="text-sm font-semibold text-near-black">{value}</span>
    </div>
  );
}
