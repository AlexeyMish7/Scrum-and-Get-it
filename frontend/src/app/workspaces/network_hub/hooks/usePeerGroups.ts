/**
 * usePeerGroups.ts
 *
 * UC-112: Peer Networking and Support Groups
 *
 * Custom hook for managing peer groups state and operations.
 * Provides centralized state management with caching for peer group data,
 * reducing redundant API calls and improving performance.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@shared/context/AuthContext";
import * as peerGroupsService from "../services/peerGroupsService";
import type {
  PeerGroupWithMembership,
  PeerGroupMemberWithProfile,
  PeerPostWithAuthor,
  ChallengeWithParticipation,
  SuccessStoryWithAuthor,
  PeerReferralWithSharer,
  ImpactSummary,
  UserPeerSettingsRow,
  CreatePeerGroupData,
  CreatePostData,
  CreateChallengeData,
  CreateSuccessStoryData,
  CreateReferralData,
  GroupFilters,
  SuccessStoryFilters,
} from "../types/peerGroups.types";

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Check if cache entry is still valid
function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

// Hook return type
interface UsePeerGroupsReturn {
  // State
  groups: PeerGroupWithMembership[];
  userGroups: PeerGroupWithMembership[];
  currentGroup: PeerGroupWithMembership | null;
  groupMembers: PeerGroupMemberWithProfile[];
  posts: PeerPostWithAuthor[];
  challenges: ChallengeWithParticipation[];
  successStories: SuccessStoryWithAuthor[];
  referrals: PeerReferralWithSharer[];
  impactSummary: ImpactSummary | null;
  settings: UserPeerSettingsRow | null;

  // Loading states
  loading: boolean;
  loadingGroups: boolean;
  loadingPosts: boolean;
  loadingChallenges: boolean;

  // Error state
  error: string | null;

  // Group operations
  loadGroups: (filters?: GroupFilters) => Promise<void>;
  loadUserGroups: () => Promise<void>;
  loadGroup: (groupId: string) => Promise<void>;
  createGroup: (
    data: CreatePeerGroupData
  ) => Promise<PeerGroupWithMembership | null>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;

  // Post operations
  loadPosts: (groupId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<boolean>;
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;

  // Challenge operations
  loadChallenges: (groupId: string) => Promise<void>;
  createChallenge: (data: CreateChallengeData) => Promise<boolean>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  updateProgress: (
    challengeId: string,
    value: number,
    note?: string
  ) => Promise<boolean>;

  // Success story operations
  loadSuccessStories: (groupId?: string) => Promise<void>;
  createSuccessStory: (data: CreateSuccessStoryData) => Promise<boolean>;

  // Referral operations
  loadReferrals: (groupId: string) => Promise<void>;
  createReferral: (data: CreateReferralData) => Promise<boolean>;
  expressInterest: (referralId: string, message?: string) => Promise<boolean>;

  // Impact & Settings
  loadImpactSummary: () => Promise<void>;
  loadSettings: () => Promise<void>;

  // Utility
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export function usePeerGroups(): UsePeerGroupsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // State
  const [groups, setGroups] = useState<PeerGroupWithMembership[]>([]);
  const [userGroups, setUserGroups] = useState<PeerGroupWithMembership[]>([]);
  const [currentGroup, setCurrentGroup] =
    useState<PeerGroupWithMembership | null>(null);
  const [groupMembers] = useState<PeerGroupMemberWithProfile[]>([]);
  const [posts, setPosts] = useState<PeerPostWithAuthor[]>([]);
  const [challenges, setChallenges] = useState<ChallengeWithParticipation[]>(
    []
  );
  const [successStories, setSuccessStories] = useState<
    SuccessStoryWithAuthor[]
  >([]);
  const [referrals, setReferrals] = useState<PeerReferralWithSharer[]>([]);
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(
    null
  );
  const [settings, setSettings] = useState<UserPeerSettingsRow | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Cache refs (survive re-renders)
  const groupsCache = useRef<CacheEntry<PeerGroupWithMembership[]> | null>(
    null
  );
  const userGroupsCache = useRef<CacheEntry<PeerGroupWithMembership[]> | null>(
    null
  );
  const groupCache = useRef<Map<string, CacheEntry<PeerGroupWithMembership>>>(
    new Map()
  );
  const postsCache = useRef<Map<string, CacheEntry<PeerPostWithAuthor[]>>>(
    new Map()
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load all groups with optional filters
  const loadGroups = useCallback(
    async (filters?: GroupFilters) => {
      if (!userId) return;

      // Check cache if no filters
      if (!filters && isCacheValid(groupsCache.current)) {
        setGroups(groupsCache.current.data);
        return;
      }

      setLoadingGroups(true);
      setError(null);

      try {
        const result = await peerGroupsService.listGroups(userId, filters);
        if (result.data) {
          setGroups(result.data);
          // Cache only unfiltered results
          if (!filters) {
            groupsCache.current = { data: result.data, timestamp: Date.now() };
          }
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading groups:", err);
        setError("Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    },
    [userId]
  );

  // Load user's groups
  const loadUserGroups = useCallback(async () => {
    if (!userId) return;

    // Check cache
    if (isCacheValid(userGroupsCache.current)) {
      setUserGroups(userGroupsCache.current.data);
      return;
    }

    setLoadingGroups(true);
    setError(null);

    try {
      const result = await peerGroupsService.getUserGroups(userId);
      if (result.data) {
        setUserGroups(result.data);
        userGroupsCache.current = { data: result.data, timestamp: Date.now() };
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading user groups:", err);
      setError("Failed to load your groups");
    } finally {
      setLoadingGroups(false);
    }
  }, [userId]);

  // Load a specific group
  const loadGroup = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      // Check cache
      const cached = groupCache.current.get(groupId);
      if (cached && isCacheValid(cached)) {
        setCurrentGroup(cached.data);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.getGroup(groupId, userId);
        if (result.data) {
          setCurrentGroup(result.data);
          groupCache.current.set(groupId, {
            data: result.data,
            timestamp: Date.now(),
          });
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading group:", err);
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Create a new group
  const createGroup = useCallback(
    async (
      data: CreatePeerGroupData
    ): Promise<PeerGroupWithMembership | null> => {
      if (!userId) return null;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.createGroup(userId, data);
        if (result.data) {
          // Invalidate caches
          groupsCache.current = null;
          userGroupsCache.current = null;
          // Convert PeerGroupRow to PeerGroupWithMembership
          const groupWithMembership: PeerGroupWithMembership = {
            ...result.data,
            is_member: true,
            membership: null, // Will be loaded on next fetch
            member_count: 1, // Creator is the first member
          };
          // Add to current groups list
          setGroups((prev) => [groupWithMembership, ...prev]);
          setUserGroups((prev) => [groupWithMembership, ...prev]);
          return groupWithMembership;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating group:", err);
        setError("Failed to create group");
      } finally {
        setLoading(false);
      }
      return null;
    },
    [userId]
  );

  // Join a group
  const joinGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.joinGroup(userId, {
          group_id: groupId,
        });
        if (result.data) {
          // Invalidate caches
          groupsCache.current = null;
          userGroupsCache.current = null;
          groupCache.current.delete(groupId);
          // Update UI optimistically
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId ? { ...g, user_membership: result.data } : g
            )
          );
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error joining group:", err);
        setError("Failed to join group");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId]
  );

  // Leave a group
  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.leaveGroup(groupId, userId);
        if (!result.error) {
          // Invalidate caches
          groupsCache.current = null;
          userGroupsCache.current = null;
          groupCache.current.delete(groupId);
          // Update UI
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId ? { ...g, user_membership: null } : g
            )
          );
          setUserGroups((prev) => prev.filter((g) => g.id !== groupId));
          return true;
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error leaving group:", err);
        setError("Failed to leave group");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId]
  );

  // Load posts for a group
  const loadPosts = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      // Check cache
      const cached = postsCache.current.get(groupId);
      if (cached && isCacheValid(cached)) {
        setPosts(cached.data);
        return;
      }

      setLoadingPosts(true);
      setError(null);

      try {
        const result = await peerGroupsService.getGroupPosts(groupId, userId);
        if (result.data) {
          setPosts(result.data);
          postsCache.current.set(groupId, {
            data: result.data,
            timestamp: Date.now(),
          });
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading posts:", err);
        setError("Failed to load posts");
      } finally {
        setLoadingPosts(false);
      }
    },
    [userId]
  );

  // Create a post
  const createPost = useCallback(
    async (data: CreatePostData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.createPost(userId, data);
        if (result.data) {
          // Invalidate posts cache for this group
          postsCache.current.delete(data.group_id);
          // Reload posts
          await loadPosts(data.group_id);
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating post:", err);
        setError("Failed to create post");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadPosts]
  );

  // Like a post
  const likePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.likePost(postId, userId);
        if (result.data) {
          // Update UI optimistically
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, like_count: p.like_count + 1, user_liked: true }
                : p
            )
          );
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error liking post:", err);
        setError("Failed to like post");
      }
      return false;
    },
    [userId]
  );

  // Unlike a post
  const unlikePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.unlikePost(postId, userId);
        if (!result.error) {
          // Update UI optimistically
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    like_count: Math.max(0, p.like_count - 1),
                    user_liked: false,
                  }
                : p
            )
          );
          return true;
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error unliking post:", err);
        setError("Failed to unlike post");
      }
      return false;
    },
    [userId]
  );

  // Delete a post
  const deletePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.deletePost(postId, userId);
        if (!result.error) {
          // Update UI
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          return true;
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error deleting post:", err);
        setError("Failed to delete post");
      }
      return false;
    },
    [userId]
  );

  // Load challenges for a group
  const loadChallenges = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      setLoadingChallenges(true);
      setError(null);

      try {
        const result = await peerGroupsService.getGroupChallenges(
          groupId,
          userId
        );
        if (result.data) {
          setChallenges(result.data);
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading challenges:", err);
        setError("Failed to load challenges");
      } finally {
        setLoadingChallenges(false);
      }
    },
    [userId]
  );

  // Create a challenge
  const createChallenge = useCallback(
    async (data: CreateChallengeData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.createChallenge(userId, data);
        if (result.data) {
          // Reload challenges
          await loadChallenges(data.group_id);
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating challenge:", err);
        setError("Failed to create challenge");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadChallenges]
  );

  // Join a challenge
  const joinChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.joinChallenge(
          challengeId,
          userId
        );
        if (result.data) {
          // Update UI
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? {
                    ...c,
                    user_participation: result.data,
                    participant_count: c.participant_count + 1,
                  }
                : c
            )
          );
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error joining challenge:", err);
        setError("Failed to join challenge");
      }
      return false;
    },
    [userId]
  );

  // Update challenge progress
  const updateProgress = useCallback(
    async (
      challengeId: string,
      value: number,
      note?: string
    ): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.updateChallengeProgress(userId, {
          challenge_id: challengeId,
          value,
          note,
        });
        if (result.data) {
          // Update UI
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? {
                    ...c,
                    participation: {
                      ...c.participation!,
                      current_value: value,
                    },
                  }
                : c
            )
          );
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error updating progress:", err);
        setError("Failed to update progress");
      }
      return false;
    },
    [userId]
  );

  // Load success stories
  const loadSuccessStories = useCallback(
    async (groupId?: string) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const filters: SuccessStoryFilters | undefined = groupId
          ? { group_id: groupId }
          : undefined;
        const result = await peerGroupsService.getSuccessStories(filters);
        if (result.data) {
          setSuccessStories(result.data);
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading success stories:", err);
        setError("Failed to load success stories");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Create a success story
  const createSuccessStory = useCallback(
    async (data: CreateSuccessStoryData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.createSuccessStory(userId, data);
        if (result.data) {
          // Reload stories
          await loadSuccessStories(data.group_id);
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating success story:", err);
        setError("Failed to create success story");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadSuccessStories]
  );

  // Load referrals
  const loadReferrals = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.getGroupReferrals(
          groupId,
          userId
        );
        if (result.data) {
          setReferrals(result.data);
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error loading referrals:", err);
        setError("Failed to load referrals");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Create a referral
  const createReferral = useCallback(
    async (data: CreateReferralData): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.createReferral(userId, data);
        if (result.data) {
          // Reload referrals
          await loadReferrals(data.group_id);
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error creating referral:", err);
        setError("Failed to create referral");
      } finally {
        setLoading(false);
      }
      return false;
    },
    [userId, loadReferrals]
  );

  // Express interest in a referral
  const expressInterest = useCallback(
    async (referralId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.expressInterest(
          userId,
          referralId
        );
        if (result.data) {
          // Update UI
          setReferrals((prev) =>
            prev.map((r) =>
              r.id === referralId
                ? {
                    ...r,
                    interested_count: r.interested_count + 1,
                    user_interest: result.data,
                  }
                : r
            )
          );
          return true;
        } else if (result.error) {
          setError(result.error.message);
        }
      } catch (err) {
        console.error("Error expressing interest:", err);
        setError("Failed to express interest");
      }
      return false;
    },
    [userId]
  );

  // Load impact summary
  const loadImpactSummary = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await peerGroupsService.getNetworkingImpact(userId);
      if (result.data) {
        setImpactSummary(result.data);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading impact summary:", err);
      setError("Failed to load impact summary");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await peerGroupsService.getUserPeerSettings(userId);
      if (result.data) {
        setSettings(result.data);
      } else if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    // Clear caches
    groupsCache.current = null;
    userGroupsCache.current = null;
    groupCache.current.clear();
    postsCache.current.clear();

    // Reload
    await Promise.all([
      loadGroups(),
      loadUserGroups(),
      loadImpactSummary(),
      loadSettings(),
    ]);
  }, [loadGroups, loadUserGroups, loadImpactSummary, loadSettings]);

  // Load initial data when user is available
  useEffect(() => {
    if (userId) {
      loadUserGroups();
      loadImpactSummary();
      loadSettings();
    }
  }, [userId, loadUserGroups, loadImpactSummary, loadSettings]);

  return {
    // State
    groups,
    userGroups,
    currentGroup,
    groupMembers,
    posts,
    challenges,
    successStories,
    referrals,
    impactSummary,
    settings,

    // Loading states
    loading,
    loadingGroups,
    loadingPosts,
    loadingChallenges,

    // Error state
    error,

    // Group operations
    loadGroups,
    loadUserGroups,
    loadGroup,
    createGroup,
    joinGroup,
    leaveGroup,

    // Post operations
    loadPosts,
    createPost,
    likePost,
    unlikePost,
    deletePost,

    // Challenge operations
    loadChallenges,
    createChallenge,
    joinChallenge,
    updateProgress,

    // Success story operations
    loadSuccessStories,
    createSuccessStory,

    // Referral operations
    loadReferrals,
    createReferral,
    expressInterest,

    // Impact & Settings
    loadImpactSummary,
    loadSettings,

    // Utility
    clearError,
    refreshAll,
  };
}

export default usePeerGroups;
