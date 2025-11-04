"use client"

import { IconRobot } from "@tabler/icons-react"
import { ChevronLeft } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

import { useChatModel } from "./chat-model-context"

interface ChatHeaderProps {
  sidebarOpen?: boolean
  onToggleSidebar?: (open: boolean) => void
}

export function ChatHeader({ sidebarOpen = true, onToggleSidebar }: ChatHeaderProps) {
  const { selectedModelConfig } = useChatModel()

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
        {!sidebarOpen && onToggleSidebar && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleSidebar(true)}
            className="ml-auto gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            History
          </Button>
        )}
      </div>
    </header>
  )
}
