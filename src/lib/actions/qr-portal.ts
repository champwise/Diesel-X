"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  customers,
  equipment,
  equipmentTemplateAssignments,
  organizations,
  prestartSubmissionItemMedia,
  prestartSubmissionItems,
  prestartSubmissions,
  prestartTemplateItems,
  prestartTemplates,
  qrDefectReportMedia,
  qrDefectReports,
  tasks,
} from "@/lib/db/schema";
import { prestartFieldTypeEnum } from "@/lib/db/schema/templates";
import { trackingUnitEnum } from "@/lib/db/schema/equipment";
import { qrSeverityEnum } from "@/lib/db/schema/qr-submissions";
import { storageBuckets, uploadFileToStorage } from "@/lib/supabase/storage";
import { OPERATOR_COOKIE_MAX_AGE, OPERATOR_COOKIE_NAME } from "@/lib/qr/constants";

type TransactionClient = Parameters<typeof db.transaction>[0] extends (
  tx: infer T
) => Promise<unknown>
  ? T
  : never;
type DbExecutor = typeof db | TransactionClient;
const MAX_DEFECT_MEDIA = 5;
const MAX_DEFECT_VIDEOS = 2;
const MAX_PRESTART_MEDIA = 5;
const MAX_PRESTART_VIDEOS = 2;
const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const VIDEO_MAX_BYTES = 80 * 1024 * 1024; // ~80MB

const readingSchema = z.object({
  reading: z.coerce.number().int().min(0).max(1_000_000_000),
});

const defectSchema = z.object({
  operatorName: z.string().trim().min(1, "Name is required"),
  operatorPhone: z.string().trim().optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  equipmentReading: z.coerce.number().min(0).max(1_000_000_000),
  severity: z.enum(qrSeverityEnum.enumValues),
});

const prestartHeaderSchema = z.object({
  operatorName: z.string().trim().min(1, "Operator name is required"),
  operatorPhone: z.string().trim().optional(),
  equipmentReading: z.coerce.number().min(0).max(1_000_000_000),
});

export type PortalEquipment = {
  id: string;
  unitName: string;
  make: string | null;
  model: string | null;
  trackingUnit: (typeof trackingUnitEnum.enumValues)[number];
  currentReading: number;
  operatingStatus: string;
  nextServiceType: string | null;
  customerName: string;
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
};

export type PrestartTemplateSummary = {
  template: {
    id: string;
    name: string;
    description: string | null;
  };
  items: Array<{
    id: string;
    label: string;
    fieldType: (typeof prestartFieldTypeEnum.enumValues)[number];
    isCritical: boolean;
    isRequired: boolean;
  }>;
};

export type PrestartHistoryEntry = {
  id: string;
  operatorName: string;
  operatorPhone: string | null;
  equipmentReading: number;
  createdAt: Date;
  items: Array<{
    id: string;
    label: string;
    result: string;
    failureDescription: string | null;
    isCritical: boolean;
    media: Array<{
      id: string;
      fileUrl: string;
      fileType: string;
    }>;
  }>;
};

export async function getEquipmentPublic(equipmentId: string): Promise<PortalEquipment> {
  const rows = await db
    .select({
      id: equipment.id,
      unitName: equipment.unitName,
      make: equipment.make,
      model: equipment.model,
      trackingUnit: equipment.trackingUnit,
      currentReading: equipment.currentReading,
      operatingStatus: equipment.operatingStatus,
      nextServiceType: equipment.nextServiceType,
      customerName: customers.name,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationLogoUrl: organizations.logoUrl,
    })
    .from(equipment)
    .innerJoin(customers, eq(customers.id, equipment.customerId))
    .innerJoin(organizations, eq(organizations.id, equipment.organizationId))
    .where(eq(equipment.id, equipmentId))
    .limit(1);

  if (!rows.length) {
    throw new Error("Equipment not found");
  }

  const row = rows[0];

  return {
    id: row.id,
    unitName: row.unitName,
    make: row.make,
    model: row.model,
    trackingUnit: row.trackingUnit,
    currentReading: row.currentReading,
    operatingStatus: row.operatingStatus,
    nextServiceType: row.nextServiceType,
    customerName: row.customerName,
    organization: {
      id: row.organizationId,
      name: row.organizationName,
      logoUrl: row.organizationLogoUrl,
    },
  };
}

export async function getPrestartTemplateForEquipment(
  equipmentId: string
): Promise<PrestartTemplateSummary | null> {
  const assignments = await db
    .select({
      templateId: equipmentTemplateAssignments.prestartTemplateId,
    })
    .from(equipmentTemplateAssignments)
    .where(eq(equipmentTemplateAssignments.equipmentId, equipmentId))
    .limit(1);

  const templateId = assignments[0]?.templateId;

  if (!templateId) {
    return null;
  }

  const templateRow = await db
    .select({
      id: prestartTemplates.id,
      name: prestartTemplates.name,
      description: prestartTemplates.description,
    })
    .from(prestartTemplates)
    .where(eq(prestartTemplates.id, templateId))
    .limit(1);

  if (!templateRow.length) {
    return null;
  }

  const items = await db
    .select({
      id: prestartTemplateItems.id,
      label: prestartTemplateItems.label,
      fieldType: prestartTemplateItems.fieldType,
      isCritical: prestartTemplateItems.isCritical,
      isRequired: prestartTemplateItems.isRequired,
    })
    .from(prestartTemplateItems)
    .where(eq(prestartTemplateItems.templateId, templateId))
    .orderBy(asc(prestartTemplateItems.sortOrder), asc(prestartTemplateItems.createdAt));

  return {
    template: templateRow[0],
    items,
  };
}

export async function updateHoursKms(
  equipmentId: string,
  formData: FormData
) {
  const parsed = readingSchema.safeParse({
    reading: formData.get("reading"),
  });

  const basePath = `/qr/${equipmentId}`;

  if (!parsed.success) {
    return redirectWithStatus(basePath, "error", parsed.error.issues[0]?.message ?? "Invalid reading");
  }

  const equipmentRecord = await getEquipmentRecord(equipmentId);

  if (!equipmentRecord) {
    return redirectWithStatus(basePath, "error", "Equipment not found");
  }

  if (parsed.data.reading < equipmentRecord.currentReading) {
    return redirectWithStatus(
      basePath,
      "error",
      `New ${equipmentRecord.trackingUnit === "hours" ? "hours" : "kms"} reading must be at least ${equipmentRecord.currentReading}`
    );
  }

  if (parsed.data.reading === equipmentRecord.currentReading) {
    return redirectWithStatus(basePath, "info", "Reading already up to date");
  }

  await db
    .update(equipment)
    .set({ currentReading: parsed.data.reading, updatedAt: new Date() })
    .where(eq(equipment.id, equipmentId));

  revalidatePath(basePath);
  revalidatePath(`${basePath}/pre-start`);

  return redirectWithStatus(
    basePath,
    "success",
    `${capitalize(equipmentRecord.trackingUnit)} updated to ${parsed.data.reading.toLocaleString()}`
  );
}

export async function submitPrestartCheck(
  equipmentId: string,
  formData: FormData
) {
  const redirectPath = `/qr/${equipmentId}/pre-start`;

  const header = prestartHeaderSchema.safeParse({
    operatorName: formData.get("operatorName"),
    operatorPhone: formData.get("operatorPhone"),
    equipmentReading: formData.get("equipmentReading"),
  });

  if (!header.success) {
    return redirectWithStatus(redirectPath, "error", header.error.issues[0]?.message ?? "Invalid submission");
  }

  const equipmentRecord = await getEquipmentRecord(equipmentId);
  if (!equipmentRecord) {
    return redirectWithStatus(redirectPath, "error", "Equipment not found");
  }

  const template = await getPrestartTemplateForEquipment(equipmentId);
  if (!template) {
    return redirectWithStatus(redirectPath, "error", "No pre-start template configured for this equipment");
  }

  if (header.data.equipmentReading < equipmentRecord.currentReading) {
    return redirectWithStatus(
      redirectPath,
      "error",
      `Reading must be at least ${equipmentRecord.currentReading.toLocaleString()}`
    );
  }

  const parsedItems = parsePrestartItems(formData, template.items);
  if (parsedItems.some((item) => item.error)) {
    const firstError = parsedItems.find((item) => item.error)?.error;
    return redirectWithStatus(redirectPath, "error", firstError ?? "Checklist validation failed");
  }

  await db.transaction(async (tx) => {
    const [submission] = await tx
      .insert(prestartSubmissions)
      .values({
        organizationId: equipmentRecord.organizationId,
        equipmentId,
        templateId: template.template.id,
        operatorName: header.data.operatorName,
        operatorPhone: header.data.operatorPhone,
        equipmentReading: header.data.equipmentReading,
      })
      .returning({ id: prestartSubmissions.id });

    const failureTasks: Record<string, string | null> = {};

    for (const item of parsedItems) {
      if (item.isFailure) {
        const taskId = await createTask(tx, {
          equipment: equipmentRecord,
          description: `${item.label} failed during pre-start check`,
          operatorName: header.data.operatorName,
          operatorPhone: header.data.operatorPhone,
          equipmentReading: header.data.equipmentReading,
          type: item.isCritical ? "breakdown" : "defect",
        });
        failureTasks[item.id] = taskId;
      }
    }

    const insertedItems = await tx
      .insert(prestartSubmissionItems)
      .values(
        parsedItems.map((item) => ({
          submissionId: submission.id,
          templateItemId: item.id,
          result: item.result,
          failureDescription: item.failureDescription,
          generatedTaskId: failureTasks[item.id] ?? null,
        }))
      )
      .returning({ id: prestartSubmissionItems.id, templateItemId: prestartSubmissionItems.templateItemId });

    const itemIdMap = new Map(insertedItems.map((row) => [row.templateItemId, row.id] as const));

    for (const item of parsedItems) {
      if (!item.mediaFiles?.length) continue;
      const submissionItemId = itemIdMap.get(item.id);
      if (!submissionItemId) continue;

      for (const file of item.mediaFiles) {
        const mediaType = file.type.startsWith("video/") ? "video" : "image";
        const upload = await uploadFileToStorage({
          bucket: storageBuckets.prestartMedia,
          file,
          folder: `${equipmentId}/prestart/${submission.id}`,
          maxSizeBytes: mediaType === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES,
        });

        await tx.insert(prestartSubmissionItemMedia).values({
          submissionItemId,
          fileUrl: upload.url,
          fileType: mediaType,
          fileName: upload.path,
        });
      }
    }

    return submission.id;
  });

  if (header.data.equipmentReading > equipmentRecord.currentReading) {
    await db
      .update(equipment)
      .set({ currentReading: header.data.equipmentReading, updatedAt: new Date() })
      .where(eq(equipment.id, equipmentId));
  }

  await rememberOperator(header.data.operatorName, header.data.operatorPhone ?? undefined);

  revalidatePath(`/qr/${equipmentId}`);
  revalidatePath(`/qr/${equipmentId}/history`);
  revalidatePath(redirectPath);

  const hadFailures = parsedItems.some((item) => item.isFailure);

  return redirectWithStatus(
    redirectPath,
    "success",
    hadFailures
      ? "Pre-start submitted with failures. Maintenance team has been notified."
      : "Pre-start submitted successfully."
  );
}

export async function submitDefectReport(
  equipmentId: string,
  formData: FormData
) {
  return submitDefectOrBreakdownReport(equipmentId, formData, { forceBreakdown: false });
}

export async function submitBreakdownReport(
  equipmentId: string,
  formData: FormData
) {
  return submitDefectOrBreakdownReport(equipmentId, formData, { forceBreakdown: true });
}

export async function getPrestartHistory(
  equipmentId: string
): Promise<PrestartHistoryEntry[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const submissions = await db
    .select({
      id: prestartSubmissions.id,
      operatorName: prestartSubmissions.operatorName,
      operatorPhone: prestartSubmissions.operatorPhone,
      equipmentReading: prestartSubmissions.equipmentReading,
      createdAt: prestartSubmissions.createdAt,
    })
    .from(prestartSubmissions)
    .where(
      and(
        eq(prestartSubmissions.equipmentId, equipmentId),
        gte(prestartSubmissions.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(prestartSubmissions.createdAt))
    .limit(25);

  if (!submissions.length) {
    return [];
  }

  const submissionIds = submissions.map((submission) => submission.id);

  const items = await db
    .select({
      submissionId: prestartSubmissionItems.submissionId,
      itemId: prestartSubmissionItems.id,
      result: prestartSubmissionItems.result,
      failureDescription: prestartSubmissionItems.failureDescription,
      templateItemId: prestartSubmissionItems.templateItemId,
      label: prestartTemplateItems.label,
      isCritical: prestartTemplateItems.isCritical,
      mediaId: prestartSubmissionItemMedia.id,
      mediaUrl: prestartSubmissionItemMedia.fileUrl,
      mediaType: prestartSubmissionItemMedia.fileType,
    })
    .from(prestartSubmissionItems)
    .innerJoin(
      prestartTemplateItems,
      eq(prestartTemplateItems.id, prestartSubmissionItems.templateItemId)
    )
    .leftJoin(
      prestartSubmissionItemMedia,
      eq(prestartSubmissionItemMedia.submissionItemId, prestartSubmissionItems.id)
    )
    .where(inArray(prestartSubmissionItems.submissionId, submissionIds))
    .orderBy(asc(prestartTemplateItems.sortOrder));

  const grouped = submissions.map<PrestartHistoryEntry>((submission) => ({
    id: submission.id,
    operatorName: submission.operatorName,
    operatorPhone: submission.operatorPhone,
    equipmentReading: submission.equipmentReading,
    createdAt: submission.createdAt,
    items: [],
  }));

  const submissionMap = new Map(grouped.map((entry) => [entry.id, entry] as const));
  const itemMap = new Map<string, PrestartHistoryEntry["items"][number]>();

  for (const item of items) {
    const submissionEntry = submissionMap.get(item.submissionId);
    if (!submissionEntry) continue;

    let entry = itemMap.get(item.itemId);
    if (!entry) {
      entry = {
        id: item.itemId,
        label: item.label,
        result: item.result,
        failureDescription: item.failureDescription,
        isCritical: item.isCritical,
        media: [],
      };
      submissionEntry.items.push(entry);
      itemMap.set(item.itemId, entry);
    }

    if (item.mediaId && item.mediaUrl) {
      entry.media.push({ id: item.mediaId, fileUrl: item.mediaUrl, fileType: item.mediaType ?? "image" });
    }
  }

  return grouped;
}

async function submitDefectOrBreakdownReport(
  equipmentId: string,
  formData: FormData,
  options: { forceBreakdown: boolean }
) {
  const redirectPath = options.forceBreakdown
    ? `/qr/${equipmentId}/breakdown`
    : `/qr/${equipmentId}/defect`;

  const payload = defectSchema.safeParse({
    operatorName: formData.get("operatorName"),
    operatorPhone: formData.get("operatorPhone"),
    description: formData.get("description"),
    equipmentReading: formData.get("equipmentReading"),
    severity: options.forceBreakdown ? "critical" : formData.get("severity"),
  });

  if (!payload.success) {
    return redirectWithStatus(redirectPath, "error", payload.error.issues[0]?.message ?? "Invalid submission");
  }

  const equipmentRecord = await getEquipmentRecord(equipmentId);
  if (!equipmentRecord) {
    return redirectWithStatus(redirectPath, "error", "Equipment not found");
  }

  if (payload.data.equipmentReading < equipmentRecord.currentReading) {
    return redirectWithStatus(
      redirectPath,
      "error",
      `Reading must be at least ${equipmentRecord.currentReading.toLocaleString()}`
    );
  }

  const files = formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const validationError = validateMediaCounts(files);
  if (validationError) {
    return redirectWithStatus(redirectPath, "error", validationError);
  }

  const isBreakdown = options.forceBreakdown || payload.data.severity === "critical";

  await db.transaction(async (tx) => {
    const [taskId, report] = await createReportAndTask(tx, {
      equipment: equipmentRecord,
      operatorName: payload.data.operatorName,
      operatorPhone: payload.data.operatorPhone,
      equipmentReading: payload.data.equipmentReading,
      description: payload.data.description,
      severity: payload.data.severity,
      isBreakdown,
    });

    if (files.length) {
      const mediaUploads = await uploadQrMedia(files, equipmentId);

      for (const media of mediaUploads) {
        await tx.insert(qrDefectReportMedia).values({
          reportId: report.id,
          fileUrl: media.url,
          fileType: media.type,
          fileName: media.path,
        });
      }
    }

    await tx
      .update(qrDefectReports)
      .set({ generatedTaskId: taskId })
      .where(eq(qrDefectReports.id, report.id));
  });

  if (payload.data.equipmentReading > equipmentRecord.currentReading) {
    await db
      .update(equipment)
      .set({ currentReading: payload.data.equipmentReading, updatedAt: new Date() })
      .where(eq(equipment.id, equipmentId));
  }

  if (isBreakdown && equipmentRecord.operatingStatus !== "down") {
    await db
      .update(equipment)
      .set({ operatingStatus: "down", updatedAt: new Date() })
      .where(eq(equipment.id, equipmentId));
  }

  await rememberOperator(payload.data.operatorName, payload.data.operatorPhone ?? undefined);

  revalidatePath(`/qr/${equipmentId}`);

  const statusMessage = isBreakdown
    ? "Breakdown reported. Equipment marked as down."
    : payload.data.severity === "critical"
      ? "Critical defect reported."
      : "Defect report submitted.";

  return redirectWithStatus(redirectPath, "success", statusMessage);
}

async function createReportAndTask(
  tx: DbExecutor,
  params: {
    equipment: EquipmentRecord;
    operatorName: string;
    operatorPhone?: string | null;
    equipmentReading: number;
    description: string;
    severity: (typeof qrSeverityEnum.enumValues)[number];
    isBreakdown: boolean;
  }
): Promise<[string, { id: string }]> {
  const [report] = await tx
    .insert(qrDefectReports)
    .values({
      organizationId: params.equipment.organizationId,
      equipmentId: params.equipment.id,
      operatorName: params.operatorName,
      operatorPhone: params.operatorPhone,
      equipmentReading: params.equipmentReading,
      description: params.description,
      isEquipmentDown: params.isBreakdown,
      severity: params.severity,
    })
    .returning({ id: qrDefectReports.id });

  const taskId = await createTask(tx, {
    equipment: params.equipment,
    description: params.description,
    operatorName: params.operatorName,
    operatorPhone: params.operatorPhone,
    equipmentReading: params.equipmentReading,
    type: params.isBreakdown ? "breakdown" : "defect",
  });

  if (!taskId) {
    throw new Error("Failed to create task for report");
  }

  return [taskId, report];
}

type ParsedPrestartItem = PrestartTemplateSummary["items"][number] & {
  result: string;
  failureDescription: string | null;
  isFailure: boolean;
  mediaFiles?: File[];
  error?: string;
};

function parsePrestartItems(
  formData: FormData,
  templateItems: PrestartTemplateSummary["items"]
): ParsedPrestartItem[] {
  return templateItems.map((item) => {
    const keyBase = `item-${item.id}`;
    const resultValue = formData.get(`${keyBase}-result`);
    const notesValue = formData.get(`${keyBase}-notes`);
    const mediaFiles = formData
      .getAll(`${keyBase}-media`)
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (item.isRequired && (resultValue === null || resultValue === "")) {
      return { ...item, result: "", error: `${item.label} is required`, isFailure: false, failureDescription: null };
    }

    let result = typeof resultValue === "string" ? resultValue : "";

    if (item.fieldType === "number" && result) {
      const parsed = Number(result);
      if (Number.isNaN(parsed)) {
        return {
          ...item,
          result: "",
          error: `${item.label} must be a number`,
          isFailure: false,
          failureDescription: null,
        };
      }
      result = parsed.toString();
    }

    const isFailure =
      (item.fieldType === "pass_fail" && result === "fail") ||
      (item.fieldType === "yes_no" && result === "no");

    if (isFailure) {
      if (!notesValue || typeof notesValue !== "string" || !notesValue.trim()) {
        return {
          ...item,
          result,
          error: `${item.label} failure notes are required`,
          isFailure,
          failureDescription: null,
        };
      }
    }

    if (mediaFiles.length > MAX_PRESTART_MEDIA) {
      return {
        ...item,
        result,
        error: `${item.label} can include up to ${MAX_PRESTART_MEDIA} files`,
        isFailure,
        failureDescription: typeof notesValue === "string" ? notesValue.trim() : null,
      };
    }

    const videoCount = mediaFiles.filter((file) => file.type.startsWith("video/")).length;
    if (videoCount > MAX_PRESTART_VIDEOS) {
      return {
        ...item,
        result,
        error: `${item.label} can include up to ${MAX_PRESTART_VIDEOS} videos`,
        isFailure,
        failureDescription: typeof notesValue === "string" ? notesValue.trim() : null,
      };
    }

    return {
      ...item,
      result,
      failureDescription: typeof notesValue === "string" ? notesValue.trim() : null,
      isFailure,
      mediaFiles,
    };
  });
}

async function uploadQrMedia(files: File[], equipmentId: string) {
  const uploads: Array<{ url: string; path: string; type: string }> = [];

  for (const file of files) {
    const targetBucket = storageBuckets.qrMedia;
    const type = file.type.startsWith("video/") ? "video" : "image";
    const result = await uploadFileToStorage({
      bucket: targetBucket,
      file,
      folder: `${equipmentId}/qr-reports`,
      maxSizeBytes: type === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES,
    });
    uploads.push({ ...result, type });
  }

  return uploads;
}

function validateMediaCounts(files: File[]) {
  const photoCount = files.filter((file) => file.type.startsWith("image/")).length;
  const videoCount = files.filter((file) => file.type.startsWith("video/")).length;

  if (photoCount > MAX_DEFECT_MEDIA) {
    return `Up to ${MAX_DEFECT_MEDIA} photos are allowed`;
  }

  if (videoCount > MAX_DEFECT_VIDEOS) {
    return `Up to ${MAX_DEFECT_VIDEOS} videos are allowed`;
  }

  return null;
}

async function getEquipmentRecord(equipmentId: string) {
  const rows = await db
    .select({
      id: equipment.id,
      organizationId: equipment.organizationId,
      customerId: equipment.customerId,
      trackingUnit: equipment.trackingUnit,
      currentReading: equipment.currentReading,
      operatingStatus: equipment.operatingStatus,
    })
    .from(equipment)
    .where(eq(equipment.id, equipmentId))
    .limit(1);

  return rows[0] ?? null;
}

type EquipmentRecord = NonNullable<Awaited<ReturnType<typeof getEquipmentRecord>>>;

async function createTask(
  tx: DbExecutor,
  params: {
    equipment: EquipmentRecord;
    type: "defect" | "breakdown";
    description: string;
    operatorName: string;
    operatorPhone?: string | null;
    equipmentReading: number;
  }
) {
  const [task] = await tx
    .insert(tasks)
    .values({
      organizationId: params.equipment.organizationId,
      equipmentId: params.equipment.id,
      customerId: params.equipment.customerId,
      type: params.type,
      status: "created",
      description: params.description,
      reportedByName: params.operatorName,
      reportedByPhone: params.operatorPhone,
      equipmentReadingAtReport: params.equipmentReading,
    })
    .returning({ id: tasks.id });

  if (params.type === "breakdown" && params.equipment.operatingStatus !== "down") {
    await tx
      .update(equipment)
      .set({ operatingStatus: "down", updatedAt: new Date() })
      .where(eq(equipment.id, params.equipment.id));
  }

  return task?.id ?? null;
}

async function rememberOperator(name: string, phone?: string) {
  if (!name) return;
  const cookieStore = await cookies();
  cookieStore.set(OPERATOR_COOKIE_NAME, JSON.stringify({ name, phone: phone ?? "" }), {
    path: "/",
    maxAge: OPERATOR_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}

function redirectWithStatus(path: string, status: string, message: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("status", status);
  if (message) {
    searchParams.set("message", message);
  }
  redirect(`${path}?${searchParams.toString()}`);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
