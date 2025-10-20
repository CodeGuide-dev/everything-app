"use client"

import { createContext, useContext, useMemo, useState } from "react"

import { AVAILABLE_MODELS, type ModelConfig } from "@/components/model-selector"

interface ChatModelContextValue {
  selectedModel: string
  setSelectedModel: (modelId: string) => void
  selectedModelConfig?: ModelConfig
  sessionId: string | null
  setSessionId: (sessionId: string | null) => void
}

const ChatModelContext = createContext<ChatModelContextValue | undefined>(
  undefined
)

export function ChatModelProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini")
  const [sessionId, setSessionId] = useState<string | null>(null)

  const selectedModelConfig = useMemo(
    () => AVAILABLE_MODELS.find((model) => model.id === selectedModel),
    [selectedModel]
  )

  const value = useMemo(
    () => ({ selectedModel, setSelectedModel, selectedModelConfig, sessionId, setSessionId }),
    [selectedModel, selectedModelConfig, sessionId]
  )

  return (
    <ChatModelContext.Provider value={value}>
      {children}
    </ChatModelContext.Provider>
  )
}

export function useChatModel() {
  const context = useContext(ChatModelContext)

  if (!context) {
    throw new Error("useChatModel must be used within a ChatModelProvider")
  }

  return context
}
