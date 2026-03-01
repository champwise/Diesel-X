"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { ensureOrgAccess } from "@/lib/auth/organization";
import { db } from "@/lib/db";
import { customers, equipment, tasks } from "@/lib/db/schema";
import {
  customerFiltersSchema,
  customerFormSchema,
  type CustomerFormValues,
  type CustomerListFilters,
} from "@/lib/validations/customers";

export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  equipmentCount: number;
  createdAt: Date;
};

export type CustomerListResult = {
  data: CustomerListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: CustomerListFilters;
};

export type CustomerDetailEquipment = {
  id: string;
  unitName: string;
  make: string | null;
  model: string | null;
  equipmentType: string;
  status: string;
  operatingStatus: string;
  updatedAt: Date;
};

export type CustomerDetailTask = {
  id: string;
  type: string;
  status: string;
  description: string | null;
  equipmentId: string;
  equipmentName: string;
  scheduledDate: Date | null;
  createdAt: Date;
};

export type CustomerDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  equipmentCount: number;
  equipment: CustomerDetailEquipment[];
  tasks: CustomerDetailTask[];
};

export async function getCustomersList(
  orgId: string,
  rawFilters: CustomerListFilters
): Promise<CustomerListResult> {
  await ensureOrgAccess(orgId);
  const filters = customerFiltersSchema.parse(rawFilters);
  const { search, page, perPage } = filters;

  const normalizedSearch =
    search && search.trim().length > 0
      ? `%${search.trim().replace(/[%_]/g, "\\$&")}%`
      : null;

  const whereClauses = [
    eq(customers.organizationId, orgId),
    normalizedSearch
      ? or(
          ilike(customers.name, normalizedSearch),
          ilike(customers.email, normalizedSearch),
          ilike(customers.phone, normalizedSearch)
        )
      : undefined,
  ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[];

  const where = and(...whereClauses);
  const offset = (page - 1) * perPage;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(customers)
    .where(where);

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
      createdAt: customers.createdAt,
      equipmentCount: sql<number>`count(${equipment.id})`.mapWith(Number),
    })
    .from(customers)
    .leftJoin(
      equipment,
      and(
        eq(equipment.customerId, customers.id),
        eq(equipment.organizationId, orgId)
      )
    )
    .where(where)
    .groupBy(customers.id)
    .orderBy(asc(customers.name), asc(customers.createdAt))
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

export async function getCustomer(
  orgId: string,
  customerId: string
): Promise<CustomerDetail | null> {
  await ensureOrgAccess(orgId);

  const [record] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      address: customers.address,
      notes: customers.notes,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(and(eq(customers.organizationId, orgId), eq(customers.id, customerId)))
    .limit(1);

  if (!record) {
    return null;
  }

  const [{ value: equipmentCount }] = await db
    .select({ value: count() })
    .from(equipment)
    .where(
      and(eq(equipment.organizationId, orgId), eq(equipment.customerId, customerId))
    );

  const customerEquipment = await db
    .select({
      id: equipment.id,
      unitName: equipment.unitName,
      make: equipment.make,
      model: equipment.model,
      equipmentType: equipment.equipmentType,
      status: equipment.status,
      operatingStatus: equipment.operatingStatus,
      updatedAt: equipment.updatedAt,
    })
    .from(equipment)
    .where(
      and(eq(equipment.organizationId, orgId), eq(equipment.customerId, customerId))
    )
    .orderBy(asc(equipment.unitName));

  const customerTasks = await db
    .select({
      id: tasks.id,
      type: tasks.type,
      status: tasks.status,
      description: tasks.description,
      equipmentId: equipment.id,
      equipmentName: equipment.unitName,
      scheduledDate: tasks.scheduledDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .innerJoin(
      equipment,
      and(eq(equipment.id, tasks.equipmentId), eq(equipment.organizationId, orgId))
    )
    .where(and(eq(tasks.organizationId, orgId), eq(tasks.customerId, customerId)))
    .orderBy(desc(tasks.createdAt));

  return {
    ...record,
    equipmentCount,
    equipment: customerEquipment,
    tasks: customerTasks,
  };
}

export async function createCustomer(orgId: string, data: CustomerFormValues) {
  await ensureOrgAccess(orgId);
  const parsed = customerFormSchema.parse(data);

  const [record] = await db
    .insert(customers)
    .values({
      organizationId: orgId,
      name: parsed.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      address: parsed.address ?? null,
      notes: parsed.notes ?? null,
    })
    .returning({ id: customers.id });

  revalidatePath("/customers");
  return record;
}

export async function updateCustomer(
  orgId: string,
  customerId: string,
  data: CustomerFormValues
) {
  await ensureOrgAccess(orgId);
  const parsed = customerFormSchema.parse(data);

  const [record] = await db
    .update(customers)
    .set({
      name: parsed.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      address: parsed.address ?? null,
      notes: parsed.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.organizationId, orgId), eq(customers.id, customerId)))
    .returning({ id: customers.id });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return record;
}

export async function deleteCustomer(orgId: string, customerId: string) {
  await ensureOrgAccess(orgId);

  const [{ value: equipmentCount }] = await db
    .select({ value: count() })
    .from(equipment)
    .where(
      and(eq(equipment.organizationId, orgId), eq(equipment.customerId, customerId))
    );

  if (equipmentCount > 0) {
    throw new Error(
      "This customer has equipment assigned. Reassign or remove equipment before deleting."
    );
  }

  const [record] = await db
    .delete(customers)
    .where(and(eq(customers.organizationId, orgId), eq(customers.id, customerId)))
    .returning({ id: customers.id });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return record;
}
