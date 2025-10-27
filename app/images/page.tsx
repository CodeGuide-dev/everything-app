"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { IconLoader2, IconPhoto, IconPhotoPlus, IconSettings } from "@tabler/icons-react";
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
        throw new Error(data.error || "Failed to start generation");
      }

      const data = await response.json();
      const sessionId = data?.session?.id;

      toast.success("Session created — generating image");

      if (sessionId) {
        router.push(`/images/${sessionId}`);
      } else {
        await fetchSessions();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start generation",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              <form className="relative" onSubmit={handleSubmit}>
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
                />
                <div className="pointer-events-none absolute inset-x-6 bottom-4 flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="pointer-events-auto h-10 w-10"
                        disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <IconLoader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <IconPhotoPlus className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
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
