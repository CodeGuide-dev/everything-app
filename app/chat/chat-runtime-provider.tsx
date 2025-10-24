"use client";

import { ThreadMessageLike, AppendMessage } from "@assistant-ui/react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useChatModel } from "./chat-model-context";
import { useChatSearch } from "./chat-search-context";
import { cacheMessageSources, clearSourcesCache } from "./use-message-sources";

const convertMessage = (message: ThreadMessageLike) => {
  return message;
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: Array<{
    id: string;
    url: string;
    title: string;
    faviconUrl?: string | null;
    snippet?: string | null;
  }>;
}

// Extend ThreadMessageLike to include messageId for tracking
interface ExtendedThreadMessage extends ThreadMessageLike {
  messageId?: string;
}

export function ChatRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { selectedModel, sessionId, setSessionId } = useChatModel();
  const { useSearch } = useChatSearch();
  const [messages, setMessages] = useState<readonly ExtendedThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  // Load messages when sessionId changes (but only if it's different from what we already loaded)
  useEffect(() => {
    if (!sessionId) {
      console.log("Starting new chat, clearing messages");
      setMessages([]);
      setLoadedSessionId(null);
      clearSourcesCache();
      return;
    }

    // Don't reload if we already have this session loaded
    if (sessionId === loadedSessionId) {
      console.log("Session already loaded, skipping:", sessionId);
      return;
    }

    console.log("Loading session:", sessionId);

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const loadedMessages: ExtendedThreadMessage[] = data.messages.map(
            (msg: ChatMessage) => {
              // Cache sources for this message if available
              if (msg.sources && msg.sources.length > 0) {
                cacheMessageSources(msg.id, msg.sources);
              }

              return {
                role: msg.role,
                content: [{ type: "text" as const, text: msg.content }],
                messageId: msg.id,
              };
            }
          );
          setMessages(loadedMessages);
          setLoadedSessionId(sessionId);
          console.log("Loaded messages from database:", loadedMessages.length);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, loadedSessionId]);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (message.content.length !== 1 || message.content[0]?.type !== "text") {
        throw new Error("Only text content is supported");
      }

      const userMessage: ThreadMessageLike = {
        role: "user",
        content: [{ type: "text", text: message.content[0].text }],
      };

      console.log("Adding user message:", userMessage);

      // Add user message and get the updated messages array
      let updatedMessages: ThreadMessageLike[] = [];
      setMessages((currentMessages) => {
        updatedMessages = [...currentMessages, userMessage];
        console.log("Updated messages count:", updatedMessages.length);
        return updatedMessages;
      });

      try {
        // Send message to API using the updated messages
        console.log("Sending to API with", updatedMessages.length, "messages", useSearch ? "(with search)" : "");
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages,
            sessionId: sessionId,
            aiModel: selectedModel,
            useSearch: useSearch,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        // Capture session ID from response headers
        const newSessionId = response.headers.get("X-Session-ID");
        if (newSessionId && newSessionId !== sessionId) {
          console.log("Captured new session ID:", newSessionId);
          setSessionId(newSessionId);
          // Mark this session as already loaded to prevent reloading from database
          setLoadedSessionId(newSessionId);
        }

        // Read the streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let buffer = "";

        if (reader) {
          // Add initial empty assistant message
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              role: "assistant",
              content: [{ type: "text", text: "" }],
            },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;

              console.log("Stream line:", line);

              // Handle "data: " prefixed lines from AI SDK stream
              if (line.startsWith("data: ")) {
                const jsonStr = line.substring(6); // Remove "data: " prefix

                // Skip [DONE] message
                if (jsonStr === "[DONE]") {
                  console.log("Stream finished");
                  continue;
                }

                try {
                  const data = JSON.parse(jsonStr);
                  console.log("Parsed stream data:", data);

                  // Handle text-delta events with "delta" field
                  if (data.type === "text-delta" && data.delta) {
                    assistantText += data.delta;
                    console.log("Updated assistant text length:", assistantText.length);

                    // Update the last assistant message
                    setMessages((currentMessages) => [
                      ...currentMessages.slice(0, -1),
                      {
                        role: "assistant",
                        content: [{ type: "text", text: assistantText }],
                      },
                    ]);
                  }
                } catch (e) {
                  console.error("Parse error:", e, "for line:", jsonStr);
                }
              }
            }
          }

          console.log("Streaming complete. Final text:", assistantText);

          // Fetch the latest message from the database to get its messageId and sources
          const currentSessionId = newSessionId || sessionId;
          if (currentSessionId) {
            try {
              console.log("Fetching latest messages to attach messageId and sources");
              const messagesResponse = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`);
              if (messagesResponse.ok) {
                const data = await messagesResponse.json();
                const dbMessages = data.messages as ChatMessage[];

                // Find the last assistant message in the database
                const lastAssistantMessage = [...dbMessages]
                  .reverse()
                  .find((m: ChatMessage) => m.role === "assistant");

                if (lastAssistantMessage) {
                  console.log("Found last assistant message:", lastAssistantMessage.id);

                  // Cache sources if available
                  if (lastAssistantMessage.sources && lastAssistantMessage.sources.length > 0) {
                    console.log("Caching sources:", lastAssistantMessage.sources.length);
                    cacheMessageSources(lastAssistantMessage.id, lastAssistantMessage.sources);
                  }

                  // Update the last assistant message in local state with the messageId
                  setMessages((currentMessages) => {
                    // Find the last assistant message in the local state
                    let lastAssistantIndex = -1;
                    for (let i = currentMessages.length - 1; i >= 0; i--) {
                      if (currentMessages[i].role === "assistant") {
                        lastAssistantIndex = i;
                        break;
                      }
                    }

                    if (lastAssistantIndex === -1) {
                      console.warn("Could not find last assistant message in local state");
                      return currentMessages;
                    }

                    // Create a new array with the updated message
                    const updatedMessages = [...currentMessages];
                    updatedMessages[lastAssistantIndex] = {
                      ...updatedMessages[lastAssistantIndex],
                      messageId: lastAssistantMessage.id,
                    } as ExtendedThreadMessage;

                    console.log("Attached messageId to last assistant message:", lastAssistantMessage.id);
                    return updatedMessages;
                  });
                }
              }
            } catch (error) {
              console.error("Failed to fetch latest messages for messageId:", error);
            }
          }
        }
      } catch (error) {
        console.error("Chat API error:", error);
        // Add error message
        const errorMessage: ThreadMessageLike = {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Sorry, there was an error processing your request.",
            },
          ],
        };
        setMessages((currentMessages) => [...currentMessages, errorMessage]);
      }
    },
    [sessionId, selectedModel, setSessionId, useSearch]
  );

  const runtime = useExternalStoreRuntime<ThreadMessageLike>({
    messages,
    setMessages,
    onNew,
    convertMessage,
    isRunning: isLoading,
  });

  // Debug: Log messages changes
  useEffect(() => {
    console.log("Messages state updated:", messages.length, "messages");
    messages.forEach((msg, idx) => {
      console.log(`  [${idx}] ${msg.role}:`, msg.content[0]);
    });
  }, [messages]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
