"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircleIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: Date | null;
}

interface ChatSessionManagerProps {
  currentSessionId?: string | null;
  onSessionChange?: (sessionId: string | null) => void;
}

export function ChatSessionManager({ 
  currentSessionId, 
  onSessionChange 
}: ChatSessionManagerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat/sessions?limit=50");
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
    onSessionChange?.(null);
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    onSessionChange?.(sessionId);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Chat session deleted");
      setSessions(sessions.filter(s => s.id !== sessionId));
      
      // If the deleted session was the current one, start a new chat
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
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[200px]">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-4 w-4" />
              <span className="truncate">
                {currentSession?.title || "New Chat"}
              </span>
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px]">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleNewChat}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Chat
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Recent Chats</DropdownMenuLabel>
          <ScrollArea className="max-h-[300px]">
            {loading ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No chat history yet
              </div>
            ) : (
              sessions.slice(0, 10).map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  className="flex items-center justify-between gap-2 p-2"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {session.title}
                      </span>
                      {session.id === currentSessionId && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      {session.lastMessageAt
                        ? formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      <Badge variant="outline" className="text-xs ml-auto">
                        {session.messageCount}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
          {sessions.length > 10 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsHistoryOpen(true)}>
                View All History
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              View and manage all your chat sessions.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No chat history yet</p>
                <p className="text-sm">Start a conversation to see your chats here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{session.title}</h4>
                        {session.id === currentSessionId && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {session.lastMessageAt
                            ? formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })
                            : formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.messageCount} messages
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this chat session? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}