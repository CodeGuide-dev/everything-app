"use client"

import { useChat } from "@ai-sdk/react"
import { useSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconSend, IconUser, IconRobot, IconLoader2 } from "@tabler/icons-react"
import { useEffect, useRef } from "react"

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      redirect('/sign-in')
    }
  }, [session, isPending])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/chat',
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full">
        <div className="px-4 lg:px-6">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <IconRobot className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea 
                className="flex-1 px-6" 
                ref={scrollRef}
              >
                <div className="space-y-4 py-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <IconRobot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with the AI assistant.</p>
                      <p className="text-sm">Ask me anything!</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconRobot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <IconUser className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconRobot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-1">
                          <IconLoader2 className="h-3 w-3 animate-spin" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Error Display */}
              {error && (
                <div className="px-6 py-2">
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-3 py-2">
                    Error: {error.message}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t p-6">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    size="icon"
                  >
                    {isLoading ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconSend className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <div className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}