import { uploadImage, getImageObject, getImageProxyUrl, generateImageFilename } from "@/lib/s3";

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || "images";

export type StorageProvider = "s3";

export interface PutImageOptions {
  buffer: Buffer;
  contentType: string;
  filename?: string;
  directory?: string;
}

export interface PutImageResult {
  key: string;
  bucket: string;
  provider: StorageProvider;
  url: string;
  storageUrl: string;
}

export async function putImage({
  buffer,
  contentType,
  filename,
  directory,
}: PutImageOptions): Promise<PutImageResult> {
  const extension = getExtensionFromMime(contentType) ?? "png";
  const safeFilename = filename ?? generateImageFilename(extension);
  const finalFilename = directory ? `${directory.replace(/\/+$/u, "")}/${safeFilename}` : safeFilename;

  const upload = await uploadImage({
    buffer,
    filename: finalFilename,
    contentType,
  });

  return {
    key: upload.key,
    bucket: DEFAULT_BUCKET,
    provider: "s3",
    url: getImageProxyUrl(upload.key),
    storageUrl: upload.storageUrl,
  };
}

export async function getImage(key: string) {
  return getImageObject(key);
}

export function getPublicUrl(key: string) {
  return getImageProxyUrl(key);
}

function getExtensionFromMime(mimeType: string | undefined | null) {
  if (!mimeType) return undefined;
  const [, subtype] = mimeType.split("/");
  return subtype?.split(";")[0];
}
