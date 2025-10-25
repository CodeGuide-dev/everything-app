"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, MessageCircle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: Date | null;
}

interface SessionHistorySidebarProps {
  currentSessionId: string | null;
  onSessionChange: (sessionId: string | null) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function SessionHistorySidebar({
  currentSessionId,
  onSessionChange,
  isOpen,
  onToggle,
}: SessionHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, searchQuery]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat/sessions?limit=100");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    onSessionChange(null);
    setSearchQuery("");
  };

  const handleSelectSession = (sessionId: string) => {
    onSessionChange(sessionId);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Chat session deleted");
      setSessions(sessions.filter((s) => s.id !== sessionId));

      if (sessionId === currentSessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden border-l bg-background">
      {isOpen && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 border-b p-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggle(false)}
              className="h-6 w-6"
              title="Collapse chat history"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="flex-shrink-0 border-b p-4">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* New Chat Button */}
          <div className="flex-shrink-0 border-b p-2">
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full justify-start gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="space-y-2 p-4">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {sessions.length === 0
                    ? "No chat history yet"
                    : "No matching sessions"}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
                      currentSessionId === session.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          <h3 className="truncate text-sm font-medium min-w-0">
                            {session.title}
                          </h3>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this chat session? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={(e: React.MouseEvent) => handleDeleteSession(session.id, e)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {currentSessionId === session.id && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              Active
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {session.lastMessageAt
                              ? formatDistanceToNow(
                                  new Date(session.lastMessageAt),
                                  { addSuffix: true }
                                )
                              : formatDistanceToNow(new Date(session.createdAt), {
                                  addSuffix: true,
                                })}
                          </p>
                        </div>
                        {session.messageCount > 0 && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {session.messageCount} messages
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
