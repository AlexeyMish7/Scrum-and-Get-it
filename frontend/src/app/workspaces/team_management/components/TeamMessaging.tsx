/**
 * TEAM MESSAGING COMPONENT (UC-111)
 *
 * Enables direct messaging between team members for progress discussions.
 * Used by accountability partners to send encouragement and feedback.
 *
 * Features:
 * - Real-time message updates via Supabase subscriptions
 * - Conversation list view
 * - Message thread view
 * - Send messages
 * - Unread message indicators
 * - Message type icons (encouragement, celebration, etc.)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import {
  Send as SendIcon,
  ArrowBack as BackIcon,
  Celebration as CelebrationIcon,
  ThumbUp as EncouragementIcon,
  TrendingUp as ProgressIcon,
  NotificationsActive as ReminderIcon,
  Feedback as FeedbackIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import { supabase } from "@shared/services/supabaseClient";
import * as messagingService from "../services/messagingService";
import type {
  ProgressMessage,
  ConversationSummary,
  MessageType,
} from "../services/messagingService";

// ============================================================================
// TYPES
// ============================================================================

interface TeamMessagingProps {
  /** Pre-selected partner to open conversation with */
  partnerId?: string;
  /** Callback when unread count changes */
  onUnreadCountChange?: (count: number) => void;
  /** Compact mode for sidebars/drawers */
  compact?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get icon for message type
 */
function getMessageTypeIcon(type: MessageType) {
  switch (type) {
    case "celebration":
      return <CelebrationIcon fontSize="small" color="warning" />;
    case "encouragement":
      return <EncouragementIcon fontSize="small" color="success" />;
    case "progress_update":
      return <ProgressIcon fontSize="small" color="info" />;
    case "goal_reminder":
      return <ReminderIcon fontSize="small" color="error" />;
    case "feedback":
      return <FeedbackIcon fontSize="small" color="secondary" />;
    default:
      return <ChatIcon fontSize="small" color="action" />;
  }
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeamMessaging({
  partnerId,
  onUnreadCountChange,
  compact = false,
}: TeamMessagingProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // View state
  const [view, setView] = useState<"list" | "conversation">(
    partnerId ? "conversation" : "list"
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    partnerId || null
  );
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>("");

  // Data state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ProgressMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form state
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Loading states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user?.id || !currentTeam?.id) return;

    setLoadingConversations(true);
    try {
      const result = await messagingService.getConversationsList(
        user.id,
        currentTeam.id
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setConversations(result.data || []);

      // Calculate total unread
      const totalUnread = (result.data || []).reduce(
        (sum, c) => sum + c.unreadCount,
        0
      );
      setUnreadCount(totalUnread);
      onUnreadCountChange?.(totalUnread);
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id, currentTeam?.id, onUnreadCountChange]);

  // Load messages for a conversation
  const loadMessages = useCallback(
    async (partnerId: string) => {
      if (!user?.id || !currentTeam?.id) return;

      setLoadingMessages(true);
      try {
        const result = await messagingService.getConversation(
          user.id,
          partnerId,
          currentTeam.id
        );

        if (result.error) {
          setError(result.error.message);
          return;
        }

        setMessages(result.data || []);

        // Mark as read
        await messagingService.markConversationAsRead(
          user.id,
          partnerId,
          currentTeam.id
        );

        // Reload conversations to update unread counts
        loadConversations();
      } catch {
        setError("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [user?.id, currentTeam?.id, loadConversations]
  );

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Periodic refresh of conversation list (every 5 seconds when in list view)
  // This ensures new messages show up in the conversation list
  useEffect(() => {
    if (view !== "list") return;

    const interval = setInterval(() => {
      loadConversations();
    }, 5000); // Refresh every 5 seconds for near-real-time updates

    return () => clearInterval(interval);
  }, [view, loadConversations]);

  // Handle partnerId prop changes (e.g., when clicking Message button on partner card)
  useEffect(() => {
    if (partnerId && partnerId !== selectedPartnerId) {
      setSelectedPartnerId(partnerId);
      // Try to find partner name from existing conversations
      const conversation = conversations.find((c) => c.partnerId === partnerId);
      if (conversation) {
        setSelectedPartnerName(conversation.partnerName);
      } else {
        // If no existing conversation, set a placeholder - will be updated when messages load
        setSelectedPartnerName("Partner");
      }
      setView("conversation");
    }
  }, [partnerId, selectedPartnerId, conversations]);

  // Load messages when partner is selected
  useEffect(() => {
    if (selectedPartnerId) {
      loadMessages(selectedPartnerId);
    }
  }, [selectedPartnerId, loadMessages]);

  // Poll for new messages every 3 seconds when in conversation view
  // This ensures real-time-like experience without relying on Supabase Realtime
  useEffect(() => {
    if (
      view !== "conversation" ||
      !selectedPartnerId ||
      !user?.id ||
      !currentTeam?.id
    )
      return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await messagingService.getConversation(
          user.id,
          selectedPartnerId,
          currentTeam.id
        );

        if (result.data) {
          setMessages((prevMessages) => {
            // Check if there are new messages
            const prevIds = new Set(prevMessages.map((m) => m.id));
            const newMessages = result.data!.filter((m) => !prevIds.has(m.id));

            if (newMessages.length > 0) {
              // Mark new messages as read
              newMessages.forEach((msg) => {
                if (msg.recipientId === user.id && !msg.isRead) {
                  messagingService.markMessageAsRead(msg.id);
                }
              });
              return [...prevMessages, ...newMessages];
            }
            return prevMessages;
          });
        }
      } catch {
        // Silently fail polling - don't show error for background refreshes
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [view, selectedPartnerId, user?.id, currentTeam?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!user?.id || !currentTeam?.id) return;

    // Create a channel for real-time message updates
    const channel = supabase
      .channel(`messages:${user.id}:${currentTeam.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "progress_messages",
          // Listen for messages where current user is the recipient
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Record<string, unknown>;

          // Only process if message is for this team
          if (newMsg.team_id !== currentTeam.id) return;

          // Create a ProgressMessage from the payload
          const message: ProgressMessage = {
            id: newMsg.id as string,
            teamId: newMsg.team_id as string,
            senderId: newMsg.sender_id as string,
            recipientId: newMsg.recipient_id as string,
            messageText: newMsg.message_text as string,
            messageType: (newMsg.message_type as MessageType) || "message",
            isRead: newMsg.is_read as boolean,
            createdAt: newMsg.created_at as string,
            updatedAt: newMsg.updated_at as string,
            metadata: (newMsg.metadata as Record<string, unknown>) || {},
          };

          // If we're in conversation view with this sender, add the message
          if (
            view === "conversation" &&
            selectedPartnerId === message.senderId
          ) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });

            // Mark as read since we're viewing the conversation
            messagingService.markMessageAsRead(message.id);
          } else {
            // Update unread count for conversation list
            setConversations((prev) => {
              const existing = prev.find(
                (c) => c.partnerId === message.senderId
              );
              if (existing) {
                return prev.map((c) =>
                  c.partnerId === message.senderId
                    ? {
                        ...c,
                        lastMessageText: message.messageText,
                        lastMessageAt: message.createdAt,
                        lastMessageSenderId: message.senderId,
                        unreadCount: c.unreadCount + 1,
                      }
                    : c
                );
              } else {
                // New conversation - reload the list to get sender info
                loadConversations();
              }
              return prev;
            });

            // Update total unread count
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              onUnreadCountChange?.(newCount);
              return newCount;
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user?.id,
    currentTeam?.id,
    view,
    selectedPartnerId,
    loadConversations,
    onUnreadCountChange,
  ]);

  // Open a conversation
  function handleOpenConversation(conversation: ConversationSummary) {
    setSelectedPartnerId(conversation.partnerId);
    setSelectedPartnerName(conversation.partnerName);
    setView("conversation");
  }

  // Go back to list
  function handleBackToList() {
    setSelectedPartnerId(null);
    setMessages([]);
    setView("list");
  }

  // Send a message
  async function handleSendMessage() {
    if (
      !newMessage.trim() ||
      !user?.id ||
      !currentTeam?.id ||
      !selectedPartnerId
    )
      return;

    setSending(true);
    try {
      const result = await messagingService.sendMessage(user.id, {
        teamId: currentTeam.id,
        recipientId: selectedPartnerId,
        messageText: newMessage.trim(),
        messageType: "message",
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Add message to list and clear input
      if (result.data) {
        setMessages((prev) => [...prev, result.data as ProgressMessage]);
      }
      setNewMessage("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // Handle enter key to send
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // ============================================================================
  // RENDER CONVERSATION LIST
  // ============================================================================

  function renderConversationList() {
    if (loadingConversations) {
      return (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={72} />
          ))}
        </Stack>
      );
    }

    if (conversations.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <ChatIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Conversations Yet
          </Typography>
          <Typography color="text.secondary">
            Start a conversation with your accountability partners to stay
            connected.
          </Typography>
        </Box>
      );
    }

    return (
      <List disablePadding>
        {conversations.map((conversation, index) => (
          <Box key={conversation.partnerId}>
            <ListItem
              onClick={() => handleOpenConversation(conversation)}
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "action.hover" },
                py: 1.5,
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conversation.unreadCount}
                  color="primary"
                  overlap="circular"
                >
                  <Avatar>{getInitials(conversation.partnerName)}</Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={
                        conversation.unreadCount > 0 ? "bold" : "normal"
                      }
                    >
                      {conversation.partnerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    fontWeight={
                      conversation.unreadCount > 0 ? "medium" : "normal"
                    }
                  >
                    {conversation.lastMessageSenderId === user?.id
                      ? "You: "
                      : ""}
                    {conversation.lastMessageText}
                  </Typography>
                }
              />
            </ListItem>
            {index < conversations.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </Box>
        ))}
      </List>
    );
  }

  // ============================================================================
  // RENDER CONVERSATION
  // ============================================================================

  function renderConversation() {
    return (
      <Stack sx={{ height: "100%", minHeight: compact ? 400 : 500 }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <IconButton onClick={handleBackToList} size="small">
            <BackIcon />
          </IconButton>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            color="success"
            invisible={false}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#44b700",
                boxShadow: "0 0 0 2px white",
              },
            }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {getInitials(selectedPartnerName)}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedPartnerName}
            </Typography>
            <Typography
              variant="caption"
              color="success.main"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "success.main",
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.4 },
                    "100%": { opacity: 1 },
                  },
                }}
              />
              Live
            </Typography>
          </Box>
        </Stack>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loadingMessages ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Typography color="text.secondary">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: "flex",
                      justifyContent: isOwn ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "75%",
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: isOwn
                          ? "primary.main"
                          : "action.selected",
                        color: isOwn ? "primary.contrastText" : "text.primary",
                      }}
                    >
                      {message.messageType !== "message" && (
                        <Chip
                          icon={getMessageTypeIcon(message.messageType)}
                          label={message.messageType.replace("_", " ")}
                          size="small"
                          sx={{
                            mb: 0.5,
                            height: 20,
                            backgroundColor: isOwn
                              ? "primary.dark"
                              : "background.paper",
                          }}
                        />
                      )}
                      <Typography variant="body2">
                        {message.messageText}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          textAlign: "right",
                          mt: 0.5,
                          opacity: 0.7,
                        }}
                      >
                        {formatRelativeTime(message.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            multiline
            maxRows={3}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Send message">
                      <span>
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          color="primary"
                        >
                          {sending ? (
                            <CircularProgress size={20} />
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Stack>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Paper
      elevation={compact ? 0 : 1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Header for list view */}
      {view === "list" && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Typography variant="h6">Messages</Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              size="small"
              color="primary"
            />
          )}
        </Stack>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {view === "list" ? renderConversationList() : renderConversation()}
      </Box>
    </Paper>
  );
}

export default TeamMessaging;
