"use client"

import { ChatHeader } from "./chat-header"
import { ChatModelProvider } from "./chat-model-context"
import { ChatPersistenceProvider } from "./chat-persistence-context"

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatModelProvider>
      <ChatPersistenceProvider>
        <ChatHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </ChatPersistenceProvider>
    </ChatModelProvider>
  )
}
