"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  IconArrowUp,
  IconArrowUpBar,
  IconArrowUpCircle,
  IconBrandAppgallery,
  IconCheck,
  IconClock,
  IconLoader2,
  IconPhoto,
  IconRefresh,
  IconReservedLine,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface GenerationAsset {
  id: string;
  role: "input" | "mask" | "output";
  url: string;
  mimeType: string | null;
  createdAt: string;
}

interface GenerationRecord {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  provider: string;
  model: string;
  prompt: string | null;
  negativePrompt: string | null;
  params: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
  durationMs: number | null;
  parentGenerationId: string | null;
  sourceAssetId: string | null;
  maskAssetId: string | null;
  assets: GenerationAsset[];
}

interface SessionRecord {
  id: string;
  title: string | null;
  provider: string | null;
  model: string | null;
  updatedAt: string;
  createdAt: string;
}

interface SessionResponse {
  session: SessionRecord;
  generations: GenerationRecord[];
}

export default function ImageSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [sessionData, setSessionData] = useState<SessionResponse | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/sign-in");
      } else {
        void loadSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, isPending, params.sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/images/sessions/${params.sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Session not found");
        }
        throw new Error("Failed to load session");
      }

      const data = (await response.json()) as SessionResponse;
      setSessionData(data);
      setError(null);

      const latest = [...data.generations].reverse().find((gen) =>
        gen.status === "succeeded"
      ) || data.generations[data.generations.length - 1];

      if (latest) {
        setSelectedGenerationId(latest.id);
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Failed to load session";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGeneration = useMemo(() => {
    if (!sessionData?.generations?.length) return null;
    if (!selectedGenerationId) {
      return sessionData.generations[sessionData.generations.length - 1];
    }
    return sessionData.generations.find((gen) => gen.id === selectedGenerationId) ?? null;
  }, [sessionData, selectedGenerationId]);

  const selectedOutputAsset = useMemo(() => {
    return selectedGeneration?.assets.find((asset) => asset.role === "output") ?? null;
  }, [selectedGeneration]);

  const selectedStepNumber = useMemo(() => {
    if (!sessionData?.generations?.length || !selectedGeneration) return null;
    const idx = getGenerationIndex(sessionData.generations, selectedGeneration.id);
    return idx >= 0 ? idx + 1 : sessionData.generations.length;
  }, [sessionData, selectedGeneration]);

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      toast.error("Enter a prompt to iterate");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: params.sessionId,
          prompt: prompt.trim(),
          parentGenerationId: selectedGeneration?.id,
          sourceAssetId: selectedOutputAsset?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      const generation: GenerationRecord = {
        ...data.generation,
        assets: [
          {
            ...data.outputAsset,
            role: "output",
          },
        ],
      };

      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          session: data.session ?? prev.session,
          generations: [...prev.generations, generation],
        };
      });

      setPrompt("");
      setSelectedGenerationId(generation.id);
      toast.success("New variation generated");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:py-10">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-muted-foreground"
            onClick={() => router.push("/images")}
          >
            ← Back to sessions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadSession()}
          >
            <IconRefresh className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
        <h1 className="text-2xl font-semibold leading-tight">
          {sessionData?.session?.title || "Untitled session"}
        </h1>
        {sessionData?.session && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Updated {formatDistanceToNow(new Date(sessionData.session.updatedAt), { addSuffix: true })}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="uppercase">
              {(sessionData.session.provider ?? "google").toUpperCase()}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>{sessionData.session.model ?? "gemini-2.5-flash-image-preview"}</span>
          </div>
        )}
      </header>

      <Separator />

      {isLoading ? (
        <SessionSkeleton />
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      ) : !sessionData ? (
        <div className="rounded-xl border border-border px-6 py-10 text-center text-muted-foreground">
          Session not found.
        </div>
      ) : (
        <>
          <section className="flex max-w-2xl flex-col gap-6 mx-auto">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-lg">
            {selectedOutputAsset ? (
              <Image
                src={selectedOutputAsset.url}
                alt={selectedGeneration?.prompt ?? "Generated image"}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 50vw, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <IconPhoto className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {selectedGeneration && selectedStepNumber && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow">
                <IconReservedLine className="h-3.5 w-3.5" />
                Step {selectedStepNumber}
              </div>
            )}
          </div>

          {selectedGeneration && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IconClock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(selectedGeneration.createdAt), { addSuffix: true })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full uppercase">
                    {selectedGeneration.status}
                  </Badge>
                  {typeof selectedGeneration.durationMs === "number" && (
                    <Badge variant="outline" className="rounded-full">
                      {(selectedGeneration.durationMs / 1000).toFixed(1)}s
                    </Badge>
                  )}
                </div>
              </div>
              {selectedGeneration.prompt && (
                <div className="mt-3 space-y-1">
                  <p className="text-foreground text-sm">{selectedGeneration.prompt}</p>
                  {selectedGeneration.negativePrompt && (
                    <p className="text-xs text-muted-foreground">
                      Negative: {selectedGeneration.negativePrompt}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <Card className="space-y-4 rounded-3xl border border-border/60 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Prompt</h2>
              <p className="text-sm text-muted-foreground">
                The new prompt will build from the selected image. Use the history below to pick a different base.
              </p>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Refine the lighting to feel more cinematic and add subtle fog"
                rows={4}
                className="resize-none text-base"
                disabled={isGenerating}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                {selectedGeneration && selectedStepNumber && (
                  <span className="flex items-center gap-1">
                    <IconRotateClockwise className="h-3.5 w-3.5" />
                    Iterating from step {selectedStepNumber}
                  </span>
                )}
                <span>Cmd/Ctrl + Enter to submit</span>
              </div>
              <Button type="submit" className="h-11 w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <IconLoader2 className="h-5 w-5 animate-spin" />
                    Generating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IconArrowUp className="h-5 w-5" />
                    Generate next variation
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Session history</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {sessionData.generations.length} steps
              </span>
            </div>
            {sessionData.generations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
                No generations yet. Use the prompt above to create your first image.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sessionData.generations.map((generation, index) => {
                  const output = generation.assets.find((asset) => asset.role === "output");
                  const isActive = generation.id === selectedGeneration?.id;

                  return (
                    <button
                      key={generation.id}
                      type="button"
                      onClick={() => setSelectedGenerationId(generation.id)}
                      className={`group relative overflow-hidden rounded-2xl border ${isActive ? "border-primary shadow-lg" : "border-border/60"} bg-card text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                    >
                      {output ? (
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={output.url}
                            alt={generation.prompt ?? `Generation ${index + 1}`}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 90vw"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-muted">
                          <IconPhoto className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-2 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <span>Step {index + 1}</span>
                          {generation.status === "succeeded" ? (
                            <IconCheck className="h-3.5 w-3.5" />
                          ) : generation.status === "running" ? (
                            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-sm text-foreground/90">
                          {generation.prompt || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(generation.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function getGenerationIndex(list: GenerationRecord[], id: string) {
  return list.findIndex((item) => item.id === id);
}

function SessionSkeleton() {
  return (
    <section className="flex max-w-2xl flex-col gap-6 mx-auto">
      <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
      <div className="h-20 animate-pulse rounded-2xl bg-muted/30" />
      <div className="animate-pulse rounded-3xl border border-border/60 bg-muted/30 p-6">
        <div className="mb-4 h-4 w-1/4 rounded bg-muted" />
        <div className="space-y-3">
          <div className="h-10 rounded bg-muted" />
          <div className="h-20 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </div>
    </section>
  );
}
