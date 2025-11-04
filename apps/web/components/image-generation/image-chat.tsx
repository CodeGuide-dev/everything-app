"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export interface ImageGenerationResult {
    id: string;
    url: string;
    prompt: string;
    createdAt: string;
    storageKey?: string;
    storageUrl?: string;
}

interface ImageChatProps {
    onImageGenerated: (result: ImageGenerationResult) => void;
    onError: (error: string) => void;
}

export function ImageChat({ onImageGenerated, onError }: ImageChatProps) {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!prompt.trim()) {
            onError("Please enter a prompt");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch("/api/image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: prompt.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate image");
            }

            if (data.success && data.image) {
                onImageGenerated(data.image);
                setPrompt(""); // Clear prompt after successful generation
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            console.error("Image generation error:", error);
            onError(
                error instanceof Error
                    ? error.message
                    : "Failed to generate image. Please try again."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Generate Image</CardTitle>
                <CardDescription>
                    Describe the image you want to create, and AI will generate it for you
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="prompt">Image Prompt</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Describe the image you want to generate... (e.g., 'A futuristic city at sunset with flying cars')"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={6}
                            disabled={isGenerating}
                            className="resize-none"
                        />
                        <p className="text-sm text-muted-foreground">
                            Be specific and descriptive for best results
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Image"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
