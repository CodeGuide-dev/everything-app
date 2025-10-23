"use client";

import { Card } from "@/components/ui/card";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface SourceCardProps {
  url: string;
  title: string;
  faviconUrl?: string | null;
  snippet?: string | null;
  className?: string;
}

export function SourceCard({ url, title, faviconUrl, snippet, className }: SourceCardProps) {
  const [faviconError, setFaviconError] = useState(false);

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block transition-all hover:scale-[1.02]",
        className
      )}
      aria-label={`Source: ${title}`}
    >
      <Card className="h-full p-3 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Favicon */}
          <div className="flex-shrink-0 mt-1">
            {faviconUrl && !faviconError ? (
              <img
                src={faviconUrl}
                alt=""
                className="size-5 rounded-sm"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <GlobeIcon className="size-5 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <ExternalLinkIcon className="size-3 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {getDomain(url)}
            </p>

            {snippet && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {snippet}
              </p>
            )}
          </div>
        </div>
      </Card>
    </a>
  );
}

export interface SourceCardsGridProps {
  sources: Array<{
    id: string;
    url: string;
    title: string;
    faviconUrl?: string | null;
    snippet?: string | null;
  }>;
  className?: string;
}

export function SourceCardsGrid({ sources, className }: SourceCardsGridProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3",
        className
      )}
      role="list"
      aria-label="Search sources"
    >
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          url={source.url}
          title={source.title}
          faviconUrl={source.faviconUrl}
          snippet={source.snippet}
        />
      ))}
    </div>
  );
}
