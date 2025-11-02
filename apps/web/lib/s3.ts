import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

const DEFAULT_ENDPOINT = "http://localhost:9000";
const DEFAULT_REGION = "us-east-1";
const DEFAULT_BUCKET = "images";


// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || DEFAULT_ENDPOINT,
    region: process.env.MINIO_REGION || DEFAULT_REGION,
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin123",
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET || DEFAULT_BUCKET;

export interface UploadImageOptions {
    buffer: Buffer;
    filename: string;
    contentType: string;
}

export interface UploadImageResult {
    key: string;
    storageUrl: string;
}

/**
 * Upload an image buffer to MinIO
 * @param options - Upload options containing buffer, filename, and content type
 * @returns Promise with the public URL and object key
 */
export async function uploadImage(
    options: UploadImageOptions
): Promise<UploadImageResult> {
    const { buffer, filename, contentType } = options;

    try {
        const key = `generated/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            // Make the object publicly readable
            ACL: "public-read",
        });

        await s3Client.send(command);

        // Construct the public URL
        const endpoint = process.env.MINIO_ENDPOINT || DEFAULT_ENDPOINT;
        const storageUrl = `${endpoint.replace(/\/$/, "")}/${BUCKET_NAME}/${key}`;

        return {
            key,
            storageUrl,
        };
    } catch (error) {
        console.error("Error uploading image to MinIO:", error);
        throw new Error(
            `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

/**
 * Create the internal proxy URL clients can use to retrieve an image
 */
export function getImageProxyUrl(key: string): string {
    const encodedKey = key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return `/api/image/file/${encodedKey}`;
}

/**
 * Retrieve an image object from storage and convert it into a buffer
 */
export async function getImageObject(key: string): Promise<{
    buffer: Buffer;
    contentType: string;
    contentLength?: number;
}> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            throw new Error("Image object returned an empty body");
        }

        const buffer = await streamBodyToBuffer(response.Body);

        return {
            buffer,
            contentType: response.ContentType || "application/octet-stream",
            contentLength: typeof response.ContentLength === "number" ? response.ContentLength : undefined,
        };
    } catch (error) {
        console.error("Error retrieving image from MinIO:", error);
        throw error;
    }
}

async function streamBodyToBuffer(body: unknown): Promise<Buffer> {
    if (!body) {
        throw new Error("Cannot convert empty body to buffer");
    }

    if (body instanceof Uint8Array) {
        return Buffer.from(body);
    }

    if (typeof body === "string") {
        return Buffer.from(body, "utf-8");
    }

    if (hasTransformToByteArray(body)) {
        const byteArray = await body.transformToByteArray();
        return Buffer.from(byteArray);
    }

    if (hasArrayBuffer(body)) {
        const arrBuffer = await body.arrayBuffer();
        return Buffer.from(arrBuffer);
    }

    if (isReadableStream(body)) {
        const readable = body;
        const chunks: Buffer[] = [];

        for await (const chunk of readable) {
            if (typeof chunk === "string") {
                chunks.push(Buffer.from(chunk));
            } else if (chunk instanceof Uint8Array) {
                chunks.push(Buffer.from(chunk));
            } else {
                chunks.push(Buffer.from(String(chunk)));
            }
        }

        return Buffer.concat(chunks);
    }

    throw new Error("Unsupported body type returned from storage");
}

function isReadableStream(value: unknown): value is Readable {
    return value instanceof Readable;
}

interface HasTransformToByteArray {
    transformToByteArray: () => Promise<Uint8Array>;
}

function hasTransformToByteArray(value: unknown): value is HasTransformToByteArray {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as HasTransformToByteArray).transformToByteArray === "function"
    );
}

interface HasArrayBuffer {
    arrayBuffer: () => Promise<ArrayBuffer>;
}

function hasArrayBuffer(value: unknown): value is HasArrayBuffer {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as HasArrayBuffer).arrayBuffer === "function"
    );
}

/**
 * Generate a unique filename for an image
 * @param extension - File extension (e.g., 'png', 'jpg')
 * @returns A unique filename
 */
export function generateImageFilename(extension: string = "png"): string {
    return `${crypto.randomUUID()}.${extension}`;
}
