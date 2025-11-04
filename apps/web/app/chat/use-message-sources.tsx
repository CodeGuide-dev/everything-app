"use client";

import { useState, useEffect } from "react";

export interface MessageSource {
  id: string;
  url: string;
  title: string;
  faviconUrl?: string | null;
  snippet?: string | null;
}

// In-memory cache for message sources
const sourcesCache = new Map<string, MessageSource[]>();

export function useMessageSources(messageId?: string) {
  const [sources, setSources] = useState<MessageSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!messageId) {
      setSources([]);
      return;
    }

    // Check cache first
    const cached = sourcesCache.get(messageId);
    if (cached) {
      setSources(cached);
      return;
    }

    // Fetch from API
    const fetchSources = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chat/sources?messageId=${messageId}`);
        if (response.ok) {
          const data = await response.json();
          const fetchedSources = data.sources || [];
          sourcesCache.set(messageId, fetchedSources);
          setSources(fetchedSources);
        }
      } catch (error) {
        console.error("Failed to fetch sources:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSources();
  }, [messageId]);

  return { sources, isLoading };
}

// Function to pre-populate cache with sources from message load
export function cacheMessageSources(messageId: string, sources: MessageSource[]) {
  sourcesCache.set(messageId, sources);
}

// Function to clear the cache (useful when switching sessions)
export function clearSourcesCache() {
  sourcesCache.clear();
}
