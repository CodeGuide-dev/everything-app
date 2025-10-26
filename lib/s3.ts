import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    region: process.env.MINIO_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin123",
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "images";

export interface UploadImageOptions {
    buffer: Buffer;
    filename: string;
    contentType: string;
}

export interface UploadImageResult {
    url: string;
    key: string;
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
        const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
        const publicUrl = `${endpoint}/${BUCKET_NAME}/${key}`;

        return {
            url: publicUrl,
            key,
        };
    } catch (error) {
        console.error("Error uploading image to MinIO:", error);
        throw new Error(
            `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

/**
 * Generate a unique filename for an image
 * @param extension - File extension (e.g., 'png', 'jpg')
 * @returns A unique filename
 */
export function generateImageFilename(extension: string = "png"): string {
    return `${crypto.randomUUID()}.${extension}`;
}
