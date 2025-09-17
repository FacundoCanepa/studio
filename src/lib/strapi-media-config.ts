'use server';

// --- Environment Variables & Validation ---
export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
export const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_URL) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_STRAPI_URL');
}

// At build time, the token might not be available, so we just warn.
if (!STRAPI_API_TOKEN) {
  console.warn('[MEDIA WARNING] STRAPI_API_TOKEN is not set. Media operations will likely fail if this is not a build-time warning.');
}

// --- Configuration Constants ---
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

// --- Types ---
export type UploadResult = {
  id: number;
  url: string;
  name: string;
  size: number;
};

export type StrapiAsset = {
  id: number;
  url: string;
  name: string;
  size: number; // size in kilobytes
};

// --- Helper Functions ---
export function isValidMime(file: File): boolean {
  return ACCEPTED_MIME.includes(file.type as any);
}

export function isValidSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function validateImage(file: File): { ok: boolean; error?: string } {
  if (!isValidMime(file)) {
    return { ok: false, error: `Formato de archivo no permitido. Aceptados: ${ACCEPTED_MIME.join(', ')}` };
  }
  if (!isValidSize(file)) {
    return { ok: false, error: `La imagen supera el tamaño máximo de 3MB.` };
  }
  return { ok: true };
}

export function warn(msg: string): void {
  console.warn("[MEDIA WARNING]", msg);
}
