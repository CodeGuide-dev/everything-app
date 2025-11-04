"use client"

import { useState } from "react"
import { ChatHeader } from "./chat-header"
import { ChatModelProvider } from "./chat-model-context"
import { ChatPersistenceProvider } from "./chat-persistence-context"
import { ChatSearchProvider } from "./chat-search-context"
import { SessionHistorySidebar } from "@/components/session-history-sidebar"
import { useChatModel } from "./chat-model-context"

function ChatLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { sessionId, setSessionId } = useChatModel()

  return (
    <div className="flex flex-1 h-full min-h-0">
      <div className="flex flex-1 flex-col min-h-0">
        <ChatHeader sidebarOpen={sidebarOpen} onToggleSidebar={setSidebarOpen} />
        <div className="flex flex-1 flex-col min-h-0 h-full">{children}</div>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-80" : "w-12"
        } border-l bg-background`}
      >
        <SessionHistorySidebar
          currentSessionId={sessionId}
          onSessionChange={setSessionId}
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
        />
      </div>
    </div>
  )
}

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatModelProvider>
      <ChatSearchProvider>
        <ChatPersistenceProvider>
          <ChatLayoutContent>{children}</ChatLayoutContent>
        </ChatPersistenceProvider>
      </ChatSearchProvider>
    </ChatModelProvider>
  )
}
