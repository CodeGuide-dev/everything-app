import { auth } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db, generatedImages, aiUsage } from "@/db";
import { uploadImage, generateImageFilename } from "@/lib/s3";
import { z } from "zod";

// Allow up to 60 seconds for image generation
export const maxDuration = 60;

// Schema for request validation
const imageGenerationSchema = z.object({
    prompt: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
    try {
        // Get session from better-auth
        const session = await auth.api.getSession({
            headers: request.headers
        });

        // Check if user is authenticated
        if (!session || !session.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = imageGenerationSchema.safeParse(body);

        if (!validation.success) {
            return new Response(
                JSON.stringify({ error: "Invalid prompt", details: validation.error.errors }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { prompt } = validation.data;

        // Check for Google API key
        const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!googleApiKey) {
            console.error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
            return new Response(
                JSON.stringify({ error: "Google AI API key not configured" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log('Generating image for prompt:', prompt);

        // Generate image using Google's Gemini model
        const model = google('gemini-2.5-flash-image-preview');
        const result = await generateText({
            model,
            prompt,
        });

        // Extract image files from the response
        const imageFiles = result.files?.filter((file) =>
            file.mediaType?.startsWith('image/')
        );

        if (!imageFiles || imageFiles.length === 0) {
            console.error("No images generated");
            return new Response(
                JSON.stringify({ error: "No images were generated" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Take the first generated image
        const imageFile = imageFiles[0];
        console.log('Generated image:', { mediaType: imageFile.mediaType });

        // Convert base64 data URL to buffer
        let imageBuffer: Buffer;
        try {
            // The image data is typically in base64 format
            if (typeof imageFile.data === 'string') {
                // Remove data URL prefix if present (e.g., "data:image/png;base64,")
                const base64Data = imageFile.data.includes(',')
                    ? imageFile.data.split(',')[1]
                    : imageFile.data;
                imageBuffer = Buffer.from(base64Data, 'base64');
            } else if (imageFile.data instanceof Buffer) {
                imageBuffer = imageFile.data;
            } else if (imageFile.data instanceof Uint8Array) {
                imageBuffer = Buffer.from(imageFile.data);
            } else {
                throw new Error("Unsupported image data format");
            }
        } catch (error) {
            console.error("Error converting image data:", error);
            return new Response(
                JSON.stringify({ error: "Failed to process image data" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Determine content type and extension
        const contentType = imageFile.mediaType || 'image/png';
        const extension = contentType.split('/')[1] || 'png';
        const filename = generateImageFilename(extension);

        // Upload to MinIO
        console.log('Uploading image to MinIO...');
        let uploadResult;
        try {
            uploadResult = await uploadImage({
                buffer: imageBuffer,
                filename,
                contentType,
            });
            console.log('Image uploaded successfully:', uploadResult.url);
        } catch (error) {
            console.error("Error uploading to MinIO:", error);
            return new Response(
                JSON.stringify({
                    error: "Failed to upload image to storage",
                    details: error instanceof Error ? error.message : "Unknown error"
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Save metadata to database
        const modelName = 'gemini-2.5-flash-image-preview';
        let savedImage;
        try {
            [savedImage] = await db.insert(generatedImages).values({
                userId: session.user.id,
                prompt,
                imageUrl: uploadResult.url,
                model: modelName,
            }).returning();
            console.log('Saved image metadata:', savedImage.id);
        } catch (error) {
            console.error("Error saving image metadata:", error);
            return new Response(
                JSON.stringify({ error: "Failed to save image metadata" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Log usage to ai_usage table
        try {
            await db.insert(aiUsage).values({
                userId: session.user.id,
                feature: 'image_generation',
                model: modelName,
                provider: 'google',
                promptTokens: null,
                completionTokens: null,
                totalTokens: null,
                requestCount: 1,
            });
            console.log('Logged AI usage');
        } catch (error) {
            console.error("Error logging usage:", error);
            // Don't fail the request if usage logging fails
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                image: {
                    id: savedImage.id,
                    url: uploadResult.url,
                    prompt,
                    createdAt: savedImage.createdAt,
                },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error('Image generation API error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                return new Response(
                    JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
                    { status: 429, headers: { "Content-Type": "application/json" } }
                );
            }
            if (error.message.includes('quota')) {
                return new Response(
                    JSON.stringify({ error: 'API quota exceeded. Please check your billing.' }),
                    { status: 402, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : "Unknown error"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
