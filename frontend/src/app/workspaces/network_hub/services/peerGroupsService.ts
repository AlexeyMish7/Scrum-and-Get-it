/**
 * PEER GROUPS SERVICE
 *
 * Handles all database operations for peer networking and support groups (UC-112).
 * Uses direct Supabase access with withUser() CRUD wrapper for user-scoped operations.
 *
 * Features:
 * - Group discovery and membership management
 * - Discussion posts with anonymous posting support
 * - Challenge creation and progress tracking
 * - Success story sharing
 * - Peer referral sharing
 * - Networking impact analytics
 */

import { supabase } from "@shared/services/supabaseClient";
import { insertRow, updateRow } from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type {
  PeerGroupRow,
  PeerGroupMemberRow,
  PeerGroupPostRow,
  PeerGroupChallengeRow,
  ChallengeParticipantRow,
  PeerSuccessStoryRow,
  PeerReferralRow,
  PeerReferralInterestRow,
  PeerNetworkingImpactRow,
  UserPeerSettingsRow,
  PeerGroupWithMembership,
  PeerGroupMemberWithProfile,
  PeerPostWithAuthor,
  ChallengeWithParticipation,
  SuccessStoryWithAuthor,
  PeerReferralWithSharer,
  ChallengeLeaderboardEntry,
  ImpactSummary,
  CreatePeerGroupData,
  JoinGroupData,
  CreatePostData,
  CreateChallengeData,
  UpdateProgressData,
  CreateSuccessStoryData,
  CreateReferralData,
  UpdatePrivacySettingsData,
  UpdateMembershipData,
  GroupFilters,
  PostFilters,
  ChallengeFilters,
  SuccessStoryFilters,
  PeerPrivacyLevel,
} from "../types/peerGroups.types";

// ============================================================================
// GROUP OPERATIONS
// ============================================================================

/**
 * Get all available groups with user's membership status
 * Filters by category, search term, etc.
 */
export async function listGroups(
  userId: string,
  filters?: GroupFilters
): Promise<Result<PeerGroupWithMembership[]>> {
  let query = supabase
    .from("peer_groups")
    .select(
      `
      *,
      membership:peer_group_members!left(
        id, user_id, status, role, privacy_level, joined_at
      )
    `
    )
    .eq("is_active", true)
    .order("member_count", { ascending: false });

  // Apply filters
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.is_public !== undefined) {
    query = query.eq("is_public", filters.is_public);
  }
  if (filters?.has_coaching) {
    query = query.eq("has_coaching_sessions", true);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }
  if (filters?.min_members) {
    query = query.gte("member_count", filters.min_members);
  }
  if (filters?.max_members) {
    query = query.lte("member_count", filters.max_members);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Process results to add is_member flag
  type GroupWithMembershipJoin = PeerGroupRow & {
    membership: Array<{
      id: string;
      user_id: string;
      status: string;
      role: string;
      privacy_level: string;
      joined_at: string;
    }>;
  };

  const groups = (data as GroupWithMembershipJoin[]).map((group) => {
    // Find user's membership if exists
    const userMembership = group.membership?.find(
      (m) => m.user_id === userId && m.status === "active"
    );

    return {
      ...group,
      membership: userMembership || null,
      is_member: !!userMembership,
    } as PeerGroupWithMembership;
  });

  return { data: groups, error: null, status: 200 };
}

/**
 * Get groups the user has joined
 */
export async function getUserGroups(
  userId: string
): Promise<Result<PeerGroupWithMembership[]>> {
  const { data, error } = await supabase
    .from("peer_group_members")
    .select(
      `
      *,
      group:peer_groups(*)
    `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_active_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type MemberWithGroup = PeerGroupMemberRow & {
    group: PeerGroupRow;
  };

  const groups = (data as MemberWithGroup[]).map((membership) => ({
    ...membership.group,
    membership: membership,
    is_member: true,
  })) as PeerGroupWithMembership[];

  return { data: groups, error: null, status: 200 };
}

/**
 * Get a specific group with details
 */
export async function getGroup(
  userId: string,
  groupId: string
): Promise<Result<PeerGroupWithMembership>> {
  const { data: group, error } = await supabase
    .from("peer_groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Get user's membership
  const { data: membership } = await supabase
    .from("peer_group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  return {
    data: {
      ...group,
      membership: membership || null,
      is_member: !!membership,
    } as PeerGroupWithMembership,
    error: null,
    status: 200,
  };
}

/**
 * Create a new peer group
 * Creator automatically becomes owner
 */
export async function createGroup(
  userId: string,
  data: CreatePeerGroupData
): Promise<Result<PeerGroupRow>> {
  // Create the group
  const groupResult = await insertRow<PeerGroupRow>("peer_groups", {
    name: data.name,
    description: data.description || null,
    category: data.category,
    is_public: data.is_public ?? true,
    requires_approval: data.requires_approval ?? false,
    max_members: data.max_members || null,
    created_by: userId,
    tags: data.tags || [],
    rules: data.rules || null,
    welcome_message: data.welcome_message || null,
  });

  if (groupResult.error) {
    return { data: null, error: groupResult.error, status: groupResult.status };
  }

  const group = groupResult.data as PeerGroupRow;

  // Add creator as owner member
  await insertRow<PeerGroupMemberRow>("peer_group_members", {
    group_id: group.id,
    user_id: userId,
    status: "active",
    role: "owner",
    privacy_level: "full_name",
    joined_at: new Date().toISOString(),
  });

  return { data: group, error: null, status: 201 };
}

/**
 * Join a peer group
 */
export async function joinGroup(
  userId: string,
  data: JoinGroupData
): Promise<Result<PeerGroupMemberRow>> {
  // Check if already a member
  const { data: existing } = await supabase
    .from("peer_group_members")
    .select("id, status")
    .eq("group_id", data.group_id)
    .eq("user_id", userId)
    .single();

  if (existing && existing.status === "active") {
    return {
      data: null,
      error: { message: "Already a member of this group", status: 400 },
      status: 400,
    };
  }

  // Get user's default privacy settings
  const { data: settings } = await supabase
    .from("user_peer_settings")
    .select("default_privacy_level")
    .eq("user_id", userId)
    .single();

  const privacyLevel: PeerPrivacyLevel =
    data.privacy_level || settings?.default_privacy_level || "full_name";

  // If existing but left, reactivate
  if (existing) {
    const result = await updateRow<PeerGroupMemberRow>(
      "peer_group_members",
      {
        status: "active",
        privacy_level: privacyLevel,
        joined_at: new Date().toISOString(),
        left_at: null,
      },
      { eq: { id: existing.id } }
    );
    return result as Result<PeerGroupMemberRow>;
  }

  // Create new membership
  const result = await insertRow<PeerGroupMemberRow>("peer_group_members", {
    group_id: data.group_id,
    user_id: userId,
    status: "active",
    role: "member",
    privacy_level: privacyLevel,
    joined_at: new Date().toISOString(),
  });

  return result as Result<PeerGroupMemberRow>;
}

/**
 * Leave a peer group
 */
export async function leaveGroup(
  userId: string,
  groupId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("peer_group_members")
    .update({
      status: "left",
      left_at: new Date().toISOString(),
    })
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Get group members
 */
export async function getGroupMembers(
  userId: string,
  groupId: string
): Promise<Result<PeerGroupMemberWithProfile[]>> {
  // Verify user is a member
  const { data: membership } = await supabase
    .from("peer_group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!membership) {
    return {
      data: null,
      error: { message: "Access denied - not a member", status: 403 },
      status: 403,
    };
  }

  const { data, error } = await supabase
    .from("peer_group_members")
    .select(
      `
      *,
      profile:profiles!user_id(
        full_name, first_name, last_name, email, professional_title
      )
    `
    )
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type MemberWithProfile = PeerGroupMemberRow & {
    profile?: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      professional_title: string | null;
    };
  };

  const members = (data as MemberWithProfile[]).map((m) => ({
    ...m,
    profile: m.profile || {
      full_name: "Anonymous",
      first_name: null,
      last_name: null,
      email: null,
      professional_title: null,
    },
  })) as PeerGroupMemberWithProfile[];

  return { data: members, error: null, status: 200 };
}

/**
 * Update membership settings (privacy, notifications)
 */
export async function updateMembership(
  userId: string,
  groupId: string,
  data: UpdateMembershipData
): Promise<Result<PeerGroupMemberRow>> {
  const { data: result, error } = await supabase
    .from("peer_group_members")
    .update({
      ...(data.privacy_level && { privacy_level: data.privacy_level }),
      ...(data.show_activity !== undefined && {
        show_activity: data.show_activity,
      }),
      ...(data.notifications_enabled !== undefined && {
        notifications_enabled: data.notifications_enabled,
      }),
      ...(data.notification_preferences && {
        notification_preferences: data.notification_preferences,
      }),
    })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as PeerGroupMemberRow, error: null, status: 200 };
}

// ============================================================================
// POST OPERATIONS
// ============================================================================

/**
 * Get posts in a group
 */
export async function getGroupPosts(
  userId: string,
  groupId: string,
  filters?: PostFilters
): Promise<Result<PeerPostWithAuthor[]>> {
  let query = supabase
    .from("peer_group_posts")
    .select(
      `
      *,
      author:profiles!author_id(
        full_name, first_name, last_name, professional_title
      ),
      likes:peer_post_likes(user_id)
    `
    )
    .eq("group_id", groupId)
    .eq("is_hidden", false)
    .is("parent_post_id", null) // Only top-level posts
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.post_type) {
    query = query.eq("post_type", filters.post_type);
  }
  if (filters?.author_id) {
    query = query.eq("author_id", filters.author_id);
  }
  if (filters?.is_pinned !== undefined) {
    query = query.eq("is_pinned", filters.is_pinned);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type PostWithJoins = PeerGroupPostRow & {
    author?: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      professional_title: string | null;
    };
    likes?: Array<{ user_id: string }>;
  };

  // Process posts to handle anonymous authors
  const posts = (data as PostWithJoins[]).map((post) => {
    const isLiked =
      post.likes?.some((like) => like.user_id === userId) || false;

    // Handle anonymous posts
    let author = null;
    if (!post.is_anonymous && post.author) {
      author = {
        display_name: post.author.full_name || "User",
        avatar_url: null,
        professional_title: post.author.professional_title,
      };
    } else if (post.is_anonymous) {
      author = {
        display_name: "Anonymous",
        avatar_url: null,
        professional_title: null,
      };
    }

    return {
      ...post,
      author,
      is_liked_by_user: isLiked,
    } as PeerPostWithAuthor;
  });

  return { data: posts, error: null, status: 200 };
}

/**
 * Get replies to a post
 */
export async function getPostReplies(
  userId: string,
  postId: string
): Promise<Result<PeerPostWithAuthor[]>> {
  const { data, error } = await supabase
    .from("peer_group_posts")
    .select(
      `
      *,
      author:profiles!author_id(
        full_name, first_name, last_name, professional_title
      ),
      likes:peer_post_likes(user_id)
    `
    )
    .eq("parent_post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type PostWithJoins = PeerGroupPostRow & {
    author?: {
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
      professional_title: string | null;
    };
    likes?: Array<{ user_id: string }>;
  };

  const replies = (data as PostWithJoins[]).map((post) => {
    const isLiked =
      post.likes?.some((like) => like.user_id === userId) || false;

    let author = null;
    if (!post.is_anonymous && post.author) {
      author = {
        display_name: post.author.full_name || "User",
        avatar_url: null,
        professional_title: post.author.professional_title,
      };
    } else if (post.is_anonymous) {
      author = {
        display_name: "Anonymous",
        avatar_url: null,
        professional_title: null,
      };
    }

    return {
      ...post,
      author,
      is_liked_by_user: isLiked,
    } as PeerPostWithAuthor;
  });

  return { data: replies, error: null, status: 200 };
}

/**
 * Create a new post in a group
 */
export async function createPost(
  userId: string,
  data: CreatePostData
): Promise<Result<PeerGroupPostRow>> {
  const result = await insertRow<PeerGroupPostRow>("peer_group_posts", {
    group_id: data.group_id,
    author_id: userId,
    post_type: data.post_type,
    title: data.title || null,
    content: data.content,
    is_anonymous: data.is_anonymous ?? false,
    parent_post_id: data.parent_post_id || null,
    attachments: data.attachments || [],
  });

  // Update member's post count
  if (result.data) {
    await supabase.rpc("increment_member_posts", {
      p_user_id: userId,
      p_group_id: data.group_id,
    });
  }

  return result as Result<PeerGroupPostRow>;
}

/**
 * Like a post
 */
export async function likePost(
  userId: string,
  postId: string
): Promise<Result<boolean>> {
  const { error } = await supabase.from("peer_post_likes").insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    // Unique constraint violation means already liked
    if (error.code === "23505") {
      return { data: true, error: null, status: 200 };
    }
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 201 };
}

/**
 * Unlike a post
 */
export async function unlikePost(
  userId: string,
  postId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("peer_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Delete own post
 */
export async function deletePost(
  userId: string,
  postId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("peer_group_posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// CHALLENGE OPERATIONS
// ============================================================================

/**
 * Get challenges in a group
 */
export async function getGroupChallenges(
  userId: string,
  groupId: string,
  filters?: ChallengeFilters
): Promise<Result<ChallengeWithParticipation[]>> {
  let query = supabase
    .from("peer_group_challenges")
    .select(
      `
      *,
      participation:peer_challenge_participants!left(
        id, user_id, status, current_value, joined_at
      )
    `
    )
    .eq("group_id", groupId)
    .order("start_date", { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.challenge_type) {
    query = query.eq("challenge_type", filters.challenge_type);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type ChallengeWithJoins = PeerGroupChallengeRow & {
    participation: Array<{
      id: string;
      user_id: string;
      status: string;
      current_value: number;
      joined_at: string;
    }>;
  };

  const challenges = (data as ChallengeWithJoins[]).map((challenge) => {
    const userParticipation = challenge.participation?.find(
      (p) => p.user_id === userId
    );

    return {
      ...challenge,
      participation: userParticipation || null,
      is_participating: !!userParticipation,
    } as ChallengeWithParticipation;
  });

  // Filter by participating only if requested
  const filtered = filters?.participating_only
    ? challenges.filter((c) => c.is_participating)
    : challenges;

  return { data: filtered, error: null, status: 200 };
}

/**
 * Create a new challenge
 */
export async function createChallenge(
  userId: string,
  data: CreateChallengeData
): Promise<Result<PeerGroupChallengeRow>> {
  const startDate = new Date(data.start_date);
  const now = new Date();
  const status = startDate <= now ? "active" : "upcoming";

  const result = await insertRow<PeerGroupChallengeRow>(
    "peer_group_challenges",
    {
      group_id: data.group_id,
      created_by: userId,
      title: data.title,
      description: data.description || null,
      challenge_type: data.challenge_type,
      target_value: data.target_value,
      target_unit: data.target_unit || "count",
      start_date: data.start_date,
      end_date: data.end_date,
      status: status,
      badge_name: data.badge_name || null,
      badge_icon: data.badge_icon || null,
      celebration_message: data.celebration_message || null,
      rules: data.rules || null,
    }
  );

  return result as Result<PeerGroupChallengeRow>;
}

/**
 * Join a challenge
 */
export async function joinChallenge(
  userId: string,
  challengeId: string
): Promise<Result<ChallengeParticipantRow>> {
  // Check if already participating
  const { data: existing } = await supabase
    .from("peer_challenge_participants")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    return {
      data: null,
      error: {
        message: "Already participating in this challenge",
        status: 400,
      },
      status: 400,
    };
  }

  const result = await insertRow<ChallengeParticipantRow>(
    "peer_challenge_participants",
    {
      challenge_id: challengeId,
      user_id: userId,
      status: "joined",
      current_value: 0,
      progress_history: [],
      joined_at: new Date().toISOString(),
    }
  );

  return result as Result<ChallengeParticipantRow>;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  data: UpdateProgressData
): Promise<Result<ChallengeParticipantRow>> {
  // Get current participation
  const { data: participation, error: fetchError } = await supabase
    .from("peer_challenge_participants")
    .select("*, challenge:peer_group_challenges(target_value)")
    .eq("challenge_id", data.challenge_id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !participation) {
    return {
      data: null,
      error: { message: "Not participating in this challenge", status: 404 },
      status: 404,
    };
  }

  // Add to progress history
  const progressHistory = [...(participation.progress_history || [])];
  progressHistory.push({
    date: new Date().toISOString(),
    value: data.value,
    note: data.note || null,
  });

  // Check if completed
  const newValue = participation.current_value + data.value;
  const challenge = participation.challenge as { target_value: number };
  const isCompleted = newValue >= challenge.target_value;

  const { data: result, error } = await supabase
    .from("peer_challenge_participants")
    .update({
      current_value: newValue,
      progress_history: progressHistory,
      status: isCompleted ? "completed" : "in_progress",
      completed_at: isCompleted ? new Date().toISOString() : null,
      last_updated_at: new Date().toISOString(),
    })
    .eq("id", participation.id)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as ChallengeParticipantRow, error: null, status: 200 };
}

/**
 * Get challenge leaderboard
 */
export async function getChallengeLeaderboard(
  challengeId: string,
  limit: number = 10
): Promise<Result<ChallengeLeaderboardEntry[]>> {
  const { data, error } = await supabase
    .from("peer_challenge_participants")
    .select(
      `
      user_id,
      current_value,
      profile:profiles!user_id(full_name)
    `
    )
    .eq("challenge_id", challengeId)
    .order("current_value", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type LeaderboardEntry = {
    user_id: string;
    current_value: number;
    profile?:
      | { full_name: string | null }
      | Array<{ full_name: string | null }>;
  };

  const leaderboard = (data as LeaderboardEntry[]).map((entry, index) => {
    // Handle profile being either object or array from Supabase join
    const profileData = Array.isArray(entry.profile)
      ? entry.profile[0]
      : entry.profile;
    return {
      user_id: entry.user_id,
      display_name: profileData?.full_name || "Anonymous",
      avatar_url: null,
      current_value: entry.current_value,
      rank: index + 1,
    };
  }) as ChallengeLeaderboardEntry[];

  return { data: leaderboard, error: null, status: 200 };
}

// ============================================================================
// SUCCESS STORY OPERATIONS
// ============================================================================

/**
 * Get success stories
 */
export async function getSuccessStories(
  filters?: SuccessStoryFilters
): Promise<Result<SuccessStoryWithAuthor[]>> {
  let query = supabase
    .from("peer_success_stories")
    .select(
      `
      *,
      author:profiles!author_id(full_name)
    `
    )
    .eq("is_approved", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.industry) {
    query = query.eq("industry", filters.industry);
  }
  if (filters?.role_type) {
    query = query.eq("role_type", filters.role_type);
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq("is_featured", filters.is_featured);
  }
  if (filters?.group_id) {
    query = query.eq("group_id", filters.group_id);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type StoryWithAuthor = PeerSuccessStoryRow & {
    author?: { full_name: string | null };
  };

  const stories = (data as StoryWithAuthor[]).map((story) => {
    let author = null;
    if (!story.is_anonymous && story.author) {
      author = {
        display_name: story.author.full_name || "User",
        avatar_url: null,
      };
    } else {
      author = {
        display_name: "Anonymous",
        avatar_url: null,
      };
    }

    return { ...story, author } as SuccessStoryWithAuthor;
  });

  return { data: stories, error: null, status: 200 };
}

/**
 * Share a success story
 */
export async function createSuccessStory(
  userId: string,
  data: CreateSuccessStoryData
): Promise<Result<PeerSuccessStoryRow>> {
  const result = await insertRow<PeerSuccessStoryRow>("peer_success_stories", {
    author_id: userId,
    group_id: data.group_id || null,
    title: data.title,
    story_content: data.story_content,
    is_anonymous: data.is_anonymous ?? false,
    industry: data.industry || null,
    role_type: data.role_type || null,
    job_search_duration_weeks: data.job_search_duration_weeks || null,
    key_learnings: data.key_learnings || [],
    advice_for_others: data.advice_for_others || null,
    helpful_factors: {
      peer_support: data.helpful_factors?.peer_support ?? false,
      group_challenges: data.helpful_factors?.group_challenges ?? false,
      referrals: data.helpful_factors?.referrals ?? false,
      networking: data.helpful_factors?.networking ?? false,
      resume_help: data.helpful_factors?.resume_help ?? false,
      interview_prep: data.helpful_factors?.interview_prep ?? false,
    },
  });

  return result as Result<PeerSuccessStoryRow>;
}

// ============================================================================
// REFERRAL OPERATIONS
// ============================================================================

/**
 * Get referrals in a group
 */
export async function getGroupReferrals(
  userId: string,
  groupId: string
): Promise<Result<PeerReferralWithSharer[]>> {
  const { data, error } = await supabase
    .from("peer_referrals")
    .select(
      `
      *,
      sharer:profiles!shared_by(full_name),
      interests:peer_referral_interests(id, user_id, status)
    `
    )
    .eq("group_id", groupId)
    .eq("status", "shared")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type ReferralWithJoins = PeerReferralRow & {
    sharer?: { full_name: string | null };
    interests?: Array<{ id: string; user_id: string; status: string }>;
  };

  const referrals = (data as ReferralWithJoins[]).map((referral) => {
    const userInterest = referral.interests?.find((i) => i.user_id === userId);

    return {
      ...referral,
      sharer: {
        display_name: referral.sharer?.full_name || "Member",
        avatar_url: null,
      },
      user_interest: userInterest || null,
    } as PeerReferralWithSharer;
  });

  return { data: referrals, error: null, status: 200 };
}

/**
 * Share a referral
 */
export async function createReferral(
  userId: string,
  data: CreateReferralData
): Promise<Result<PeerReferralRow>> {
  const result = await insertRow<PeerReferralRow>("peer_referrals", {
    shared_by: userId,
    group_id: data.group_id,
    job_title: data.job_title,
    company_name: data.company_name,
    job_description: data.job_description || null,
    job_link: data.job_link || null,
    location: data.location || null,
    salary_range: data.salary_range || null,
    is_internal_referral: data.is_internal_referral ?? false,
    referral_notes: data.referral_notes || null,
    application_deadline: data.application_deadline || null,
    status: "shared",
  });

  return result as Result<PeerReferralRow>;
}

/**
 * Express interest in a referral
 */
export async function expressInterest(
  userId: string,
  referralId: string,
  status: "interested" | "applied" = "interested"
): Promise<Result<PeerReferralInterestRow>> {
  // Check if already interested
  const { data: existing } = await supabase
    .from("peer_referral_interests")
    .select("id")
    .eq("referral_id", referralId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing interest
    const { data, error } = await supabase
      .from("peer_referral_interests")
      .update({ status })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: { message: error.message, status: null },
        status: null,
      };
    }

    return { data: data as PeerReferralInterestRow, error: null, status: 200 };
  }

  // Create new interest
  const result = await insertRow<PeerReferralInterestRow>(
    "peer_referral_interests",
    {
      referral_id: referralId,
      user_id: userId,
      status,
    }
  );

  return result as Result<PeerReferralInterestRow>;
}

// ============================================================================
// NETWORKING IMPACT OPERATIONS
// ============================================================================

/**
 * Get user's networking impact summary
 */
export async function getNetworkingImpact(
  userId: string
): Promise<Result<ImpactSummary>> {
  // Get all impact records for this user
  const { data: impactRecords, error } = await supabase
    .from("peer_networking_impact")
    .select("*")
    .eq("user_id", userId)
    .order("period_end", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Get current stats from actual tables
  const { count: groupCount } = await supabase
    .from("peer_group_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  const { count: postCount } = await supabase
    .from("peer_group_posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  const { data: challenges } = await supabase
    .from("peer_challenge_participants")
    .select("status")
    .eq("user_id", userId);

  const completedChallenges =
    challenges?.filter((c) => c.status === "completed").length || 0;

  const { count: referralsShared } = await supabase
    .from("peer_referrals")
    .select("*", { count: "exact", head: true })
    .eq("shared_by", userId);

  const { count: referralsReceived } = await supabase
    .from("peer_referral_interests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Calculate impact score (simple formula)
  const impactScore = Math.min(
    100,
    (groupCount || 0) * 5 +
      (postCount || 0) * 2 +
      completedChallenges * 10 +
      (referralsShared || 0) * 15 +
      (referralsReceived || 0) * 5
  );

  // Determine trend
  let trend: "up" | "down" | "stable" = "stable";
  if (impactRecords && impactRecords.length >= 2) {
    const recent = impactRecords[0] as PeerNetworkingImpactRow;
    const previous = impactRecords[1] as PeerNetworkingImpactRow;
    if (recent.impact_score > previous.impact_score) trend = "up";
    else if (recent.impact_score < previous.impact_score) trend = "down";
  }

  const summary: ImpactSummary = {
    total_groups: groupCount || 0,
    total_posts: postCount || 0,
    total_replies: 0, // Would need separate count
    challenges_completed: completedChallenges,
    referrals_shared: referralsShared || 0,
    referrals_received: referralsReceived || 0,
    interviews_from_peers: 0, // Would need tracking
    offers_from_peers: 0, // Would need tracking
    overall_impact_score: impactScore,
    trend,
  };

  return { data: summary, error: null, status: 200 };
}

// ============================================================================
// USER SETTINGS OPERATIONS
// ============================================================================

/**
 * Get user's peer settings
 */
export async function getUserPeerSettings(
  userId: string
): Promise<Result<UserPeerSettingsRow>> {
  const { data, error } = await supabase
    .from("user_peer_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No settings found, create default
    const defaultSettings = {
      user_id: userId,
      default_privacy_level: "full_name" as PeerPrivacyLevel,
      show_group_memberships: true,
      show_challenge_progress: true,
      show_success_stories: true,
      email_notifications: true,
      push_notifications: true,
      allow_group_invites: true,
      discoverable_in_groups: true,
    };

    const result = await insertRow<UserPeerSettingsRow>(
      "user_peer_settings",
      defaultSettings
    );
    return result as Result<UserPeerSettingsRow>;
  }

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as UserPeerSettingsRow, error: null, status: 200 };
}

/**
 * Update user's peer settings
 */
export async function updateUserPeerSettings(
  userId: string,
  data: UpdatePrivacySettingsData
): Promise<Result<UserPeerSettingsRow>> {
  // First ensure settings exist
  await getUserPeerSettings(userId);

  const { data: result, error } = await supabase
    .from("user_peer_settings")
    .update(data)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: result as UserPeerSettingsRow, error: null, status: 200 };
}
