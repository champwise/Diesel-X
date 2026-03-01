"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  notInArray,
  sql,
} from "drizzle-orm";

import { ensureOrgAccess } from "@/lib/auth/organization";
import { db } from "@/lib/db";
import { customers, equipment, qrDefectReports, tasks } from "@/lib/db/schema";

type TaskStatus = typeof tasks.$inferSelect["status"];
type TrackingUnit = typeof equipment.$inferSelect["trackingUnit"];

const CLOSED_TASK_STATUSES: TaskStatus[] = ["completed", "not_approved"];

export type DashboardStats = {
  totalEquipment: number;
  activeTasks: number;
  completedThisMonth: number;
  dueForService: number;
  overdueTasks: number;
};

export type RecentActivityItem = {
  id: string;
  description: string;
  equipmentId: string;
  equipmentName: string;
  status: TaskStatus;
  taskType: typeof tasks.$inferSelect["type"];
  activityAt: Date;
  activityType: "created" | "updated";
};

export type AttentionTaskItem = {
  id: string;
  description: string;
  equipmentId: string;
  equipmentName: string;
  customerName: string;
  status: TaskStatus;
  scheduledDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CriticalDefectItem = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  customerName: string;
  operatorName: string;
  description: string;
  createdAt: Date;
};

export type DashboardAttentionItems = {
  createdTasks: AttentionTaskItem[];
  overdueTasks: AttentionTaskItem[];
  criticalDefects: CriticalDefectItem[];
  total: number;
};

export type EquipmentAlertItem = {
  equipmentId: string;
  equipmentName: string;
  customerName: string;
  alertType: "approaching_service" | "broken_down";
  trackingUnit: TrackingUnit;
  currentReading: number;
  nextServiceDue: number | null;
  remainingReading: number | null;
};

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  await ensureOrgAccess(orgId);

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalEquipmentRows,
    activeTaskRows,
    completedThisMonthRows,
    dueForServiceRows,
    overdueTaskRows,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(equipment)
      .where(and(eq(equipment.organizationId, orgId), eq(equipment.status, "active"))),
    db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, orgId),
          notInArray(tasks.status, CLOSED_TASK_STATUSES)
        )
      ),
    db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, orgId),
          eq(tasks.status, "completed"),
          gte(tasks.updatedAt, startOfMonth)
        )
      ),
    db
      .select({ value: count() })
      .from(equipment)
      .where(
        and(
          eq(equipment.organizationId, orgId),
          eq(equipment.status, "active"),
          isNotNull(equipment.nextServiceDue),
          sql`${equipment.currentReading} >= ${equipment.nextServiceDue}`
        )
      ),
    db
      .select({ value: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, orgId),
          isNotNull(tasks.scheduledDate),
          lt(tasks.scheduledDate, now),
          notInArray(tasks.status, CLOSED_TASK_STATUSES)
        )
      ),
  ]);

  return {
    totalEquipment: totalEquipmentRows[0]?.value ?? 0,
    activeTasks: activeTaskRows[0]?.value ?? 0,
    completedThisMonth: completedThisMonthRows[0]?.value ?? 0,
    dueForService: dueForServiceRows[0]?.value ?? 0,
    overdueTasks: overdueTaskRows[0]?.value ?? 0,
  };
}

export async function getRecentActivity(
  orgId: string,
  limit = 10
): Promise<RecentActivityItem[]> {
  await ensureOrgAccess(orgId);

  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 25)
    : 10;

  const rows = await db
    .select({
      id: tasks.id,
      description: tasks.description,
      taskType: tasks.type,
      status: tasks.status,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      equipmentId: equipment.id,
      equipmentName: equipment.unitName,
    })
    .from(tasks)
    .innerJoin(
      equipment,
      and(
        eq(equipment.id, tasks.equipmentId),
        eq(equipment.organizationId, orgId)
      )
    )
    .where(eq(tasks.organizationId, orgId))
    .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt))
    .limit(safeLimit);

  return rows.map((row) => ({
    id: row.id,
    description: row.description ?? `${humanizeTaskType(row.taskType)} task`,
    equipmentId: row.equipmentId,
    equipmentName: row.equipmentName,
    status: row.status,
    taskType: row.taskType,
    activityAt: row.updatedAt,
    activityType:
      row.updatedAt.getTime() > row.createdAt.getTime() ? "updated" : "created",
  }));
}

export async function getAttentionItems(
  orgId: string,
  limit = 8
): Promise<DashboardAttentionItems> {
  await ensureOrgAccess(orgId);

  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 25)
    : 8;

  const now = new Date();

  const [createdTaskRows, overdueTaskRows, criticalDefectRows] = await Promise.all([
    db
      .select({
        id: tasks.id,
        description: tasks.description,
        equipmentId: equipment.id,
        equipmentName: equipment.unitName,
        customerName: customers.name,
        status: tasks.status,
        scheduledDate: tasks.scheduledDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(
        equipment,
        and(
          eq(equipment.id, tasks.equipmentId),
          eq(equipment.organizationId, orgId)
        )
      )
      .innerJoin(
        customers,
        and(
          eq(customers.id, tasks.customerId),
          eq(customers.organizationId, orgId)
        )
      )
      .where(and(eq(tasks.organizationId, orgId), eq(tasks.status, "created")))
      .orderBy(desc(tasks.createdAt))
      .limit(safeLimit),
    db
      .select({
        id: tasks.id,
        description: tasks.description,
        equipmentId: equipment.id,
        equipmentName: equipment.unitName,
        customerName: customers.name,
        status: tasks.status,
        scheduledDate: tasks.scheduledDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(
        equipment,
        and(
          eq(equipment.id, tasks.equipmentId),
          eq(equipment.organizationId, orgId)
        )
      )
      .innerJoin(
        customers,
        and(
          eq(customers.id, tasks.customerId),
          eq(customers.organizationId, orgId)
        )
      )
      .where(
        and(
          eq(tasks.organizationId, orgId),
          isNotNull(tasks.scheduledDate),
          lt(tasks.scheduledDate, now),
          notInArray(tasks.status, CLOSED_TASK_STATUSES)
        )
      )
      .orderBy(asc(tasks.scheduledDate))
      .limit(safeLimit),
    db
      .select({
        id: qrDefectReports.id,
        equipmentId: equipment.id,
        equipmentName: equipment.unitName,
        customerName: customers.name,
        operatorName: qrDefectReports.operatorName,
        description: qrDefectReports.description,
        createdAt: qrDefectReports.createdAt,
      })
      .from(qrDefectReports)
      .innerJoin(
        equipment,
        and(
          eq(equipment.id, qrDefectReports.equipmentId),
          eq(equipment.organizationId, orgId)
        )
      )
      .innerJoin(
        customers,
        and(
          eq(customers.id, equipment.customerId),
          eq(customers.organizationId, orgId)
        )
      )
      .where(
        and(
          eq(qrDefectReports.organizationId, orgId),
          eq(qrDefectReports.severity, "critical"),
          isNull(qrDefectReports.generatedTaskId)
        )
      )
      .orderBy(desc(qrDefectReports.createdAt))
      .limit(safeLimit),
  ]);

  return {
    createdTasks: createdTaskRows.map((row) => ({
      ...row,
      description: row.description ?? "Task pending approval",
    })),
    overdueTasks: overdueTaskRows.map((row) => ({
      ...row,
      description: row.description ?? "Task overdue",
    })),
    criticalDefects: criticalDefectRows,
    total: createdTaskRows.length + overdueTaskRows.length + criticalDefectRows.length,
  };
}

export async function getEquipmentAlerts(
  orgId: string,
  limit = 12
): Promise<EquipmentAlertItem[]> {
  await ensureOrgAccess(orgId);

  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 30)
    : 12;

  const [brokenDownRows, approachingServiceRows] = await Promise.all([
    db
      .select({
        equipmentId: equipment.id,
        equipmentName: equipment.unitName,
        customerName: customers.name,
        trackingUnit: equipment.trackingUnit,
        currentReading: equipment.currentReading,
        nextServiceDue: equipment.nextServiceDue,
      })
      .from(equipment)
      .innerJoin(
        customers,
        and(
          eq(customers.id, equipment.customerId),
          eq(customers.organizationId, orgId)
        )
      )
      .where(
        and(
          eq(equipment.organizationId, orgId),
          eq(equipment.status, "active"),
          eq(equipment.operatingStatus, "down")
        )
      )
      .orderBy(desc(equipment.updatedAt), asc(equipment.unitName))
      .limit(safeLimit),
    db
      .select({
        equipmentId: equipment.id,
        equipmentName: equipment.unitName,
        customerName: customers.name,
        trackingUnit: equipment.trackingUnit,
        currentReading: equipment.currentReading,
        nextServiceDue: equipment.nextServiceDue,
        remainingReading: sql<number>`${equipment.nextServiceDue} - ${equipment.currentReading}`,
      })
      .from(equipment)
      .innerJoin(
        customers,
        and(
          eq(customers.id, equipment.customerId),
          eq(customers.organizationId, orgId)
        )
      )
      .where(
        and(
          eq(equipment.organizationId, orgId),
          eq(equipment.status, "active"),
          isNotNull(equipment.nextServiceDue),
          sql`${equipment.currentReading} < ${equipment.nextServiceDue}`,
          sql`(
            CASE
              WHEN ${equipment.trackingUnit} = 'hours' THEN ${equipment.serviceIntervalHours}
              ELSE ${equipment.serviceIntervalKms}
            END
          ) IS NOT NULL`,
          sql`(
            CASE
              WHEN ${equipment.trackingUnit} = 'hours' THEN ${equipment.serviceIntervalHours}
              ELSE ${equipment.serviceIntervalKms}
            END
          ) > 0`,
          sql`(${equipment.nextServiceDue} - ${equipment.currentReading}) <= (
            (
              CASE
                WHEN ${equipment.trackingUnit} = 'hours' THEN ${equipment.serviceIntervalHours}
                ELSE ${equipment.serviceIntervalKms}
              END
            ) * 0.10
          )`
        )
      )
      .orderBy(
        asc(sql`${equipment.nextServiceDue} - ${equipment.currentReading}`),
        asc(equipment.unitName)
      )
      .limit(safeLimit),
  ]);

  const deduped = new Map<string, EquipmentAlertItem>();

  for (const row of brokenDownRows) {
    deduped.set(row.equipmentId, {
      equipmentId: row.equipmentId,
      equipmentName: row.equipmentName,
      customerName: row.customerName,
      alertType: "broken_down",
      trackingUnit: row.trackingUnit,
      currentReading: row.currentReading,
      nextServiceDue: row.nextServiceDue,
      remainingReading: null,
    });
  }

  for (const row of approachingServiceRows) {
    if (deduped.has(row.equipmentId)) {
      continue;
    }

    deduped.set(row.equipmentId, {
      equipmentId: row.equipmentId,
      equipmentName: row.equipmentName,
      customerName: row.customerName,
      alertType: "approaching_service",
      trackingUnit: row.trackingUnit,
      currentReading: row.currentReading,
      nextServiceDue: row.nextServiceDue,
      remainingReading: row.remainingReading,
    });
  }

  return Array.from(deduped.values()).slice(0, safeLimit);
}

function humanizeTaskType(type: typeof tasks.$inferSelect["type"]): string {
  if (type === "planned_maintenance") {
    return "Planned maintenance";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}
