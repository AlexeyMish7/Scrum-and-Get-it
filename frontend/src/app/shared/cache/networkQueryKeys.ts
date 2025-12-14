/**
 * NETWORK QUERY KEYS
 *
 * Centralized, type-safe query keys for Network Hub features.
 *
 * NOTE: These intentionally use the "network" root (not "core"), so they are
 * NOT persisted to disk by our persistence allowlist. Some Network Hub datasets
 * (posts, replies, etc.) can be high-cardinality and should remain in-memory.
 */

export const networkKeys = {
  all: ["network"] as const,

  peerGroups: () => [...networkKeys.all, "peer_groups"] as const,

  peerGroupsList: (userId: string) =>
    [...networkKeys.peerGroups(), "list", userId] as const,
  peerGroupsUser: (userId: string) =>
    [...networkKeys.peerGroups(), "user_groups", userId] as const,
  peerGroupById: (userId: string, groupId: string) =>
    [...networkKeys.peerGroups(), "by_id", userId, groupId] as const,
  peerGroupMembers: (userId: string, groupId: string) =>
    [...networkKeys.peerGroups(), "members", userId, groupId] as const,

  peerGroupPosts: (userId: string, groupId: string) =>
    [...networkKeys.peerGroups(), "posts", userId, groupId] as const,
  peerPostReplies: (userId: string, postId: string) =>
    [...networkKeys.peerGroups(), "post_replies", userId, postId] as const,

  peerGroupChallenges: (userId: string, groupId: string) =>
    [...networkKeys.peerGroups(), "challenges", userId, groupId] as const,

  peerChallengeLeaderboard: (challengeId: string, limit: number) =>
    [
      ...networkKeys.peerGroups(),
      "challenge_leaderboard",
      challengeId,
      limit,
    ] as const,
  peerGroupReferrals: (userId: string, groupId: string) =>
    [...networkKeys.peerGroups(), "referrals", userId, groupId] as const,

  peerSuccessStories: (groupId?: string) =>
    [...networkKeys.peerGroups(), "success_stories", groupId ?? "all"] as const,

  peerNetworkingImpact: (userId: string) =>
    [...networkKeys.peerGroups(), "impact", userId] as const,
  peerSettings: (userId: string) =>
    [...networkKeys.peerGroups(), "settings", userId] as const,
} as const;
