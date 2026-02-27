import { randomUUID } from "crypto";
import { createServiceClient } from "./service";

export type StorageUploadResult = {
  path: string;
  url: string;
};

export type StorageUploadParams = {
  bucket: string;
  file: File;
  folder?: string;
  maxSizeBytes?: number;
};

export const storageBuckets = {
  qrMedia: process.env.SUPABASE_QR_MEDIA_BUCKET ?? "qr-reports",
  prestartMedia: process.env.SUPABASE_PRESTART_MEDIA_BUCKET ?? "prestart-checks",
};

export async function uploadFileToStorage({
  bucket,
  file,
  folder,
  maxSizeBytes,
}: StorageUploadParams): Promise<StorageUploadResult> {
  if (!bucket) {
    throw new Error("Supabase bucket is required for uploads");
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid file provided for upload");
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new Error(
      `File ${file.name || "unknown"} exceeds the allowed size of ${Math.round(maxSizeBytes / (1024 * 1024))}MB`
    );
  }

  const client = createServiceClient();
  const extension = extractExtension(file.name);
  const keyParts = [folder?.replace(/^\/+|\/+$/g, ""), `${randomUUID()}${extension}`].filter(Boolean);
  const objectKey = keyParts.join("/");

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await client.storage.from(bucket).upload(objectKey, arrayBuffer, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(objectKey);

  return { path: objectKey, url: publicUrl };
}

function extractExtension(fileName?: string | null) {
  if (!fileName || !fileName.includes(".")) {
    return "";
  }

  return `.${fileName.split(".").pop()!.toLowerCase()}`;
}
