/**
 * usePeerGroups.ts
 *
 * UC-112: Peer Networking and Support Groups
 *
 * Custom hook for managing peer groups state and operations.
 * Provides centralized state management backed by TanStack React Query.
 *
 * NOTE: We intentionally use the "network" query key root (not "core") so
 * these datasets are not persisted to disk. Some peer group data (posts,
 * replies, etc.) can be high-cardinality and should remain in-memory only.
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { networkKeys } from "@shared/cache/networkQueryKeys";
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

const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

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
  const queryClient = useQueryClient();

  // State
  const [groups, setGroups] = useState<PeerGroupWithMembership[]>([]);
  const [userGroups, setUserGroups] = useState<PeerGroupWithMembership[]>([]);
  const [currentGroup, setCurrentGroup] =
    useState<PeerGroupWithMembership | null>(null);
  const [groupMembers, setGroupMembers] = useState<
    PeerGroupMemberWithProfile[]
  >([]);
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

  // Track which group the current posts/challenges/referrals are for so
  // mutations can update the correct cached list.
  const [postsGroupId, setPostsGroupId] = useState<string | null>(null);
  const [challengesGroupId, setChallengesGroupId] = useState<string | null>(
    null
  );
  const [referralsGroupId, setReferralsGroupId] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load all groups with optional filters
  const loadGroups = useCallback(
    async (filters?: GroupFilters) => {
      if (!userId) return;

      setLoadingGroups(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: [
            ...networkKeys.peerGroupsList(userId),
            "filters",
            (filters ?? null) as GroupFilters | null,
          ],
          staleTime: DEFAULT_STALE_TIME_MS,
          queryFn: async () => {
            const result = await peerGroupsService.listGroups(userId, filters);
            if (result.error) throw new Error(result.error.message);
            return result.data ?? [];
          },
        });

        setGroups(data);
      } catch (err) {
        console.error("Error loading groups:", err);
        setError("Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    },
    [queryClient, userId]
  );

  // Load user's groups
  const loadUserGroups = useCallback(async () => {
    if (!userId) return;

    setLoadingGroups(true);
    setError(null);

    try {
      const data = await queryClient.fetchQuery({
        queryKey: networkKeys.peerGroupsUser(userId),
        staleTime: DEFAULT_STALE_TIME_MS,
        queryFn: async () => {
          const result = await peerGroupsService.getUserGroups(userId);
          if (result.error) throw new Error(result.error.message);
          return result.data ?? [];
        },
      });

      setUserGroups(data);
    } catch (err) {
      console.error("Error loading user groups:", err);
      setError("Failed to load your groups");
    } finally {
      setLoadingGroups(false);
    }
  }, [queryClient, userId]);

  // Load a specific group
  const loadGroup = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      setLoading(true);
      setError(null);
      g.id === groupId
        ? {
            ...g,
            is_member: false,
            membership: null,
            member_count: Math.max(0, (g.member_count ?? 0) - 1),
          }
        : g;
      try {
        const [group, members] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: networkKeys.peerGroupById(userId, groupId),
            staleTime: DEFAULT_STALE_TIME_MS,
            queryFn: async () => {
              const result = await peerGroupsService.getGroup(userId, groupId);
              if (result.error) throw new Error(result.error.message);
              return result.data;
            },
          }),
          queryClient.fetchQuery({
            queryKey: networkKeys.peerGroupMembers(userId, groupId),
            staleTime: DEFAULT_STALE_TIME_MS,
            queryFn: async () => {
              const result = await peerGroupsService.getGroupMembers(
                userId,
                groupId
              );
              if (result.error) throw new Error(result.error.message);
              return result.data ?? [];
            },
          }),
        ]);

        setCurrentGroup(group ?? null);
        setGroupMembers(members);
      } catch (err) {
        console.error("Error loading group:", err);
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    },
    [queryClient, userId]
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
          // Convert PeerGroupRow to PeerGroupWithMembership
          const groupWithMembership: PeerGroupWithMembership = {
            ...result.data,
            is_member: true,
            membership: null, // Will be loaded on next fetch
            member_count: 1, // Creator is the first member
          };

          // Update local state + query cache for list views.
          setGroups((prev) => [groupWithMembership, ...prev]);
          setUserGroups((prev) => [groupWithMembership, ...prev]);

          queryClient.setQueryData<PeerGroupWithMembership[]>(
            networkKeys.peerGroupsList(userId),
            (prev) => [groupWithMembership, ...(prev ?? [])]
          );
          queryClient.setQueryData<PeerGroupWithMembership[]>(
            networkKeys.peerGroupsUser(userId),
            (prev) => [groupWithMembership, ...(prev ?? [])]
          );

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
    [queryClient, userId]
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
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    is_member: true,
                    membership: result.data,
                    member_count: (g.member_count ?? 0) + 1,
                  }
                : g
            )
          );

          queryClient.setQueryData<PeerGroupWithMembership[]>(
            networkKeys.peerGroupsList(userId),
            (prev) =>
              (prev ?? []).map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      is_member: true,
                      membership: result.data,
                      member_count: (g.member_count ?? 0) + 1,
                    }
                  : g
              )
          );

          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupsUser(userId),
          });
          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupById(userId, groupId),
          });

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
    [queryClient, userId]
  );

  // Leave a group
  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!userId) return false;

      setLoading(true);
      setError(null);

      try {
        const result = await peerGroupsService.leaveGroup(userId, groupId);
        if (!result.error) {
          // Update UI
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId ? { ...g, user_membership: null } : g
            )
          );
          setUserGroups((prev) => prev.filter((g) => g.id !== groupId));

          queryClient.setQueryData<PeerGroupWithMembership[]>(
            networkKeys.peerGroupsList(userId),
            (prev) =>
              (prev ?? []).map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      is_member: false,
                      membership: null,
                      member_count: Math.max(0, (g.member_count ?? 0) - 1),
                    }
                  : g
              )
          );
          queryClient.setQueryData<PeerGroupWithMembership[]>(
            networkKeys.peerGroupsUser(userId),
            (prev) => (prev ?? []).filter((g) => g.id !== groupId)
          );
          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupById(userId, groupId),
          });

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
    [queryClient, userId]
  );

  // Load posts for a group
  const loadPosts = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      setPostsGroupId(groupId);

      setLoadingPosts(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: networkKeys.peerGroupPosts(userId, groupId),
          staleTime: DEFAULT_STALE_TIME_MS,
          queryFn: async () => {
            const result = await peerGroupsService.getGroupPosts(
              userId,
              groupId
            );
            if (result.error) throw new Error(result.error.message);
            return result.data ?? [];
          },
        });

        setPosts(data);
      } catch (err) {
        console.error("Error loading posts:", err);
        setError("Failed to load posts");
      } finally {
        setLoadingPosts(false);
      }
    },
    [queryClient, userId]
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
          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupPosts(userId, data.group_id),
          });
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
    [queryClient, userId, loadPosts]
  );

  // Like a post
  const likePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.likePost(userId, postId);
        if (result.data) {
          // Update UI optimistically
          const applyUpdate = (prev: PeerPostWithAuthor[]) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    like_count: (p.like_count ?? 0) + 1,
                    is_liked_by_user: true,
                  }
                : p
            );

          setPosts(applyUpdate);
          if (postsGroupId) {
            queryClient.setQueryData<PeerPostWithAuthor[]>(
              networkKeys.peerGroupPosts(userId, postsGroupId),
              (prev) => applyUpdate(prev ?? [])
            );
          }

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
    [postsGroupId, queryClient, userId]
  );

  // Unlike a post
  const unlikePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.unlikePost(userId, postId);
        if (!result.error) {
          // Update UI optimistically
          const applyUpdate = (prev: PeerPostWithAuthor[]) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    like_count: Math.max(0, (p.like_count ?? 0) - 1),
                    is_liked_by_user: false,
                  }
                : p
            );

          setPosts(applyUpdate);
          if (postsGroupId) {
            queryClient.setQueryData<PeerPostWithAuthor[]>(
              networkKeys.peerGroupPosts(userId, postsGroupId),
              (prev) => applyUpdate(prev ?? [])
            );
          }

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
    [postsGroupId, queryClient, userId]
  );

  // Delete a post
  const deletePost = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.deletePost(userId, postId);
        if (!result.error) {
          // Update UI
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          if (postsGroupId) {
            queryClient.setQueryData<PeerPostWithAuthor[]>(
              networkKeys.peerGroupPosts(userId, postsGroupId),
              (prev) => (prev ?? []).filter((p) => p.id !== postId)
            );
          }
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
    [postsGroupId, queryClient, userId]
  );

  // Load challenges for a group
  const loadChallenges = useCallback(
    async (groupId: string) => {
      if (!userId) return;

      setChallengesGroupId(groupId);

      setLoadingChallenges(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: networkKeys.peerGroupChallenges(userId, groupId),
          staleTime: DEFAULT_STALE_TIME_MS,
          queryFn: async () => {
            const result = await peerGroupsService.getGroupChallenges(
              userId,
              groupId
            );
            if (result.error) throw new Error(result.error.message);
            return result.data ?? [];
          },
        });

        setChallenges(data);
      } catch (err) {
        console.error("Error loading challenges:", err);
        setError("Failed to load challenges");
      } finally {
        setLoadingChallenges(false);
      }
    },
    [queryClient, userId]
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
          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupChallenges(userId, data.group_id),
          });
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
    [queryClient, userId, loadChallenges]
  );

  // Join a challenge
  const joinChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!userId) return false;

      try {
        const result = await peerGroupsService.joinChallenge(
          userId,
          challengeId
        );
        if (result.data) {
          // Update UI
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? {
                    ...c,
                    participation: result.data,
                    is_participating: true,
                    participant_count: (c.participant_count ?? 0) + 1,
                  }
                : c
            )
          );

          if (challengesGroupId) {
            queryClient.setQueryData<ChallengeWithParticipation[]>(
              networkKeys.peerGroupChallenges(userId, challengesGroupId),
              (prev) =>
                (prev ?? []).map((c) =>
                  c.id === challengeId
                    ? {
                        ...c,
                        participation: result.data,
                        is_participating: true,
                        participant_count: (c.participant_count ?? 0) + 1,
                      }
                    : c
                )
            );
          }

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
    [challengesGroupId, queryClient, userId]
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
                      ...(c.participation ?? {}),
                      // Service treats `value` as an increment.
                      current_value:
                        (c.participation?.current_value ?? 0) + value,
                    },
                  }
                : c
            )
          );

          if (challengesGroupId) {
            queryClient.setQueryData<ChallengeWithParticipation[]>(
              networkKeys.peerGroupChallenges(userId, challengesGroupId),
              (prev) =>
                (prev ?? []).map((c) =>
                  c.id === challengeId
                    ? {
                        ...c,
                        participation: {
                          ...(c.participation ?? {}),
                          current_value:
                            (c.participation?.current_value ?? 0) + value,
                        },
                      }
                    : c
                )
            );
          }

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
    [challengesGroupId, queryClient, userId]
  );

  // Load success stories
  const loadSuccessStories = useCallback(async (groupId?: string) => {
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
  }, []);

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

      setReferralsGroupId(groupId);

      setLoading(true);
      setError(null);

      try {
        const data = await queryClient.fetchQuery({
          queryKey: networkKeys.peerGroupReferrals(userId, groupId),
          staleTime: DEFAULT_STALE_TIME_MS,
          queryFn: async () => {
            const result = await peerGroupsService.getGroupReferrals(
              userId,
              groupId
            );
            if (result.error) throw new Error(result.error.message);
            return result.data ?? [];
          },
        });

        setReferrals(data);
      } catch (err) {
        console.error("Error loading referrals:", err);
        setError("Failed to load referrals");
      } finally {
        setLoading(false);
      }
    },
    [queryClient, userId]
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
          queryClient.invalidateQueries({
            queryKey: networkKeys.peerGroupReferrals(userId, data.group_id),
          });
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
    [queryClient, userId, loadReferrals]
  );

  // Express interest in a referral
  const expressInterest = useCallback(
    async (referralId: string, _message?: string): Promise<boolean> => {
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
                    interested_count: (r.interested_count ?? 0) + 1,
                    user_interest: result.data,
                  }
                : r
            )
          );

          if (referralsGroupId) {
            queryClient.setQueryData<PeerReferralWithSharer[]>(
              networkKeys.peerGroupReferrals(userId, referralsGroupId),
              (prev) =>
                (prev ?? []).map((r) =>
                  r.id === referralId
                    ? {
                        ...r,
                        interested_count: (r.interested_count ?? 0) + 1,
                        user_interest: result.data,
                      }
                    : r
                )
            );
          }

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
    [queryClient, referralsGroupId, userId]
  );

  // Load impact summary
  const loadImpactSummary = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await queryClient.fetchQuery({
        queryKey: networkKeys.peerNetworkingImpact(userId),
        staleTime: DEFAULT_STALE_TIME_MS,
        queryFn: async () => {
          const result = await peerGroupsService.getNetworkingImpact(userId);
          if (result.error) throw new Error(result.error.message);
          return result.data;
        },
      });

      setImpactSummary(data ?? null);
    } catch (err) {
      console.error("Error loading impact summary:", err);
      setError("Failed to load impact summary");
    } finally {
      setLoading(false);
    }
  }, [queryClient, userId]);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await queryClient.fetchQuery({
        queryKey: networkKeys.peerSettings(userId),
        staleTime: DEFAULT_STALE_TIME_MS,
        queryFn: async () => {
          const result = await peerGroupsService.getUserPeerSettings(userId);
          if (result.error) throw new Error(result.error.message);
          return result.data;
        },
      });

      setSettings(data ?? null);
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [queryClient, userId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (!userId) return;

    await queryClient.invalidateQueries({ queryKey: networkKeys.peerGroups() });

    await Promise.all([
      loadGroups(),
      loadUserGroups(),
      loadImpactSummary(),
      loadSettings(),
    ]);
  }, [
    queryClient,
    loadGroups,
    loadUserGroups,
    loadImpactSummary,
    loadSettings,
    userId,
  ]);

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
