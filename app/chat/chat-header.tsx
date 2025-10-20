"use client"

import { IconRobot } from "@tabler/icons-react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChatSessionManager } from "@/components/chat-session-manager"

import { useChatModel } from "./chat-model-context"

export function ChatHeader() {
  const { selectedModelConfig, sessionId, setSessionId } = useChatModel()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-4 px-4 lg:gap-6 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 hidden h-8 md:flex"
        />
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconRobot className="h-5 w-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="text-base font-semibold leading-tight">Chat</h1>
            {selectedModelConfig?.name && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                Currently using {selectedModelConfig.name}
              </p>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <ChatSessionManager
            currentSessionId={sessionId}
            onSessionChange={setSessionId}
          />
        </div>
      </div>
    </header>
  )
}
