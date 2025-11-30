/**
 * PEER NETWORKING SERVICE
 *
 * Handles all database operations for peer networking and support groups.
 * Uses direct Supabase access with RLS enforcement.
 *
 * Features:
 * - Peer group CRUD operations
 * - Group membership management
 * - Discussion posts and replies
 * - Accountability challenges
 * - Referral sharing
 * - Success stories
 */

import { supabase } from "@shared/services/supabaseClient";
import { withUser, insertRow, getRow, updateRow } from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type {
  PeerGroupRow,
  PeerGroupMemberRow,
  PeerDiscussionRow,
  GroupChallengeRow,
  ChallengeParticipantRow,
  PeerReferralRow,
  SuccessStoryRow,
  PeerGroupWithCreator,
  PeerGroupMemberWithProfile,
  PeerDiscussionWithAuthor,
  GroupChallengeWithProgress,
  SuccessStoryWithAuthor,
  UserPeerGroupInfo,
  PeerGroupSearchResult,
  CreatePeerGroupData,
  JoinPeerGroupData,
  CreateDiscussionData,
  CreateChallengeData,
  CreateReferralData,
  CreateSuccessStoryData,
  MemberProfileInfo,
} from "../types";

// ============================================================================
// PEER GROUP OPERATIONS
// ============================================================================

/**
 * Create a new peer group
 * User who creates the group becomes the creator and first moderator
 */
export async function createPeerGroup(
  userId: string,
  data: CreatePeerGroupData
): Promise<Result<PeerGroupRow>> {
  // Create the group
  const groupResult = await insertRow<PeerGroupRow>("peer_groups", {
    name: data.name,
    description: data.description || null,
    group_type: data.group_type,
    visibility: data.visibility || "public",
    industry: data.industry || null,
    role_focus: data.role_focus || null,
    location: data.location || null,
    experience_level: data.experience_level || null,
    created_by: userId,
    settings: {
      allow_anonymous_posts: true,
      require_approval_to_join: false,
      max_members: null,
      allow_referral_sharing: true,
      allow_success_stories: true,
      ...data.settings,
    },
  });

  if (groupResult.error) {
    return { data: null, error: groupResult.error, status: groupResult.status };
  }

  const group = groupResult.data as PeerGroupRow;

  // Add creator as member and moderator
  await insertRow<PeerGroupMemberRow>("peer_group_members", {
    group_id: group.id,
    user_id: userId,
    is_moderator: true,
    is_anonymous: false,
    privacy_settings: {
      share_job_stats: true,
      share_success_stories: true,
      share_company_names: false,
      share_salary_info: false,
      receive_referral_alerts: true,
      receive_challenge_notifications: true,
    },
  });

  return { data: group, error: null, status: 201 };
}

/**
 * Get a specific peer group by ID with creator info
 */
export async function getPeerGroup(
  _userId: string,
  groupId: string
): Promise<Result<PeerGroupWithCreator>> {
  const { data, error } = await supabase
    .from("peer_groups")
    .select(
      `
      *,
      creator:profiles!created_by(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("id", groupId)
    .single();

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type GroupRowWithCreator = PeerGroupRow & {
    creator?: MemberProfileInfo;
  };

  const typedData = data as GroupRowWithCreator;

  return {
    data: {
      ...typedData,
      creator: typedData.creator || undefined,
    },
    error: null,
    status: 200,
  };
}

/**
 * Get user's peer groups
 */
export async function getUserPeerGroups(
  userId: string
): Promise<Result<UserPeerGroupInfo[]>> {
  const { data, error } = await supabase.rpc("get_user_peer_groups", {
    p_user_id: userId,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as UserPeerGroupInfo[], error: null, status: 200 };
}

/**
 * Search for public peer groups
 */
export async function searchPeerGroups(
  searchTerm?: string,
  groupType?: string,
  industry?: string
): Promise<Result<PeerGroupSearchResult[]>> {
  const { data, error } = await supabase.rpc("search_peer_groups", {
    p_search_term: searchTerm || null,
    p_group_type: groupType || null,
    p_industry: industry || null,
  });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as PeerGroupSearchResult[], error: null, status: 200 };
}

/**
 * Update a peer group (only creator or moderators)
 */
export async function updatePeerGroup(
  userId: string,
  groupId: string,
  data: Partial<PeerGroupRow>
): Promise<Result<PeerGroupRow>> {
  const userCrud = withUser(userId);

  const result = await userCrud.updateRow(
    "peer_groups",
    {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.visibility && { visibility: data.visibility }),
      ...(data.settings && { settings: data.settings }),
    },
    { eq: { id: groupId } }
  );

  return result as Result<PeerGroupRow>;
}

/**
 * Delete a peer group (soft delete)
 */
export async function deletePeerGroup(
  userId: string,
  groupId: string
): Promise<Result<boolean>> {
  const result = await updateRow(
    "peer_groups",
    { is_active: false },
    { eq: { id: groupId, created_by: userId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// MEMBERSHIP OPERATIONS
// ============================================================================

/**
 * Join a peer group
 */
export async function joinPeerGroup(
  userId: string,
  data: JoinPeerGroupData
): Promise<Result<PeerGroupMemberRow>> {
  const result = await insertRow<PeerGroupMemberRow>("peer_group_members", {
    group_id: data.group_id,
    user_id: userId,
    display_name: data.display_name || null,
    is_anonymous: data.is_anonymous || false,
    privacy_settings: {
      share_job_stats: true,
      share_success_stories: true,
      share_company_names: false,
      share_salary_info: false,
      receive_referral_alerts: true,
      receive_challenge_notifications: true,
      ...data.privacy_settings,
    },
    is_moderator: false,
  });

  return result as Result<PeerGroupMemberRow>;
}

/**
 * Leave a peer group
 */
export async function leavePeerGroup(
  userId: string,
  groupId: string
): Promise<Result<boolean>> {
  const result = await updateRow(
    "peer_group_members",
    { is_active: false },
    { eq: { group_id: groupId, user_id: userId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

/**
 * Get group members with profiles
 */
export async function getGroupMembers(
  userId: string,
  groupId: string
): Promise<Result<PeerGroupMemberWithProfile[]>> {
  // Verify user is a member first
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("peer_group_members", "id", {
    eq: { group_id: groupId, user_id: userId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  const { data, error } = await supabase
    .from("peer_group_members")
    .select(
      `
      *,
      profile:profiles!user_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("joined_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type MemberRowWithProfile = PeerGroupMemberRow & {
    profile?: MemberProfileInfo;
  };

  return {
    data: (data as MemberRowWithProfile[]).map((m) => ({
      ...m,
      profile: m.is_anonymous
        ? {
            full_name: m.display_name || "Anonymous",
            first_name: null,
            last_name: null,
            email: null,
            professional_title: null,
          }
        : m.profile || {
            full_name: "Unknown User",
            first_name: null,
            last_name: null,
            email: "",
            professional_title: null,
          },
    })) as PeerGroupMemberWithProfile[],
    error: null,
    status: 200,
  };
}

/**
 * Update member privacy settings
 */
export async function updateMemberSettings(
  userId: string,
  groupId: string,
  settings: Partial<PeerGroupMemberRow>
): Promise<Result<PeerGroupMemberRow>> {
  const result = await updateRow<PeerGroupMemberRow>(
    "peer_group_members",
    {
      ...(settings.display_name !== undefined && {
        display_name: settings.display_name,
      }),
      ...(settings.is_anonymous !== undefined && {
        is_anonymous: settings.is_anonymous,
      }),
      ...(settings.privacy_settings && {
        privacy_settings: settings.privacy_settings,
      }),
      last_active_at: new Date().toISOString(),
    },
    { eq: { group_id: groupId, user_id: userId } }
  );

  return result as Result<PeerGroupMemberRow>;
}

// ============================================================================
// DISCUSSION OPERATIONS
// ============================================================================

/**
 * Create a discussion post
 */
export async function createDiscussion(
  userId: string,
  data: CreateDiscussionData
): Promise<Result<PeerDiscussionRow>> {
  const result = await insertRow<PeerDiscussionRow>("peer_discussions", {
    group_id: data.group_id,
    author_id: userId,
    parent_id: data.parent_id || null,
    title: data.title || null,
    content: data.content,
    is_anonymous: data.is_anonymous || false,
    anonymous_display_name: data.anonymous_display_name || null,
    category: data.category || null,
    tags: data.tags || [],
    status: "active",
  });

  // Update member's posts_count
  if (result.data) {
    await supabase.rpc("increment_member_posts", {
      p_group_id: data.group_id,
      p_user_id: userId,
    });
  }

  return result as Result<PeerDiscussionRow>;
}

/**
 * Get discussions for a group
 */
export async function getGroupDiscussions(
  userId: string,
  groupId: string,
  options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Result<PeerDiscussionWithAuthor[]>> {
  // Verify membership
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("peer_group_members", "id", {
    eq: { group_id: groupId, user_id: userId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  let query = supabase
    .from("peer_discussions")
    .select(
      `
      *,
      author:profiles!author_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("group_id", groupId)
    .eq("status", "active")
    .is("parent_id", null) // Only top-level posts
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20));
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Check which discussions user has liked
  const discussionIds = data.map((d: PeerDiscussionRow) => d.id);
  const { data: likes } = await supabase
    .from("peer_discussion_likes")
    .select("discussion_id")
    .eq("user_id", userId)
    .in("discussion_id", discussionIds);

  const likedIds = new Set((likes || []).map((l) => l.discussion_id));

  type DiscussionRowWithAuthor = PeerDiscussionRow & {
    author?: MemberProfileInfo;
  };

  return {
    data: (data as DiscussionRowWithAuthor[]).map((d) => ({
      ...d,
      author: d.is_anonymous
        ? {
            full_name: d.anonymous_display_name || "Anonymous",
            first_name: null,
            last_name: null,
            email: null,
            professional_title: null,
          }
        : d.author || undefined,
      has_liked: likedIds.has(d.id),
    })) as PeerDiscussionWithAuthor[],
    error: null,
    status: 200,
  };
}

/**
 * Get replies to a discussion
 */
export async function getDiscussionReplies(
  userId: string,
  discussionId: string
): Promise<Result<PeerDiscussionWithAuthor[]>> {
  const { data, error } = await supabase
    .from("peer_discussions")
    .select(
      `
      *,
      author:profiles!author_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("parent_id", discussionId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Check likes
  const replyIds = data.map((d: PeerDiscussionRow) => d.id);
  const { data: likes } = await supabase
    .from("peer_discussion_likes")
    .select("discussion_id")
    .eq("user_id", userId)
    .in("discussion_id", replyIds);

  const likedIds = new Set((likes || []).map((l) => l.discussion_id));

  type DiscussionRowWithAuthor = PeerDiscussionRow & {
    author?: MemberProfileInfo;
  };

  return {
    data: (data as DiscussionRowWithAuthor[]).map((d) => ({
      ...d,
      author: d.is_anonymous
        ? {
            full_name: d.anonymous_display_name || "Anonymous",
            first_name: null,
            last_name: null,
            email: null,
            professional_title: null,
          }
        : d.author || undefined,
      has_liked: likedIds.has(d.id),
    })) as PeerDiscussionWithAuthor[],
    error: null,
    status: 200,
  };
}

/**
 * Like a discussion
 */
export async function likeDiscussion(
  userId: string,
  discussionId: string
): Promise<Result<boolean>> {
  const { error } = await supabase.from("peer_discussion_likes").insert({
    discussion_id: discussionId,
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
 * Unlike a discussion
 */
export async function unlikeDiscussion(
  userId: string,
  discussionId: string
): Promise<Result<boolean>> {
  const { error } = await supabase
    .from("peer_discussion_likes")
    .delete()
    .eq("discussion_id", discussionId)
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

// ============================================================================
// CHALLENGE OPERATIONS
// ============================================================================

/**
 * Create a challenge
 */
export async function createChallenge(
  userId: string,
  data: CreateChallengeData
): Promise<Result<GroupChallengeRow>> {
  const result = await insertRow<GroupChallengeRow>("group_challenges", {
    group_id: data.group_id,
    created_by: userId,
    title: data.title,
    description: data.description || null,
    goal_type: data.goal_type,
    goal_target: data.goal_target,
    goal_timeframe_days: data.goal_timeframe_days,
    start_date: data.start_date,
    end_date: data.end_date,
    status: "active",
    settings: {
      allow_late_join: true,
      show_leaderboard: true,
      send_reminders: true,
      reminder_frequency_days: 2,
      ...data.settings,
    },
  });

  return result as Result<GroupChallengeRow>;
}

/**
 * Get challenges for a group
 */
export async function getGroupChallenges(
  userId: string,
  groupId: string,
  status?: string
): Promise<Result<GroupChallengeWithProgress[]>> {
  let query = supabase
    .from("group_challenges")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  // Get user's participation in challenges
  const challengeIds = data.map((c: GroupChallengeRow) => c.id);
  const { data: participations } = await supabase
    .from("challenge_participants")
    .select("challenge_id, current_progress, goal_met")
    .eq("user_id", userId)
    .in("challenge_id", challengeIds);

  const participationMap = new Map(
    (participations || []).map((p) => [p.challenge_id, p])
  );

  return {
    data: data.map((c: GroupChallengeRow) => {
      const participation = participationMap.get(c.id);
      return {
        ...c,
        is_participant: !!participation,
        my_progress: participation?.current_progress,
        my_goal_met: participation?.goal_met,
      };
    }) as GroupChallengeWithProgress[],
    error: null,
    status: 200,
  };
}

/**
 * Join a challenge
 */
export async function joinChallenge(
  userId: string,
  challengeId: string
): Promise<Result<ChallengeParticipantRow>> {
  const result = await insertRow<ChallengeParticipantRow>(
    "challenge_participants",
    {
      challenge_id: challengeId,
      user_id: userId,
      current_progress: 0,
      goal_met: false,
    }
  );

  return result as Result<ChallengeParticipantRow>;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progress: number
): Promise<Result<ChallengeParticipantRow>> {
  // Get challenge to check goal
  const { data: challenge } = await supabase
    .from("group_challenges")
    .select("goal_target")
    .eq("id", challengeId)
    .single();

  const goalMet = challenge && progress >= challenge.goal_target;

  const result = await updateRow<ChallengeParticipantRow>(
    "challenge_participants",
    {
      current_progress: progress,
      goal_met: goalMet,
      goal_met_at: goalMet ? new Date().toISOString() : null,
      last_updated_at: new Date().toISOString(),
    },
    { eq: { challenge_id: challengeId, user_id: userId } }
  );

  return result as Result<ChallengeParticipantRow>;
}

/**
 * Leave a challenge
 */
export async function leaveChallenge(
  userId: string,
  challengeId: string
): Promise<Result<boolean>> {
  const result = await updateRow(
    "challenge_participants",
    { is_active: false },
    { eq: { challenge_id: challengeId, user_id: userId } }
  );

  if (result.error) {
    return { data: null, error: result.error, status: result.status };
  }

  return { data: true, error: null, status: 200 };
}

// ============================================================================
// REFERRAL OPERATIONS
// ============================================================================

/**
 * Share a referral
 */
export async function shareReferral(
  userId: string,
  data: CreateReferralData
): Promise<Result<PeerReferralRow>> {
  const result = await insertRow<PeerReferralRow>("peer_referrals", {
    group_id: data.group_id,
    shared_by: userId,
    company_name: data.company_name,
    job_title: data.job_title,
    job_link: data.job_link || null,
    description: data.description || null,
    is_internal_referral: data.is_internal_referral || false,
    application_deadline: data.application_deadline || null,
  });

  return result as Result<PeerReferralRow>;
}

/**
 * Get referrals for a group
 */
export async function getGroupReferrals(
  userId: string,
  groupId: string
): Promise<Result<PeerReferralRow[]>> {
  // Verify membership
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("peer_group_members", "id", {
    eq: { group_id: groupId, user_id: userId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  const { data, error } = await supabase
    .from("peer_referrals")
    .select("*")
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  return { data: data as PeerReferralRow[], error: null, status: 200 };
}

// ============================================================================
// SUCCESS STORY OPERATIONS
// ============================================================================

/**
 * Share a success story
 */
export async function shareSuccessStory(
  userId: string,
  data: CreateSuccessStoryData
): Promise<Result<SuccessStoryRow>> {
  const result = await insertRow<SuccessStoryRow>("success_stories", {
    group_id: data.group_id,
    author_id: userId,
    title: data.title,
    content: data.content,
    company_name: data.company_name || null,
    job_title: data.job_title || null,
    journey_days: data.journey_days || null,
    applications_submitted: data.applications_submitted || null,
    interviews_completed: data.interviews_completed || null,
    key_learnings: data.key_learnings || null,
    tips_for_others: data.tips_for_others || null,
    is_anonymous: data.is_anonymous || false,
    share_company_name: data.share_company_name || false,
  });

  return result as Result<SuccessStoryRow>;
}

/**
 * Get success stories for a group
 */
export async function getGroupSuccessStories(
  userId: string,
  groupId: string
): Promise<Result<SuccessStoryWithAuthor[]>> {
  // Verify membership
  const userCrud = withUser(userId);
  const accessCheck = await userCrud.getRow("peer_group_members", "id", {
    eq: { group_id: groupId, user_id: userId, is_active: true },
    single: true,
  });

  if (accessCheck.error) {
    return {
      data: null,
      error: { message: "Access denied", status: 403 },
      status: 403,
    };
  }

  const { data, error } = await supabase
    .from("success_stories")
    .select(
      `
      *,
      author:profiles!author_id(full_name, first_name, last_name, email, professional_title)
    `
    )
    .eq("group_id", groupId)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: error.message, status: null },
      status: null,
    };
  }

  type StoryRowWithAuthor = SuccessStoryRow & {
    author?: MemberProfileInfo;
  };

  return {
    data: (data as StoryRowWithAuthor[]).map((s) => ({
      ...s,
      author: s.is_anonymous
        ? {
            full_name: "Anonymous",
            first_name: null,
            last_name: null,
            email: null,
            professional_title: null,
          }
        : s.author || undefined,
    })) as SuccessStoryWithAuthor[],
    error: null,
    status: 200,
  };
}
