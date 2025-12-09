# Network Hub Services

> Service layer for network hub operations using direct Supabase access.

---

## Service Files

| File                      | Purpose                              |
| ------------------------- | ------------------------------------ |
| `familySupportService.ts` | Family supporter management (UC-113) |
| `peerGroupsService.ts`    | Peer groups and challenges (UC-112)  |

---

## Family Support Service (`familySupportService.ts`)

### Supporter Management

| Function                                                | Purpose                                  |
| ------------------------------------------------------- | ---------------------------------------- |
| `getSupporters(userId, filters?)`                       | Get all supporters with optional filters |
| `getActiveSupporters(userId)`                           | Get active supporters only               |
| `getPendingInvitations(userId)`                         | Get pending supporter invitations        |
| `inviteSupporter(userId, data)`                         | Invite new family supporter              |
| `updateSupporterPermissions(userId, supporterId, data)` | Update supporter permissions             |
| `removeSupporter(userId, supporterId)`                  | Remove a supporter                       |
| `resendInvitation(userId, supporterId)`                 | Resend pending invitation                |

### Settings & Dashboard

| Function                                    | Purpose                               |
| ------------------------------------------- | ------------------------------------- |
| `getFamilySupportSettings(userId)`          | Get global family support settings    |
| `updateFamilySupportSettings(userId, data)` | Update family support settings        |
| `getFamilySupportDashboard(userId)`         | Get dashboard data with all summaries |

### Progress Summaries

| Function                                              | Purpose                             |
| ----------------------------------------------------- | ----------------------------------- |
| `getProgressSummaries(userId, filters?)`              | Get progress summaries with filters |
| `createProgressSummary(userId, data)`                 | Create family-friendly summary      |
| `shareProgressSummary(userId, summaryId, supporters)` | Share summary with supporters       |
| `generateAutoSummary(userId, periodType)`             | Auto-generate summary from data     |

### Milestones & Celebrations

| Function                                           | Purpose                         |
| -------------------------------------------------- | ------------------------------- |
| `getMilestones(userId, filters?)`                  | Get milestones with filters     |
| `createMilestone(userId, data)`                    | Create shareable milestone      |
| `shareMilestone(userId, milestoneId, supporters)`  | Share milestone with supporters |
| `addMilestoneReaction(userId, milestoneId, emoji)` | Add reaction to milestone       |

### Stress & Well-being

| Function                              | Purpose                        |
| ------------------------------------- | ------------------------------ |
| `getStressMetrics(userId, filters?)`  | Get stress check-in history    |
| `recordStressCheckIn(userId, data)`   | Record daily stress check-in   |
| `getWellBeingAnalytics(userId, days)` | Get well-being trends          |
| `getStressInsights(userId)`           | Get AI-powered stress insights |

### Support Boundaries

| Function                                   | Purpose                    |
| ------------------------------------------ | -------------------------- |
| `getBoundaries(userId)`                    | Get all support boundaries |
| `createBoundary(userId, data)`             | Create new boundary        |
| `updateBoundary(userId, boundaryId, data)` | Update boundary            |
| `deleteBoundary(userId, boundaryId)`       | Delete boundary            |

### Educational Resources

| Function                          | Purpose                   |
| --------------------------------- | ------------------------- |
| `getResources(filters?)`          | Get educational resources |
| `getFeaturedResources()`          | Get featured resources    |
| `markResourceHelpful(resourceId)` | Mark resource as helpful  |

### Communications

| Function                          | Purpose                   |
| --------------------------------- | ------------------------- |
| `sendCommunication(userId, data)` | Send update to supporters |
| `getCommunicationHistory(userId)` | Get sent communications   |

---

## Peer Groups Service (`peerGroupsService.ts`)

### Group Operations

| Function                             | Purpose                                     |
| ------------------------------------ | ------------------------------------------- |
| `listGroups(userId, filters?)`       | Get available groups with membership status |
| `getUserGroups(userId)`              | Get groups user has joined                  |
| `getGroup(userId, groupId)`          | Get specific group details                  |
| `createGroup(userId, data)`          | Create new peer group                       |
| `updateGroup(userId, groupId, data)` | Update group settings                       |
| `deleteGroup(userId, groupId)`       | Delete group (owner only)                   |

### Membership

| Function                                         | Purpose                              |
| ------------------------------------------------ | ------------------------------------ |
| `joinGroup(userId, data)`                        | Join a peer group                    |
| `leaveGroup(userId, groupId)`                    | Leave a peer group                   |
| `getGroupMembers(groupId, filters?)`             | Get group members                    |
| `updateMembership(userId, groupId, data)`        | Update privacy/notification settings |
| `promoteMember(userId, groupId, memberId, role)` | Promote member to moderator          |
| `removeMember(userId, groupId, memberId)`        | Remove member from group             |

### Discussion Posts

| Function                           | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `getPosts(groupId, filters?)`      | Get group posts with author info |
| `getPost(postId)`                  | Get single post with replies     |
| `createPost(userId, data)`         | Create discussion post           |
| `updatePost(userId, postId, data)` | Update post content              |
| `deletePost(userId, postId)`       | Delete post                      |
| `likePost(userId, postId)`         | Like a post                      |
| `unlikePost(userId, postId)`       | Unlike a post                    |
| `pinPost(userId, postId)`          | Pin post (moderator)             |
| `hidePost(userId, postId, reason)` | Hide post (moderator)            |

### Group Challenges

| Function                                    | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `getChallenges(groupId, filters?)`          | Get group challenges         |
| `getActiveChallenge(groupId)`               | Get current active challenge |
| `createChallenge(userId, data)`             | Create new challenge         |
| `joinChallenge(userId, challengeId)`        | Join a challenge             |
| `updateProgress(userId, challengeId, data)` | Update challenge progress    |
| `getChallengeLeaderboard(challengeId)`      | Get challenge leaderboard    |
| `completeChallenge(userId, challengeId)`    | Mark challenge as completed  |

### Success Stories

| Function                            | Purpose                     |
| ----------------------------------- | --------------------------- |
| `getSuccessStories(filters?)`       | Get success stories         |
| `getGroupSuccessStories(groupId)`   | Get group's success stories |
| `createSuccessStory(userId, data)`  | Share success story         |
| `likeSuccessStory(userId, storyId)` | Like a success story        |
| `getFeaturedStories()`              | Get featured stories        |

### Peer Referrals

| Function                              | Purpose                       |
| ------------------------------------- | ----------------------------- |
| `getReferrals(groupId, filters?)`     | Get job referrals in group    |
| `createReferral(userId, data)`        | Share job referral            |
| `expressInterest(userId, referralId)` | Express interest in referral  |
| `markApplied(userId, referralId)`     | Mark as applied               |
| `getMyReferralInterests(userId)`      | Get user's referral interests |

### Networking Impact

| Function                                         | Purpose                       |
| ------------------------------------------------ | ----------------------------- |
| `getNetworkingImpact(userId, period?)`           | Get networking impact metrics |
| `getImpactSummary(userId)`                       | Get aggregated impact summary |
| `recordNetworkingActivity(userId, activityType)` | Record networking activity    |

### Privacy Settings

| Function                                     | Purpose                       |
| -------------------------------------------- | ----------------------------- |
| `getUserPeerSettings(userId)`                | Get global peer settings      |
| `updateUserPeerSettings(userId, data)`       | Update privacy settings       |
| `updatePrivacyLevel(userId, groupId, level)` | Update group-specific privacy |

---

## Common Patterns

### Filter Objects

```typescript
// Supporter filters
interface SupporterFilters {
  status?: SupporterStatus;
  role?: SupporterRole;
}

// Group filters
interface GroupFilters {
  category?: PeerGroupCategory;
  is_public?: boolean;
  has_coaching?: boolean;
  search?: string;
  min_members?: number;
  max_members?: number;
}

// Challenge filters
interface ChallengeFilters {
  status?: PeerChallengeStatus;
  challenge_type?: ChallengeType;
}
```

### Result Type

```typescript
// All service functions return Result<T>
interface Result<T> {
  data: T | null;
  error: { message: string; status: number | null } | null;
  status: number | null;
}
```

### Permission Handling

```typescript
// Supporter permissions object
interface UpdateSupporterPermissionsData {
  canViewApplications?: boolean;
  canViewInterviews?: boolean;
  canViewProgress?: boolean;
  canViewMilestones?: boolean;
  canViewStress?: boolean;
  canSendEncouragement?: boolean;
  notifyOnMilestones?: boolean;
  notifyOnUpdates?: boolean;
  notifyFrequency?: string;
}
```
