"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { IconRobot } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export interface ModelConfig {
  id: string
  name: string
  provider: string
  description?: string
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model, best for complex tasks"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient for most tasks"
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Optimized for speed and performance"
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Fastest and most economical"
  }
]

interface ModelSelectorProps {
  value: string
  onValueChange: (value: string) => void
  variant?: "panel" | "compact" | "inline"
  className?: string
  triggerClassName?: string
}

export function ModelSelector({
  value,
  onValueChange,
  variant = "panel",
  className,
  triggerClassName,
}: ModelSelectorProps) {
  const selectedModel = React.useMemo(
    () => AVAILABLE_MODELS.find((model) => model.id === value),
    [value]
  )

  const providerLabel = React.useMemo(() => {
    if (!selectedModel?.provider) return undefined

    return selectedModel.provider
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  }, [selectedModel])

  const triggerClasses = cn(
    "w-full text-left transition focus:ring-2 focus:ring-ring/50",
    variant === "panel" &&
      "h-12 min-w-[220px] rounded-xl border border-border bg-background/80 px-4 shadow-sm",
    variant === "compact" &&
      "h-11 min-w-[200px] rounded-lg border border-border/80 bg-background px-4 shadow-sm",
    variant === "inline" &&
      "h-9 min-w-0 w-auto rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm shadow-none",
    triggerClassName
  )

  const triggerContent =
    variant === "inline" && selectedModel ? (
      <span className="flex items-center gap-1 truncate">
        <span className="truncate font-medium">{selectedModel.name}</span>
        {providerLabel && (
          <span className="text-xs text-muted-foreground">· {providerLabel}</span>
        )}
      </span>
    ) : (
      <SelectValue placeholder="Choose a model" />
    )

  const selectControl = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClasses}>
        {triggerContent}
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem
            key={model.id}
            value={model.id}
            className="rounded-lg py-2 text-left transition data-[state=checked]:bg-primary/10 data-[state=checked]:text-foreground"
          >
            <span className="flex flex-col text-left">
              <span className="font-medium">{model.name}</span>
              {model.description && (
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (variant === "inline") {
    return <div className={cn("w-auto", className)}>{selectControl}</div>
  }

  if (variant === "compact") {
    return <div className={cn("w-full sm:w-auto", className)}>{selectControl}</div>
  }

  return (
    <div className={cn("border-b bg-muted/40 px-6 py-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconRobot className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Model
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold leading-tight text-foreground">
                {selectedModel?.name ?? "Select a model"}
              </p>
              {selectedModel?.provider && (
                <Badge variant="outline" className="text-xs">
                  {selectedModel.provider}
                </Badge>
              )}
            </div>
            {selectedModel?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedModel.description}
              </p>
            )}
          </div>
        </div>
        {selectControl}
      </div>
    </div>
  )
}
