"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, equipment } from "@/lib/db/schema";
import { ensureOrgAccess } from "@/lib/auth/organization";
import {
  equipmentFormSchema,
  type EquipmentFormValues,
  equipmentFiltersSchema,
  type EquipmentListFilters,
} from "@/lib/validations/equipment";

export type EquipmentListItem = {
  id: string;
  unitName: string;
  make: string | null;
  model: string | null;
  equipmentType: string;
  status: string;
  operatingStatus: string;
  currentReading: number;
  trackingUnit: string;
  nextServiceDue: number | null;
  nextServiceType: string | null;
  serviceIntervalHours: number | null;
  serviceIntervalKms: number | null;
  customerId: string;
  customerName: string;
  updatedAt: Date | null;
};

export type EquipmentListResult = {
  data: EquipmentListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: EquipmentListFilters;
};

export async function getCustomerOptions(orgId: string) {
  await ensureOrgAccess(orgId);

  return await db
    .select({
      id: customers.id,
      name: customers.name,
    })
    .from(customers)
    .where(eq(customers.organizationId, orgId))
    .orderBy(asc(customers.name));
}

export async function getEquipmentList(
  orgId: string,
  rawFilters: EquipmentListFilters
): Promise<EquipmentListResult> {
  await ensureOrgAccess(orgId);
  const filters = equipmentFiltersSchema.parse(rawFilters);
  const { search, status, customerId, equipmentType, page, perPage } = filters;
  const normalizedSearch =
    search && search.trim().length > 0
      ? `%${search.trim().replace(/[%_]/g, "\\$&")}%`
      : null;

  const whereClauses = [
    eq(equipment.organizationId, orgId),
    status !== "all" ? eq(equipment.status, status) : undefined,
    customerId ? eq(equipment.customerId, customerId) : undefined,
    equipmentType !== "all" ? eq(equipment.equipmentType, equipmentType) : undefined,
    normalizedSearch
      ? or(
          ilike(equipment.unitName, normalizedSearch),
          ilike(equipment.make, normalizedSearch),
          ilike(equipment.model, normalizedSearch)
        )
      : undefined,
  ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[];

  const where = and(...whereClauses);
  const offset = (page - 1) * perPage;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(equipment)
    .where(where);

  const rows = await db
    .select({
      id: equipment.id,
      unitName: equipment.unitName,
      make: equipment.make,
      model: equipment.model,
      equipmentType: equipment.equipmentType,
      status: equipment.status,
      operatingStatus: equipment.operatingStatus,
      currentReading: equipment.currentReading,
      trackingUnit: equipment.trackingUnit,
      nextServiceDue: equipment.nextServiceDue,
      nextServiceType: equipment.nextServiceType,
      serviceIntervalHours: equipment.serviceIntervalHours,
      serviceIntervalKms: equipment.serviceIntervalKms,
      customerId: customers.id,
      customerName: customers.name,
      updatedAt: equipment.updatedAt,
    })
    .from(equipment)
    .innerJoin(
      customers,
      and(
        eq(customers.id, equipment.customerId),
        eq(customers.organizationId, orgId)
      )
    )
    .where(where)
    .orderBy(asc(equipment.unitName))
    .limit(perPage)
    .offset(offset);

  return {
    data: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    filters,
  };
}

export async function getEquipment(orgId: string, equipmentId: string) {
  await ensureOrgAccess(orgId);

  const [record] = await db
    .select({
      id: equipment.id,
      unitName: equipment.unitName,
      make: equipment.make,
      model: equipment.model,
      equipmentType: equipment.equipmentType,
      status: equipment.status,
      operatingStatus: equipment.operatingStatus,
      currentReading: equipment.currentReading,
      trackingUnit: equipment.trackingUnit,
      nextServiceDue: equipment.nextServiceDue,
      nextServiceType: equipment.nextServiceType,
      serviceIntervalHours: equipment.serviceIntervalHours,
      serviceIntervalKms: equipment.serviceIntervalKms,
      taskCreationThreshold: equipment.taskCreationThreshold,
      customerId: equipment.customerId,
      customerName: customers.name,
      vinSerial: equipment.serialNumber,
      registration: equipment.registration,
      year: equipment.year,
      notes: equipment.notes,
      location: equipment.location,
      qrCodeUrl: equipment.qrCodeUrl,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    })
    .from(equipment)
    .innerJoin(customers, eq(customers.id, equipment.customerId))
    .where(and(eq(equipment.organizationId, orgId), eq(equipment.id, equipmentId)))
    .limit(1);

  return record ?? null;
}

export async function createEquipment(
  orgId: string,
  data: EquipmentFormValues
) {
  await ensureOrgAccess(orgId);
  const parsed = equipmentFormSchema.parse(data);

  const [record] = await db
    .insert(equipment)
    .values({
      organizationId: orgId,
      customerId: parsed.customerId,
      unitName: parsed.unitName,
      make: parsed.make ?? null,
      model: parsed.model ?? null,
      year: parsed.year ?? null,
      equipmentType: parsed.equipmentType,
      serialNumber: parsed.vinSerial ?? null,
      trackingUnit: parsed.trackingUnit,
      currentReading: parsed.currentReading,
      nextServiceDue: parsed.nextServiceDue ?? null,
      nextServiceType: parsed.nextServiceType ?? null,
      serviceIntervalHours: parsed.serviceIntervalHours ?? null,
      serviceIntervalKms: parsed.serviceIntervalKms ?? null,
      taskCreationThreshold: parsed.taskCreationThreshold ?? null,
      status: parsed.status,
      operatingStatus: parsed.operatingStatus,
      notes: parsed.notes ?? null,
    })
    .returning({ id: equipment.id });

  revalidatePath("/equipment");
  return record;
}

export async function updateEquipment(
  orgId: string,
  equipmentId: string,
  data: EquipmentFormValues
) {
  await ensureOrgAccess(orgId);
  const parsed = equipmentFormSchema.parse(data);

  const [record] = await db
    .update(equipment)
    .set({
      customerId: parsed.customerId,
      unitName: parsed.unitName,
      make: parsed.make ?? null,
      model: parsed.model ?? null,
      year: parsed.year ?? null,
      equipmentType: parsed.equipmentType,
      serialNumber: parsed.vinSerial ?? null,
      trackingUnit: parsed.trackingUnit,
      currentReading: parsed.currentReading,
      nextServiceDue: parsed.nextServiceDue ?? null,
      nextServiceType: parsed.nextServiceType ?? null,
      serviceIntervalHours: parsed.serviceIntervalHours ?? null,
      serviceIntervalKms: parsed.serviceIntervalKms ?? null,
      taskCreationThreshold: parsed.taskCreationThreshold ?? null,
      status: parsed.status,
      operatingStatus: parsed.operatingStatus,
      notes: parsed.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.organizationId, orgId), eq(equipment.id, equipmentId)))
    .returning({ id: equipment.id });

  revalidatePath("/equipment");
  revalidatePath(`/equipment/${equipmentId}`);
  return record;
}

export async function deleteEquipment(orgId: string, equipmentId: string) {
  await ensureOrgAccess(orgId);

  await db
    .update(equipment)
    .set({
      status: "inactive",
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.organizationId, orgId), eq(equipment.id, equipmentId)));

  revalidatePath("/equipment");
  revalidatePath(`/equipment/${equipmentId}`);
}
