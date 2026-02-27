import { Buffer } from "node:buffer";

import QRCode from "qrcode";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!APP_URL) {
  console.warn(
    "NEXT_PUBLIC_APP_URL is not set. QR code generation will fall back to http://localhost:3000."
  );
}

const baseAppUrl = (APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export type EquipmentQrPayload = {
  equipmentId: string;
  targetUrl: string;
  dataUrl: string;
  pngBuffer: Buffer;
};

export async function generateEquipmentQr(
  equipmentId: string
): Promise<EquipmentQrPayload> {
  if (!equipmentId) {
    throw new Error("Equipment ID is required for QR generation.");
  }

  const targetUrl = `${baseAppUrl}/qr/${equipmentId}`;
  const qrOptions = {
    errorCorrectionLevel: "M" as const,
    margin: 1,
    scale: 6,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  } as const;

  const [dataUrl, pngBuffer] = await Promise.all([
    QRCode.toDataURL(targetUrl, qrOptions),
    QRCode.toBuffer(targetUrl, qrOptions),
  ]);

  return {
    equipmentId,
    targetUrl,
    dataUrl,
    pngBuffer,
  };
}
