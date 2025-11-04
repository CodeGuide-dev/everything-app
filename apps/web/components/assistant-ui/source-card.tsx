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

export function SourceCard({ url, title, faviconUrl, className }: SourceCardProps) {
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
        "group block flex-shrink-0",
        className
      )}
      aria-label={`Source: ${title}`}
    >
      <Card className="h-full px-3 py-2 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
        <div className="flex items-center gap-2">
          {/* Favicon */}
          <div className="flex-shrink-0">
            {faviconUrl && !faviconError ? (
              <img
                src={faviconUrl}
                alt=""
                className="size-4 rounded-sm"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <GlobeIcon className="size-4 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {getDomain(url)}
            </p>
          </div>

          {/* External link icon */}
          <ExternalLinkIcon className="size-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        "flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30",
        className
      )}
      role="list"
      aria-label="Search sources"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
      }}
    >
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          url={source.url}
          title={source.title}
          faviconUrl={source.faviconUrl}
          className="w-[280px]"
        />
      ))}
    </div>
  );
}
