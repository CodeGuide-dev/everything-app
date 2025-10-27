"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { ImageGenerationResult } from "./image-chat";

interface ImageDisplayProps {
    image: ImageGenerationResult | null;
    isLoading: boolean;
    error: string | null;
}

export function ImageDisplay({ image, isLoading, error }: ImageDisplayProps) {
    const handleDownload = () => {
        if (!image) return;

        // Create a temporary link element to download the image
        const link = document.createElement("a");
        link.href = image.url;
        link.download = `generated-image-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle>Generated Image</CardTitle>
                <CardDescription>
                    Your AI-generated image will appear here
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                )}

                {!isLoading && !error && image && (
                    <div className="space-y-4">
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted">
                            <Image
                                src={image.url}
                                alt={image.prompt}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                        <div className="space-y-2">
                            <div>
                                <h3 className="font-semibold text-sm mb-1">Prompt:</h3>
                                <p className="text-sm text-muted-foreground">{image.prompt}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Generated on {new Date(image.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <Button
                                onClick={handleDownload}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Image
                            </Button>
                        </div>
                    </div>
                )}

                {!isLoading && !error && !image && (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <p className="text-center">
                            No image yet. Enter a prompt and click Generate to create an image.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
