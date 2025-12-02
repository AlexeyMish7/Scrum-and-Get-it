/**
 * USE MESSAGING HOOK (UC-111)
 *
 * React hook for managing messaging state and operations.
 * Provides easy access to messaging functionality across components.
 *
 * Features:
 * - Unread message count
 * - Quick send message functions
 * - Conversation loading
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as messagingService from "../services/messagingService";
import type {
  ConversationSummary,
  ProgressMessage,
  MessageType,
} from "../services/messagingService";

// ============================================================================
// TYPES
// ============================================================================

interface UseMessagingResult {
  // State
  conversations: ConversationSummary[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  sendMessage: (
    recipientId: string,
    messageText: string,
    messageType?: MessageType
  ) => Promise<ProgressMessage | null>;
  sendEncouragement: (
    recipientId: string,
    message: string,
    partnershipId?: string
  ) => Promise<ProgressMessage | null>;
  sendCelebration: (
    recipientId: string,
    message: string,
    metadata?: { achievementId?: string; achievementType?: string }
  ) => Promise<ProgressMessage | null>;
  markAsRead: (senderId: string) => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMessaging(): UseMessagingResult {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user?.id || !currentTeam?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await messagingService.getConversationsList(
        user.id,
        currentTeam.id
      );

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const convos = result.data || [];
      setConversations(convos);

      // Calculate total unread
      const totalUnread = convos.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  // Send a message
  const sendMessage = useCallback(
    async (
      recipientId: string,
      messageText: string,
      messageType: MessageType = "message"
    ): Promise<ProgressMessage | null> => {
      if (!user?.id || !currentTeam?.id) return null;

      try {
        const result = await messagingService.sendMessage(user.id, {
          teamId: currentTeam.id,
          recipientId,
          messageText,
          messageType,
        });

        if (result.error) {
          setError(result.error.message);
          return null;
        }

        return result.data;
      } catch {
        setError("Failed to send message");
        return null;
      }
    },
    [user?.id, currentTeam?.id]
  );

  // Send encouragement message
  const sendEncouragement = useCallback(
    async (
      recipientId: string,
      message: string,
      partnershipId?: string
    ): Promise<ProgressMessage | null> => {
      if (!user?.id || !currentTeam?.id) return null;

      try {
        const result = await messagingService.sendEncouragement(
          user.id,
          currentTeam.id,
          recipientId,
          message,
          partnershipId
        );

        if (result.error) {
          setError(result.error.message);
          return null;
        }

        return result.data;
      } catch {
        setError("Failed to send encouragement");
        return null;
      }
    },
    [user?.id, currentTeam?.id]
  );

  // Send celebration message
  const sendCelebration = useCallback(
    async (
      recipientId: string,
      message: string,
      metadata?: { achievementId?: string; achievementType?: string }
    ): Promise<ProgressMessage | null> => {
      if (!user?.id || !currentTeam?.id) return null;

      try {
        const result = await messagingService.sendCelebration(
          user.id,
          currentTeam.id,
          recipientId,
          message,
          metadata
        );

        if (result.error) {
          setError(result.error.message);
          return null;
        }

        return result.data;
      } catch {
        setError("Failed to send celebration");
        return null;
      }
    },
    [user?.id, currentTeam?.id]
  );

  // Mark conversation as read
  const markAsRead = useCallback(
    async (senderId: string): Promise<void> => {
      if (!user?.id || !currentTeam?.id) return;

      try {
        await messagingService.markConversationAsRead(
          user.id,
          senderId,
          currentTeam.id
        );

        // Update local unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === senderId ? { ...c, unreadCount: 0 } : c
          )
        );
        setUnreadCount((prev) => {
          const conv = conversations.find((c) => c.partnerId === senderId);
          return prev - (conv?.unreadCount || 0);
        });
      } catch {
        // Silent fail for marking as read
        console.error("Failed to mark messages as read");
      }
    },
    [user?.id, currentTeam?.id, conversations]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load on mount and when team changes
  useEffect(() => {
    if (user?.id && currentTeam?.id) {
      loadConversations();
    }
  }, [user?.id, currentTeam?.id, loadConversations]);

  return {
    conversations,
    unreadCount,
    loading,
    error,
    loadConversations,
    sendMessage,
    sendEncouragement,
    sendCelebration,
    markAsRead,
    clearError,
  };
}

export default useMessaging;
