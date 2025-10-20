"use client"

import { ChatHeader } from "./chat-header"
import { ChatModelProvider } from "./chat-model-context"

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatModelProvider>
      <ChatHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </ChatModelProvider>
  )
}
