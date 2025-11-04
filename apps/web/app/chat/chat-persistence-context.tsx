"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface ChatPersistenceContextValue {
  currentSessionId: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
  selectedApiKeyId: string | null;
  setSelectedApiKeyId: (apiKeyId: string | null) => void;
}

const ChatPersistenceContext = createContext<ChatPersistenceContextValue | undefined>(
  undefined
);

export function ChatPersistenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);

  const value = {
    currentSessionId,
    setCurrentSessionId,
    selectedApiKeyId,
    setSelectedApiKeyId,
  };

  return (
    <ChatPersistenceContext.Provider value={value}>
      {children}
    </ChatPersistenceContext.Provider>
  );
}

export function useChatPersistence() {
  const context = useContext(ChatPersistenceContext);

  if (!context) {
    throw new Error("useChatPersistence must be used within a ChatPersistenceProvider");
  }

  return context;
}