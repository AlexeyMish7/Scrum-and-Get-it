/**
 * PROGRESS MESSAGING SERVICE (UC-111)
 *
 * Handles team communication for progress discussions.
 * Supports messages between accountability partners, mentors, and candidates.
 *
 * Features:
 * - Send and receive messages
 * - View conversation history
 * - Mark messages as read
 * - Unread message counts
 * - Conversation list with last message preview
 */

import { supabase } from "@shared/services/supabaseClient";
import type { Result } from "@shared/services/types";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchRecentProgressMessagesWithProfiles } from "@shared/cache/coreFetchers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Message types for different communication contexts
 */
export type MessageType =
  | "message"
  | "encouragement"
  | "progress_update"
  | "goal_reminder"
  | "celebration"
  | "feedback";

/**
 * Progress message data structure
 */
export interface ProgressMessage {
  id: string;
  teamId: string;
  senderId: string;
  recipientId: string;
  partnershipId?: string;
  messageText: string;
  messageType: MessageType;
  parentMessageId?: string;
  threadRootId?: string;
  isRead: boolean;
  readAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Joined data
  sender?: {
    fullName: string;
    email: string;
    professionalTitle?: string;
  };
  recipient?: {
    fullName: string;
    email: string;
    professionalTitle?: string;
  };
}

/**
 * Conversation summary for list view
 */
export interface ConversationSummary {
  partnerId: string;
  partnerName: string;
  partnerTitle?: string;
  lastMessageText: string;
  lastMessageAt: string;
  lastMessageSenderId: string;
  unreadCount: number;
}

/**
 * Data for sending a new message
 */
export interface SendMessageData {
  teamId: string;
  recipientId: string;
  messageText: string;
  messageType?: MessageType;
  partnershipId?: string;
  parentMessageId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

/**
 * Send a message to another team member
 */
export async function sendMessage(
  senderId: string,
  data: SendMessageData
): Promise<Result<ProgressMessage>> {
  // Determine thread root if this is a reply
  let threadRootId: string | null = null;
  if (data.parentMessageId) {
    const { data: parentMsg } = await supabase
      .from("progress_messages")
      .select("thread_root_id, id")
      .eq("id", data.parentMessageId)
      .single();

    if (parentMsg) {
      // Use parent's thread root, or parent's ID if it's the root
      threadRootId = parentMsg.thread_root_id || parentMsg.id;
    }
  }

  const { data: message, error } = await supabase
    .from("progress_messages")
    .insert({
      team_id: data.teamId,
      sender_id: senderId,
      recipient_id: data.recipientId,
      message_text: data.messageText,
      message_type: data.messageType || "message",
      partnership_id: data.partnershipId || null,
      parent_message_id: data.parentMessageId || null,
      thread_root_id: threadRootId,
      metadata: data.metadata || {},
    })
    .select(
      `
      *,
      sender:profiles!sender_id(full_name, email, professional_title),
      recipient:profiles!recipient_id(full_name, email, professional_title)
    `
    )
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Keep message-derived widgets and inbox views consistent without forcing an immediate refetch.
  // We invalidate by prefix so any team/user scoped message queries (recent/period/since) refresh next time.
  const qc = getAppQueryClient();
  qc.invalidateQueries({
    queryKey: ["core", "progress_messages", senderId, data.teamId] as const,
    exact: false,
  });
  qc.invalidateQueries({
    queryKey: [
      "core",
      "progress_messages",
      data.recipientId,
      data.teamId,
    ] as const,
    exact: false,
  });

  return {
    data: mapMessageFromDb(message),
    error: null,
    status: 201,
  };
}

// ============================================================================
// GET MESSAGES
// ============================================================================

/**
 * Get conversation between two users
 */
export async function getConversation(
  userId: string,
  otherUserId: string,
  teamId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Result<ProgressMessage[]>> {
  const { data, error } = await supabase.rpc("get_conversation", {
    p_user_id: userId,
    p_other_user_id: otherUserId,
    p_team_id: teamId,
    p_limit: options.limit || 50,
    p_offset: options.offset || 0,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Map RPC results to ProgressMessage format
  const messages: ProgressMessage[] = (data || []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      teamId: teamId,
      senderId: row.sender_id as string,
      recipientId: row.recipient_id as string,
      messageText: row.message_text as string,
      messageType: row.message_type as MessageType,
      isRead: row.is_read as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.created_at as string,
      metadata: {},
      sender: {
        fullName: row.sender_name as string,
        email: "",
      },
      recipient: {
        fullName: row.recipient_name as string,
        email: "",
      },
    })
  );

  return {
    data: messages,
    error: null,
    status: 200,
  };
}

/**
 * Get list of all conversations for a user
 */
export async function getConversationsList(
  userId: string,
  teamId: string
): Promise<Result<ConversationSummary[]>> {
  const { data, error } = await supabase.rpc("get_conversations_list", {
    p_user_id: userId,
    p_team_id: teamId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  const conversations: ConversationSummary[] = (data || []).map(
    (row: Record<string, unknown>) => ({
      partnerId: row.partner_id as string,
      partnerName: row.partner_name as string,
      partnerTitle: row.partner_title as string | undefined,
      lastMessageText: row.last_message_text as string,
      lastMessageAt: row.last_message_at as string,
      lastMessageSenderId: row.last_message_sender_id as string,
      unreadCount: row.unread_count as number,
    })
  );

  return {
    data: conversations,
    error: null,
    status: 200,
  };
}

/**
 * Get recent messages for a user (all conversations)
 */
export async function getRecentMessages(
  userId: string,
  teamId: string,
  limit: number = 20
): Promise<Result<ProgressMessage[]>> {
  try {
    const qc = getAppQueryClient();
    const rows = await qc.ensureQueryData({
      queryKey: coreKeys.recentProgressMessages(userId, teamId, limit),
      queryFn: () =>
        fetchRecentProgressMessagesWithProfiles<Record<string, unknown>>(
          userId,
          teamId,
          limit
        ),
      staleTime: 30 * 1000,
    });

    return {
      data: (Array.isArray(rows) ? rows : []).map(mapMessageFromDb),
      error: null,
      status: 200,
    };
  } catch (e: unknown) {
    return {
      data: null,
      error: {
        message:
          e instanceof Error
            ? e.message
            : String(e) || "Failed to load messages",
        status: null,
      },
      status: null,
    };
  }
}

// ============================================================================
// MARK AS READ
// ============================================================================

/**
 * Mark a single message as read
 */
export async function markMessageAsRead(
  messageId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("progress_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // The message could belong to multiple cached lists; simplest is to invalidate message queries globally.
  getAppQueryClient().invalidateQueries({
    queryKey: ["core", "progress_messages"] as const,
    exact: false,
  });

  return { data: true, error: null, status: 200 };
}

/**
 * Mark all messages from a sender as read
 */
export async function markConversationAsRead(
  userId: string,
  senderId: string,
  teamId: string
): Promise<Result<number>> {
  const { data, error } = await supabase
    .from("progress_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("team_id", teamId)
    .eq("recipient_id", userId)
    .eq("sender_id", senderId)
    .eq("is_read", false)
    .select("id");

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Invalidate both sides' cached message views for this team.
  const qc = getAppQueryClient();
  qc.invalidateQueries({
    queryKey: ["core", "progress_messages", userId, teamId] as const,
    exact: false,
  });
  qc.invalidateQueries({
    queryKey: ["core", "progress_messages", senderId, teamId] as const,
    exact: false,
  });

  return {
    data: data?.length || 0,
    error: null,
    status: 200,
  };
}

// ============================================================================
// UNREAD COUNTS
// ============================================================================

/**
 * Get total unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<Result<number>> {
  const { data, error } = await supabase.rpc("get_unread_message_count", {
    p_user_id: userId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return {
    data: data as number,
    error: null,
    status: 200,
  };
}

// ============================================================================
// DELETE MESSAGE
// ============================================================================

/**
 * Soft delete a message (sender only)
 */
export async function deleteMessage(
  messageId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("progress_messages")
    .update({ is_deleted: true })
    .eq("id", messageId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  getAppQueryClient().invalidateQueries({
    queryKey: ["core", "progress_messages"] as const,
    exact: false,
  });

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// QUICK MESSAGE HELPERS
// ============================================================================

/**
 * Send an encouragement message
 */
export async function sendEncouragement(
  senderId: string,
  teamId: string,
  recipientId: string,
  message: string,
  partnershipId?: string
): Promise<Result<ProgressMessage>> {
  return sendMessage(senderId, {
    teamId,
    recipientId,
    messageText: message,
    messageType: "encouragement",
    partnershipId,
  });
}

/**
 * Send a celebration message
 */
export async function sendCelebration(
  senderId: string,
  teamId: string,
  recipientId: string,
  message: string,
  metadata?: { achievementId?: string; achievementType?: string }
): Promise<Result<ProgressMessage>> {
  return sendMessage(senderId, {
    teamId,
    recipientId,
    messageText: message,
    messageType: "celebration",
    metadata,
  });
}

/**
 * Send a progress update notification
 */
export async function sendProgressUpdate(
  senderId: string,
  teamId: string,
  recipientId: string,
  updateSummary: string,
  metadata?: { snapshotId?: string }
): Promise<Result<ProgressMessage>> {
  return sendMessage(senderId, {
    teamId,
    recipientId,
    messageText: updateSummary,
    messageType: "progress_update",
    metadata,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database row to ProgressMessage
 */
function mapMessageFromDb(row: Record<string, unknown>): ProgressMessage {
  const senderData = row.sender as Record<string, unknown> | null;
  const recipientData = row.recipient as Record<string, unknown> | null;

  return {
    id: row.id as string,
    teamId: row.team_id as string,
    senderId: row.sender_id as string,
    recipientId: row.recipient_id as string,
    partnershipId: row.partnership_id as string | undefined,
    messageText: row.message_text as string,
    messageType: row.message_type as MessageType,
    parentMessageId: row.parent_message_id as string | undefined,
    threadRootId: row.thread_root_id as string | undefined,
    isRead: row.is_read as boolean,
    readAt: row.read_at as string | undefined,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    sender: senderData
      ? {
          fullName: senderData.full_name as string,
          email: senderData.email as string,
          professionalTitle: senderData.professional_title as
            | string
            | undefined,
        }
      : undefined,
    recipient: recipientData
      ? {
          fullName: recipientData.full_name as string,
          email: recipientData.email as string,
          professionalTitle: recipientData.professional_title as
            | string
            | undefined,
        }
      : undefined,
  };
}
