"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatSearchContextType {
  useSearch: boolean;
  setUseSearch: (useSearch: boolean) => void;
}

const ChatSearchContext = createContext<ChatSearchContextType | undefined>(
  undefined
);

export function ChatSearchProvider({ children }: { children: ReactNode }) {
  const [useSearch, setUseSearch] = useState(false);

  return (
    <ChatSearchContext.Provider value={{ useSearch, setUseSearch }}>
      {children}
    </ChatSearchContext.Provider>
  );
}

export function useChatSearch() {
  const context = useContext(ChatSearchContext);
  if (context === undefined) {
    throw new Error("useChatSearch must be used within a ChatSearchProvider");
  }
  return context;
}
