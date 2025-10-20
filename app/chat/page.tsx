"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
import { useEffect } from "react"
import { Thread } from "@/components/assistant-ui/thread"
import { Card } from "@/components/ui/card"
import { ChatRuntimeProvider } from "./chat-runtime-provider"

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace('/sign-in')
    }
  }, [router, session, isPending])

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
    <div className="@container/main flex flex-1 flex-col min-h-0 w-full">
      <div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6 min-h-0 w-full">
        <Card className="flex flex-1 min-h-0 w-full overflow-hidden p-0">
          <ChatRuntimeProvider>
            <div className="flex flex-1 min-h-0 w-full">
              <Thread />
            </div>
          </ChatRuntimeProvider>
        </Card>
      </div>
    </div>
  )
}
