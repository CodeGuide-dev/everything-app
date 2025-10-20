"use client"

import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
import { useEffect, useMemo } from "react"
import { DefaultChatTransport } from "ai"
import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
import { Thread } from "@/components/assistant-ui/thread"
import { VisionImageAdapter } from "@/lib/attachment-adapter"
import { Card } from "@/components/ui/card"

import { useChatModel } from "./chat-model-context"

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const { selectedModel } = useChatModel()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      redirect('/sign-in')
    }
  }, [session, isPending])

  const attachmentAdapter = useMemo(() => new VisionImageAdapter(), [])

  const runtime = useChatRuntime({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: {
        'X-Model': selectedModel,
      },
    }),
    adapters: {
      attachments: attachmentAdapter,
    },
  })

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!session?.user) {
    return null
  }

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
        <Card className="flex flex-1 overflow-hidden p-0">
          <AssistantRuntimeProvider runtime={runtime}>
            <Thread />
          </AssistantRuntimeProvider>
        </Card>
      </div>
    </div>
  )
}
