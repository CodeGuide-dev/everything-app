"use client"

import { ChatHeader } from "./chat-header"
import { ChatModelProvider } from "./chat-model-context"
import { ChatPersistenceProvider } from "./chat-persistence-context"
import { ChatSearchProvider } from "./chat-search-context"

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatModelProvider>
      <ChatSearchProvider>
        <ChatPersistenceProvider>
          <ChatHeader />
          <div className="flex flex-1 flex-col min-h-0 h-full">{children}</div>
        </ChatPersistenceProvider>
      </ChatSearchProvider>
    </ChatModelProvider>
  )
}
