"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { IconLoader2, IconPhoto, IconPhotoPlus, IconSettings, IconHistory } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SessionThumbnail {
  id: string;
  url: string;
  storageKey: string;
  mimeType: string | null;
}

interface SessionSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  provider: string | null;
  model: string | null;
  thumbnail: SessionThumbnail | null;
}

const DEFAULT_MODEL = "gemini-2.5-flash-image-preview";
const DEFAULT_PROVIDER = "google";

export default function ImagesLandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/sign-in");
      } else {
        void fetchSessions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, isPending]);

  // Load prompt history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("image-prompt-history");
      if (saved) {
        setPromptHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load prompt history:", error);
    }
  }, []);

  // Save prompt history to localStorage when it changes
  useEffect(() => {
    try {
      if (promptHistory.length > 0) {
        localStorage.setItem("image-prompt-history", JSON.stringify(promptHistory));
      }
    } catch (error) {
      console.error("Failed to save prompt history:", error);
    }
  }, [promptHistory]);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch("/api/images/sessions");

      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }

      const data = (await response.json()) as { sessions: SessionSummary[] };
      setSessions(data.sessions ?? []);
      setLoadingError(null);
    } catch (error) {
      console.error(error);
      setLoadingError(
        error instanceof Error ? error.message : "Failed to load sessions",
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setIsSubmitting(true);
      setGenerationError(null);
      setGeneratedImageUrl(null);

      const payload = {
        provider,
        model,
        prompt: prompt.trim(),
      };

      const response = await fetch("/api/images/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate image");
      }

      const data = await response.json();

      if (data.outputAsset?.url) {
        setGeneratedImageUrl(data.outputAsset.url);
        toast.success("Image generated successfully!");
        await fetchSessions(); // Refresh the sessions list

        // Save prompt to history (avoid duplicates and keep last 10)
        const trimmedPrompt = prompt.trim();
        setPromptHistory(prev => {
          const filtered = prev.filter(p => p !== trimmedPrompt);
          return [trimmedPrompt, ...filtered].slice(0, 10);
        });
      } else if (data.session?.id) {
        // Fallback: if no direct image was generated, navigate to session
        toast.success("Session created — generating image");
        router.push(`/images/${data.session.id}`);
      } else {
        throw new Error("No image was generated");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      setGenerationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectHistoryPrompt = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    setShowHistory(false);
  };

  const recentSessions = useMemo(
    () => sessions.slice(0, 12),
    [sessions],
  );

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

  const providerLabel = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : "Configured";

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
        <div className="flex w-full items-center gap-4 px-4 lg:gap-6 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 hidden h-8 md:flex" />
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconPhoto className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <h1 className="text-base font-semibold leading-tight">Image Studio</h1>
              <p className="text-sm text-muted-foreground line-clamp-1">
                Using {providerLabel}
                {model ? ` • ${model}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:py-12 lg:py-16">
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Image Studio
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Start from a prompt
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Describe what you want to see; we’ll handle the rest.
              </p>
            </div>

            <div className="w-full max-w-3xl">
              <form className="relative" onSubmit={handleSubmit} noValidate>
                <Label className="sr-only" htmlFor="prompt">
                  Describe your image
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="An isometric illustration of a cozy reading nook with warm lighting and indoor plants"
                  rows={8}
                  className="resize-none text-base pr-28 pb-20"
                  disabled={isSubmitting}
                  aria-describedby="prompt-description"
                  aria-invalid={!!generationError}
                  required
                  minLength={1}
                />
                <div className="pointer-events-none absolute inset-x-6 bottom-4 flex items-center justify-end gap-2">
                  {promptHistory.length > 0 && (
                    <Popover open={showHistory} onOpenChange={setShowHistory}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="pointer-events-auto h-10 w-10"
                          disabled={isSubmitting}
                          aria-label="Show prompt history"
                          title="Show prompt history"
                        >
                          <IconHistory className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4">
                          <h4 className="font-medium mb-2">Recent Prompts</h4>
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {promptHistory.map((historyPrompt, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleSelectHistoryPrompt(historyPrompt)}
                                className="w-full text-left p-2 rounded-md hover:bg-muted text-sm truncate focus:outline-none focus:ring-2 focus:ring-primary focus-visible:ring-primary"
                                title={historyPrompt}
                              >
                                {historyPrompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="pointer-events-auto h-10 w-10"
                        disabled={isSubmitting}
                        aria-label="Generation settings"
                        title="Generation settings"
                      >
                        <IconSettings className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Generation settings</DialogTitle>
                        <DialogDescription>
                          Choose the provider and model that will power new image sessions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="grid gap-2">
                          <Label htmlFor="provider">Provider</Label>
                          <Select
                            value={provider}
                            onValueChange={setProvider}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger id="provider">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="google">Google</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="model">Model</Label>
                          <Select
                            value={model}
                            onValueChange={setModel}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger id="model">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini-2.5-flash-image-preview">
                                Gemini 2.5 Flash (Preview)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="submit"
                    size="icon"
                    className="pointer-events-auto h-10 w-10"
                    disabled={isSubmitting || !prompt.trim()}
                    aria-label={isSubmitting ? "Generating image" : "Generate image"}
                    title={isSubmitting ? "Generating image..." : "Generate image"}
                  >
                    {isSubmitting ? (
                      <IconLoader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <IconPhotoPlus className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>

              {/* Screen reader announcements */}
              <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isSubmitting && "Generating image, please wait..."}
                {generatedImageUrl && "Image generated successfully."}
                {generationError && `Image generation failed: ${generationError}`}
              </div>
            </div>

            {/* Generated Image Display Section */}
            {(isSubmitting || generatedImageUrl || generationError) && (
              <div className="w-full max-w-3xl">
                {isSubmitting && (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-12" role="status" aria-live="polite">
                    <IconLoader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Generating image...</h3>
                      <p className="text-sm text-muted-foreground">
                        This may take a few moments. Please don't close this page.
                      </p>
                    </div>
                  </div>
                )}

                {generatedImageUrl && (
                  <div className="space-y-4" role="region" aria-label="Generated image result">
                    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg">
                      <div className="relative aspect-video">
                        <Image
                          src={generatedImageUrl}
                          alt="Generated image from your prompt"
                          fill
                          className="object-contain"
                          sizes="(max-width: 1024px) 100vw, 1024px"
                          priority
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setGeneratedImageUrl(null);
                          setGenerationError(null);
                        }}
                        variant="outline"
                        size="sm"
                        aria-label="Generate another image"
                      >
                        Generate Another Image
                      </Button>
                    </div>
                  </div>
                )}

                {generationError && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-center" role="alert" aria-live="assertive">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-destructive">Generation Failed</h3>
                      <p className="text-sm text-destructive/80">{generationError}</p>
                      <Button
                        onClick={() => setGenerationError(null)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        aria-label="Try generating image again"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Previous sessions</h2>
                <p className="text-sm text-muted-foreground">
                  Resume where you left off and iterate on any output.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void fetchSessions()}>
                Refresh
              </Button>
            </div>

            {loadingSessions ? (
              <SessionsSkeleton />
            ) : loadingError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
                {loadingError}
              </div>
            ) : recentSessions.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {recentSessions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/images/${item.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-md transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {item.thumbnail ? (
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <Image
                          src={item.thumbnail.url}
                          alt={item.title ?? "Session thumbnail"}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 90vw"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-muted">
                        <IconPhotoPlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="space-y-1 px-5 py-4">
                      <h3 className="font-semibold text-foreground">
                        {item.title || "Untitled session"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                      </p>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <span>{(item.provider || provider).toUpperCase()}</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{item.model || model}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
        >
          <div className="aspect-video bg-muted" />
          <div className="space-y-3 px-5 py-4">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconPhotoPlus className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">No sessions yet</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your generated images will show up here. Start a new session above to begin iterating.
        </p>
      </div>
    </div>
  );
}
