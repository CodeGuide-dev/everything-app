"use client";

import { useState } from "react";
import { ImageChat, type ImageGenerationResult } from "@/components/image-generation/image-chat";
import { ImageDisplay } from "@/components/image-generation/image-display";
import { toast } from "sonner";

export default function ImageGenerationPage() {
    const [currentImage, setCurrentImage] = useState<ImageGenerationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageGenerated = (result: ImageGenerationResult) => {
        setCurrentImage(result);
        setIsGenerating(false);
        setError(null);
        toast.success("Image generated successfully!");
    };

    const handleError = (errorMessage: string) => {
        setError(errorMessage);
        setIsGenerating(false);
        toast.error(errorMessage);
    };

    const handleGenerationStart = () => {
        setIsGenerating(true);
        setError(null);
    };

    return (
        <div className="container mx-auto p-6 h-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">AI Image Generation</h1>
                <p className="text-muted-foreground mt-2">
                    Create stunning images using AI. Describe what you want to see, and let AI bring it to life.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                {/* Left Panel - Image Chat */}
                <div className="flex flex-col">
                    <ImageChat
                        onImageGenerated={handleImageGenerated}
                        onError={handleError}
                    />
                </div>

                {/* Right Panel - Image Display */}
                <div className="flex flex-col">
                    <ImageDisplay
                        image={currentImage}
                        isLoading={isGenerating}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}
