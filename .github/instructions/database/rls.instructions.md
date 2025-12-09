# Database RLS Policies Reference

> Complete reference for all Row Level Security (RLS) policies in the FlowATS database.
> All policies are in the `public` schema and use `auth.uid()` for user identification.

---

## Policy Pattern Legend

| Pattern                                      | Description                         |
| -------------------------------------------- | ----------------------------------- |
| `user_id = auth.uid()`                       | User owns the row directly          |
| `EXISTS (SELECT ... FROM team_members)`      | Team-based access check             |
| `is_team_admin(auth.uid(), team_id)`         | Helper function for admin check     |
| `is_peer_group_member(group_id, auth.uid())` | Peer group membership check         |
| `is_family_supporter(user_id, auth.uid())`   | Family supporter relationship check |

---

## Core User Profile Tables

### profiles

| Policy                                             | Command | Expression                                        |
| -------------------------------------------------- | ------- | ------------------------------------------------- |
| Users can view their own profile                   | SELECT  | `id = auth.uid()`                                 |
| Users can create their own profile                 | INSERT  | `id = auth.uid()`                                 |
| Users can update their own profile                 | UPDATE  | `id = auth.uid()`                                 |
| Team members can see other member profiles         | SELECT  | User is in same team (via `get_user_team_ids`)    |
| Team members can see other team member profiles    | SELECT  | Users share a team OR user has pending invitation |
| Users can view profiles of people who invited them | SELECT  | Invited by user with pending invitation           |
| profiles_select_policy                             | SELECT  | `can_view_profile(id)`                            |

### education

| Policy                               | Command | Expression             |
| ------------------------------------ | ------- | ---------------------- |
| Users can view their own education   | SELECT  | `user_id = auth.uid()` |
| Users can create education           | INSERT  | `user_id = auth.uid()` |
| Users can update their own education | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own education | DELETE  | `user_id = auth.uid()` |

### employment

| Policy                                | Command | Expression             |
| ------------------------------------- | ------- | ---------------------- |
| Users can view their own employment   | SELECT  | `user_id = auth.uid()` |
| Users can create employment           | INSERT  | `user_id = auth.uid()` |
| Users can update their own employment | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own employment | DELETE  | `user_id = auth.uid()` |

### skills

| Policy                            | Command | Expression             |
| --------------------------------- | ------- | ---------------------- |
| Users can view their own skills   | SELECT  | `user_id = auth.uid()` |
| Users can create skills           | INSERT  | `user_id = auth.uid()` |
| Users can update their own skills | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own skills | DELETE  | `user_id = auth.uid()` |

### certifications

| Policy                                    | Command | Expression             |
| ----------------------------------------- | ------- | ---------------------- |
| Users can view their own certifications   | SELECT  | `user_id = auth.uid()` |
| Users can create certifications           | INSERT  | `user_id = auth.uid()` |
| Users can update their own certifications | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own certifications | DELETE  | `user_id = auth.uid()` |

### projects

| Policy                              | Command | Expression             |
| ----------------------------------- | ------- | ---------------------- |
| Users can view their own projects   | SELECT  | `user_id = auth.uid()` |
| Users can create projects           | INSERT  | `user_id = auth.uid()` |
| Users can update their own projects | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own projects | DELETE  | `user_id = auth.uid()` |

---

## Job Pipeline Tables

### jobs

| Policy                          | Command | Expression             |
| ------------------------------- | ------- | ---------------------- |
| Users can view their own jobs   | SELECT  | `user_id = auth.uid()` |
| Users can create jobs           | INSERT  | `user_id = auth.uid()` |
| Users can update their own jobs | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own jobs | DELETE  | `user_id = auth.uid()` |

### job_notes

| Policy                               | Command | Expression             |
| ------------------------------------ | ------- | ---------------------- |
| Users can view their own job notes   | SELECT  | `user_id = auth.uid()` |
| Users can create job notes           | INSERT  | `user_id = auth.uid()` |
| Users can update their own job notes | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own job notes | DELETE  | `user_id = auth.uid()` |

### job_time_entries

| Policy                            | Command | Expression             |
| --------------------------------- | ------- | ---------------------- |
| Users can view own time entries   | SELECT  | `auth.uid() = user_id` |
| Users can insert own time entries | INSERT  | `auth.uid() = user_id` |
| Users can update own time entries | UPDATE  | `auth.uid() = user_id` |
| Users can delete own time entries | DELETE  | `auth.uid() = user_id` |

### career_goals

| Policy                           | Command | Expression                                         |
| -------------------------------- | ------- | -------------------------------------------------- |
| Users can view their own goals   | SELECT  | `auth.uid() = user_id`                             |
| Users can insert their own goals | INSERT  | `auth.uid() = user_id`                             |
| Users can update their own goals | UPDATE  | `auth.uid() = user_id` (both USING and WITH CHECK) |
| Users can delete their own goals | DELETE  | `auth.uid() = user_id`                             |

---

## Interview Hub Tables

### interviews

| Policy                                | Command | Expression                                         |
| ------------------------------------- | ------- | -------------------------------------------------- |
| Users can view their own interviews   | SELECT  | `auth.uid() = user_id`                             |
| Users can insert their own interviews | INSERT  | `auth.uid() = user_id`                             |
| Users can update their own interviews | UPDATE  | `auth.uid() = user_id`                             |
| Users can delete their own interviews | DELETE  | `auth.uid() = user_id`                             |
| interviews_select_own                 | SELECT  | `user_id = auth.uid()`                             |
| interviews_insert_own                 | INSERT  | `user_id = auth.uid()`                             |
| interviews_update_own                 | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| interviews_delete_own                 | DELETE  | `user_id = auth.uid()`                             |

### interview_feedback

| Policy                        | Command | Expression                                             |
| ----------------------------- | ------- | ------------------------------------------------------ |
| feedback_select_via_interview | SELECT  | User owns parent interview                             |
| feedback_insert_via_interview | INSERT  | User owns parent interview                             |
| feedback_update_via_interview | UPDATE  | User owns parent interview (both USING and WITH CHECK) |
| feedback_delete_via_interview | DELETE  | User owns parent interview                             |

### preparation_activities

| Policy                     | Command | Expression                                         |
| -------------------------- | ------- | -------------------------------------------------- |
| prep_activities_select_own | SELECT  | `user_id = auth.uid()`                             |
| prep_activities_insert_own | INSERT  | `user_id = auth.uid()`                             |
| prep_activities_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| prep_activities_delete_own | DELETE  | `user_id = auth.uid()`                             |

### informational_interviews

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

---

## Document System Tables

### documents

| Policy                               | Command | Expression             |
| ------------------------------------ | ------- | ---------------------- |
| Users can view accessible documents  | SELECT  | `user_id = auth.uid()` |
| Users can create documents           | INSERT  | `user_id = auth.uid()` |
| Users can update their own documents | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own documents | DELETE  | `user_id = auth.uid()` |

### document_versions

| Policy                                       | Command | Expression             |
| -------------------------------------------- | ------- | ---------------------- |
| Users can view their own document versions   | SELECT  | `user_id = auth.uid()` |
| Users can create document versions           | INSERT  | `user_id = auth.uid()` |
| Users can update their own document versions | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own document versions | DELETE  | `user_id = auth.uid()` |

### document_jobs

| Policy                                                | Command | Expression             |
| ----------------------------------------------------- | ------- | ---------------------- |
| Users can view their own document-job relationships   | SELECT  | `user_id = auth.uid()` |
| Users can create document-job relationships           | INSERT  | `user_id = auth.uid()` |
| Users can update their own document-job relationships | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own document-job relationships | DELETE  | `user_id = auth.uid()` |

### document_reviews

| Policy                                 | Command | Expression                                             |
| -------------------------------------- | ------- | ------------------------------------------------------ |
| Owners can view their document reviews | SELECT  | `auth.uid() = owner_id`                                |
| Reviewers can view assigned reviews    | SELECT  | `auth.uid() = reviewer_id`                             |
| Team mentors can view team reviews     | SELECT  | Team member with admin/mentor role                     |
| Owners can create reviews              | INSERT  | `auth.uid() = owner_id` AND `user_owns_document()`     |
| Owners can update their reviews        | UPDATE  | `auth.uid() = owner_id` (both USING and WITH CHECK)    |
| Reviewers can update assigned reviews  | UPDATE  | `auth.uid() = reviewer_id` (both USING and WITH CHECK) |
| Owners can delete their reviews        | DELETE  | `auth.uid() = owner_id`                                |

### review_comments

| Policy                                       | Command | Expression                                                    |
| -------------------------------------------- | ------- | ------------------------------------------------------------- |
| Users can view comments on their reviews     | SELECT  | User is owner or reviewer of parent review                    |
| Users can add comments to accessible reviews | INSERT  | User is owner or reviewer with comment/suggest/approve access |
| Users can update their own comments          | UPDATE  | `auth.uid() = user_id` (both USING and WITH CHECK)            |
| Owners and authors can resolve comments      | UPDATE  | User is author OR owns parent review                          |
| Users can delete their own comments          | DELETE  | `auth.uid() = user_id`                                        |

### templates

| Policy                               | Command | Expression                                    |
| ------------------------------------ | ------- | --------------------------------------------- |
| Users can view system templates      | SELECT  | `author = 'system'` OR `user_id = auth.uid()` |
| Users can create their own templates | INSERT  | `user_id = auth.uid()` AND `author = 'user'`  |
| Users can update their own templates | UPDATE  | `user_id = auth.uid()` AND `author = 'user'`  |
| Users can delete their own templates | DELETE  | `user_id = auth.uid()` AND `author = 'user'`  |

### export_history

| Policy                                    | Command | Expression             |
| ----------------------------------------- | ------- | ---------------------- |
| Users can view their own export history   | SELECT  | `user_id = auth.uid()` |
| Users can create export history           | INSERT  | `user_id = auth.uid()` |
| Users can update their own export history | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own export history | DELETE  | `user_id = auth.uid()` |

### generation_sessions

| Policy                                         | Command | Expression             |
| ---------------------------------------------- | ------- | ---------------------- |
| Users can view their own generation sessions   | SELECT  | `user_id = auth.uid()` |
| Users can create generation sessions           | INSERT  | `user_id = auth.uid()` |
| Users can update their own generation sessions | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own generation sessions | DELETE  | `user_id = auth.uid()` |

---

## Network Hub Tables

### contacts

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Users can update their own contacts      | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### contact_interactions

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### contact_reminders

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `auth.uid() = user_id`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### networking_events

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### networking_event_contacts

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### references_list

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `user_id = auth.uid()`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

### referral_requests

| Policy                                   | Command | Expression                                  |
| ---------------------------------------- | ------- | ------------------------------------------- |
| Enable users to view their own data only | SELECT  | `auth.uid() = user_id` (authenticated role) |
| Enable insert for users based on user_id | INSERT  | `auth.uid() = user_id`                      |
| Enable update for users based on user_id | UPDATE  | `auth.uid() = user_id`                      |
| Enable delete for users based on user_id | DELETE  | `auth.uid() = user_id`                      |

---

## Team Management Tables

### teams

| Policy                                     | Command | Expression                  |
| ------------------------------------------ | ------- | --------------------------- |
| Members can view their teams               | SELECT  | User is active team member  |
| Owners can view their teams                | SELECT  | `owner_id = auth.uid()`     |
| Invitees can view team they are invited to | SELECT  | User has pending invitation |
| Anyone can create teams                    | INSERT  | `owner_id = auth.uid()`     |
| Owners can update their teams              | UPDATE  | `owner_id = auth.uid()`     |
| Owners can delete their teams              | DELETE  | `owner_id = auth.uid()`     |

### team_members

| Policy                              | Command | Expression                              |
| ----------------------------------- | ------- | --------------------------------------- |
| Team members can see other members  | SELECT  | User shares team OR is the member       |
| Users can join teams via invitation | INSERT  | Has pending invitation OR is team admin |
| Team admins can update members      | UPDATE  | `is_team_admin()` OR self               |
| Team admins can remove members      | DELETE  | `is_team_admin()` OR self               |

### team_invitations

| Policy                                | Command | Expression                          |
| ------------------------------------- | ------- | ----------------------------------- |
| Team members can view invitations     | SELECT  | Invitee OR active team member       |
| Team admins can create invitations    | INSERT  | Active admin of the team            |
| Invitees can update their invitations | UPDATE  | Invitee email/user_id OR team admin |

### team_member_assignments

| Policy                             | Command | Expression                          |
| ---------------------------------- | ------- | ----------------------------------- |
| Team members can view assignments  | SELECT  | Is mentor, candidate, or team admin |
| Team admins can create assignments | INSERT  | Active admin of the team            |
| Team admins can update assignments | UPDATE  | Active admin of the team            |
| Team admins can delete assignments | DELETE  | Active admin of the team            |

### team_messages

| Policy                              | Command | Expression                                           |
| ----------------------------------- | ------- | ---------------------------------------------------- |
| Team members can view messages      | SELECT  | Active team member                                   |
| Team members can send messages      | INSERT  | `sender_id = auth.uid()` AND active team member      |
| Users can update their own messages | UPDATE  | `sender_id = auth.uid()` (both USING and WITH CHECK) |
| Users can delete their own messages | DELETE  | `sender_id = auth.uid()`                             |

### team_settings

| Policy                          | Command | Expression               |
| ------------------------------- | ------- | ------------------------ |
| Team members can view settings  | SELECT  | Active team member       |
| Team admins can manage settings | ALL     | Active admin of the team |

### team_subscriptions

| Policy                               | Command | Expression               |
| ------------------------------------ | ------- | ------------------------ |
| Team admins can view subscriptions   | SELECT  | Active admin of the team |
| Team admins can manage subscriptions | ALL     | Active admin of the team |

### team_activity_log

| Policy                              | Command | Expression              |
| ----------------------------------- | ------- | ----------------------- |
| Team members can view activity logs | SELECT  | Active team member      |
| Enable activity log inserts         | INSERT  | `true` (always allowed) |

---

## Mentor/Mentee Tables

### mentee_goals

| Policy                                           | Command | Expression                         |
| ------------------------------------------------ | ------- | ---------------------------------- |
| Candidates can view their own goals              | SELECT  | `candidate_id = auth.uid()`        |
| Admins can view all team goals                   | SELECT  | Active admin of the team           |
| Mentors can view assigned candidate goals        | SELECT  | Active assignment exists           |
| Candidates can create their own goals            | INSERT  | `candidate_id = auth.uid()`        |
| Mentors can create goals for assigned candidates | INSERT  | Has active assignment              |
| Candidates can update their own goals            | UPDATE  | `candidate_id = auth.uid()`        |
| Mentors can update assigned candidate goals      | UPDATE  | Is mentor OR has active assignment |

### mentor_feedback

| Policy                                              | Command | Expression                                              |
| --------------------------------------------------- | ------- | ------------------------------------------------------- |
| Mentors can view their own feedback                 | SELECT  | `mentor_id = auth.uid()`                                |
| Candidates can view feedback about them             | SELECT  | `candidate_id = auth.uid()`                             |
| Admins can view all team feedback                   | SELECT  | Active admin of the team                                |
| Mentors can create feedback for assigned candidates | INSERT  | Has active assignment                                   |
| Mentors can update their own feedback               | UPDATE  | `mentor_id = auth.uid()`                                |
| Candidates can mark feedback as read                | UPDATE  | `candidate_id = auth.uid()` (both USING and WITH CHECK) |
| Mentors can delete their own feedback               | DELETE  | `mentor_id = auth.uid()`                                |

---

## Progress & Sharing Tables

### progress_sharing_settings

| Policy                                      | Command | Expression                                         |
| ------------------------------------------- | ------- | -------------------------------------------------- |
| Users can view their own sharing settings   | SELECT  | `user_id = auth.uid()`                             |
| Team members can view team sharing settings | SELECT  | Active team member                                 |
| Users can create their own sharing settings | INSERT  | `user_id = auth.uid()`                             |
| Users can update their own sharing settings | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| Users can delete their own sharing settings | DELETE  | `user_id = auth.uid()`                             |

### progress_snapshots

| Policy                                        | Command | Expression                                        |
| --------------------------------------------- | ------- | ------------------------------------------------- |
| Users can view their own snapshots            | SELECT  | `user_id = auth.uid()`                            |
| Mentors can view assigned candidate snapshots | SELECT  | Has active assignment with appropriate visibility |
| Team members can view team-visible snapshots  | SELECT  | Team member with team/public visibility           |
| Accountability partners can view snapshots    | SELECT  | Active partnership with appropriate visibility    |
| Allow snapshot inserts                        | INSERT  | `user_id = auth.uid()` OR `true`                  |

### progress_messages

| Policy                               | Command | Expression                                              |
| ------------------------------------ | ------- | ------------------------------------------------------- |
| Users can view their own messages    | SELECT  | Sender OR recipient                                     |
| Users can send messages              | INSERT  | Sender AND both users share a team                      |
| Senders can update their messages    | UPDATE  | `sender_id = auth.uid()` (both USING and WITH CHECK)    |
| Recipients can mark messages as read | UPDATE  | `recipient_id = auth.uid()` (both USING and WITH CHECK) |
| Users can delete their sent messages | UPDATE  | `sender_id = auth.uid()` AND not deleted                |

### accountability_partnerships

| Policy                                | Command | Expression                                          |
| ------------------------------------- | ------- | --------------------------------------------------- |
| Users can view their partnerships     | SELECT  | `user_id = auth.uid()` OR `partner_id = auth.uid()` |
| Admins can view team partnerships     | SELECT  | Active admin of the team                            |
| Users can create partnership requests | INSERT  | `initiated_by = auth.uid()` AND is participant      |
| Partnership participants can update   | UPDATE  | `user_id = auth.uid()` OR `partner_id = auth.uid()` |
| Initiator can delete pending requests | DELETE  | `initiated_by = auth.uid()` AND status is pending   |

### achievement_celebrations

| Policy                                      | Command | Expression                                |
| ------------------------------------------- | ------- | ----------------------------------------- |
| Users can view their own celebrations       | SELECT  | `user_id = auth.uid()`                    |
| Creators can view celebrations they created | SELECT  | `created_by = auth.uid()`                 |
| Team members can view shared celebrations   | SELECT  | `is_shared = true` AND active team member |
| Allow celebration creation                  | INSERT  | Owner, creator, or creator is null        |
| Users can update their own celebrations     | UPDATE  | `user_id = auth.uid()`                    |
| Team members can react to celebrations      | UPDATE  | `is_shared = true` AND active team member |

---

## Peer Networking Tables

### peer_groups

| Policy                                | Command | Expression                                |
| ------------------------------------- | ------- | ----------------------------------------- |
| Anyone can view public groups         | SELECT  | `is_public = true` AND `is_active = true` |
| Members can view their private groups | SELECT  | `is_peer_group_member()`                  |
| Authenticated users can create groups | INSERT  | `auth.uid() = created_by`                 |
| Group owners can update groups        | UPDATE  | `is_peer_group_admin()`                   |

### peer_group_members

| Policy                                | Command | Expression                          |
| ------------------------------------- | ------- | ----------------------------------- |
| Users can view their own membership   | SELECT  | `user_id = auth.uid()`              |
| Members can view group members        | SELECT  | `is_peer_group_member()`            |
| Users can join public groups          | INSERT  | Self AND group is public and active |
| Users can update their own membership | UPDATE  | `user_id = auth.uid()`              |
| Users can leave groups                | DELETE  | `user_id = auth.uid()`              |

### peer_group_posts

| Policy                         | Command | Expression                     |
| ------------------------------ | ------- | ------------------------------ |
| Members can view group posts   | SELECT  | Not hidden AND is group member |
| Members can create posts       | INSERT  | Is author AND group member     |
| Authors can update their posts | UPDATE  | `author_id = auth.uid()`       |
| Authors can delete their posts | DELETE  | `author_id = auth.uid()`       |

### peer_post_likes

| Policy                   | Command | Expression                |
| ------------------------ | ------- | ------------------------- |
| Users can see post likes | SELECT  | Is member of post's group |
| Users can like posts     | INSERT  | `auth.uid() = user_id`    |
| Users can unlike posts   | DELETE  | `user_id = auth.uid()`    |

### peer_group_challenges

| Policy                        | Command | Expression                  |
| ----------------------------- | ------- | --------------------------- |
| Members can view challenges   | SELECT  | `is_peer_group_member()`    |
| Members can create challenges | INSERT  | Is creator AND group member |
| Challenge creators can update | UPDATE  | `created_by = auth.uid()`   |

### peer_challenge_participants

| Policy                               | Command | Expression                     |
| ------------------------------------ | ------- | ------------------------------ |
| Group members can view participants  | SELECT  | Is member of challenge's group |
| Users can join challenges            | INSERT  | `auth.uid() = user_id`         |
| Users can update their participation | UPDATE  | `user_id = auth.uid()`         |

### peer_referrals

| Policy                           | Command | Expression                 |
| -------------------------------- | ------- | -------------------------- |
| Group members can view referrals | SELECT  | `is_peer_group_member()`   |
| Members can share referrals      | INSERT  | Is sharer AND group member |
| Sharers can update referrals     | UPDATE  | `shared_by = auth.uid()`   |

### peer_referral_interests

| Policy                            | Command | Expression             |
| --------------------------------- | ------- | ---------------------- |
| Users can view referral interests | SELECT  | `user_id = auth.uid()` |
| Users can express interest        | INSERT  | `auth.uid() = user_id` |
| Users can update their interest   | UPDATE  | `user_id = auth.uid()` |

### peer_success_stories

| Policy                           | Command | Expression               |
| -------------------------------- | ------- | ------------------------ |
| Anyone can view approved stories | SELECT  | `is_approved = true`     |
| Users can create stories         | INSERT  | `auth.uid() = author_id` |
| Authors can update stories       | UPDATE  | `author_id = auth.uid()` |

### peer_networking_impact

| Policy                            | Command | Expression             |
| --------------------------------- | ------- | ---------------------- |
| Users can view their own impact   | SELECT  | `user_id = auth.uid()` |
| Users can insert their own impact | INSERT  | `auth.uid() = user_id` |
| Users can update their own impact | UPDATE  | `user_id = auth.uid()` |

### user_peer_settings

| Policy                              | Command | Expression             |
| ----------------------------------- | ------- | ---------------------- |
| Users can view their own settings   | SELECT  | `user_id = auth.uid()` |
| Users can insert their own settings | INSERT  | `auth.uid() = user_id` |
| Users can update their own settings | UPDATE  | `user_id = auth.uid()` |

---

## Family Support Tables

### family_supporters

| Policy                                | Command | Expression                       |
| ------------------------------------- | ------- | -------------------------------- |
| Users can view their own supporters   | SELECT  | `user_id = auth.uid()`           |
| Supporters can view their invitations | SELECT  | `supporter_user_id = auth.uid()` |
| Users can invite supporters           | INSERT  | `user_id = auth.uid()`           |
| Users can update their supporters     | UPDATE  | `user_id = auth.uid()`           |
| Users can remove supporters           | DELETE  | `user_id = auth.uid()`           |

### family_support_settings

| Policy                          | Command | Expression             |
| ------------------------------- | ------- | ---------------------- |
| Users can view their settings   | SELECT  | `user_id = auth.uid()` |
| Users can create their settings | INSERT  | `user_id = auth.uid()` |
| Users can update their settings | UPDATE  | `user_id = auth.uid()` |

### family_milestones

| Policy                                | Command | Expression                                        |
| ------------------------------------- | ------- | ------------------------------------------------- |
| Users can view their milestones       | SELECT  | `user_id = auth.uid()`                            |
| Supporters can view shared milestones | SELECT  | Shared with supporter via `is_family_supporter()` |
| Users can create milestones           | INSERT  | `user_id = auth.uid()`                            |
| Users can update milestones           | UPDATE  | `user_id = auth.uid()`                            |

### family_progress_summaries

| Policy                               | Command | Expression                                        |
| ------------------------------------ | ------- | ------------------------------------------------- |
| Users can view their summaries       | SELECT  | `user_id = auth.uid()`                            |
| Supporters can view shared summaries | SELECT  | Shared with supporter via `is_family_supporter()` |
| Users can create summaries           | INSERT  | `user_id = auth.uid()`                            |

### family_communications

| Policy                                   | Command | Expression                                               |
| ---------------------------------------- | ------- | -------------------------------------------------------- |
| Users can view their communications      | SELECT  | `user_id = auth.uid()`                                   |
| Supporters can view their communications | SELECT  | Sent AND is supporter AND (sent_to_all OR in recipients) |
| Users can create communications          | INSERT  | `user_id = auth.uid()`                                   |

### family_resources

| Policy                    | Command | Expression         |
| ------------------------- | ------- | ------------------ |
| Anyone can view resources | SELECT  | `is_active = true` |

### support_boundaries

| Policy                          | Command | Expression                                       |
| ------------------------------- | ------- | ------------------------------------------------ |
| Users can view their boundaries | SELECT  | `user_id = auth.uid()`                           |
| Supporters can view boundaries  | SELECT  | Shown to supporters AND is supporter AND applies |
| Users can create boundaries     | INSERT  | `user_id = auth.uid()`                           |
| Users can update boundaries     | UPDATE  | `user_id = auth.uid()`                           |
| Users can delete boundaries     | DELETE  | `user_id = auth.uid()`                           |

---

## External Advisor Tables

### external_advisors

| Policy                        | Command | Expression                                               |
| ----------------------------- | ------- | -------------------------------------------------------- |
| external_advisors_user_select | SELECT  | `user_id = auth.uid()` OR `advisor_user_id = auth.uid()` |
| external_advisors_user_insert | INSERT  | `user_id = auth.uid()`                                   |
| external_advisors_user_update | UPDATE  | `user_id = auth.uid()` OR `advisor_user_id = auth.uid()` |
| external_advisors_user_delete | DELETE  | `user_id = auth.uid()`                                   |

### advisor_invitations

| Policy                     | Command | Expression                            |
| -------------------------- | ------- | ------------------------------------- |
| advisor_invitations_select | SELECT  | User or advisor via external_advisors |
| advisor_invitations_insert | INSERT  | `user_id = auth.uid()`                |
| advisor_invitations_update | UPDATE  | User or advisor via external_advisors |

### advisor_sessions

| Policy                  | Command | Expression                                   |
| ----------------------- | ------- | -------------------------------------------- |
| advisor_sessions_select | SELECT  | User or advisor via external_advisors        |
| advisor_sessions_insert | INSERT  | User OR advisor with `can_schedule_sessions` |
| advisor_sessions_update | UPDATE  | User or advisor via external_advisors        |
| advisor_sessions_delete | DELETE  | `user_id = auth.uid()`                       |

### advisor_messages

| Policy                  | Command | Expression                                               |
| ----------------------- | ------- | -------------------------------------------------------- |
| advisor_messages_select | SELECT  | Sender OR user/advisor via external_advisors             |
| advisor_messages_insert | INSERT  | Sender AND advisor relationship with `can_send_messages` |

### advisor_recommendations

| Policy                         | Command | Expression                                     |
| ------------------------------ | ------- | ---------------------------------------------- |
| advisor_recommendations_select | SELECT  | User or advisor via external_advisors          |
| advisor_recommendations_insert | INSERT  | User OR advisor with `can_add_recommendations` |
| advisor_recommendations_update | UPDATE  | User or advisor via external_advisors          |
| advisor_recommendations_delete | DELETE  | `user_id = auth.uid()`                         |

### advisor_shared_materials

| Policy                          | Command | Expression                                   |
| ------------------------------- | ------- | -------------------------------------------- |
| advisor_shared_materials_select | SELECT  | User OR active advisor via external_advisors |
| advisor_shared_materials_insert | INSERT  | `user_id = auth.uid()`                       |
| advisor_shared_materials_update | UPDATE  | User or advisor via external_advisors        |
| advisor_shared_materials_delete | DELETE  | `user_id = auth.uid()`                       |

### advisor_billing

| Policy                 | Command | Expression                            |
| ---------------------- | ------- | ------------------------------------- |
| advisor_billing_select | SELECT  | User or advisor via external_advisors |
| advisor_billing_insert | INSERT  | User or advisor via external_advisors |
| advisor_billing_update | UPDATE  | User or advisor via external_advisors |

---

## Analytics & Caching Tables

### analytics_cache

| Policy                                     | Command | Expression             |
| ------------------------------------------ | ------- | ---------------------- |
| Users can view their own analytics cache   | SELECT  | `user_id = auth.uid()` |
| Users can create analytics cache           | INSERT  | `user_id = auth.uid()` |
| Users can update their own analytics cache | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own analytics cache | DELETE  | `user_id = auth.uid()` |

### confidence_logs

| Policy                     | Command | Expression                                         |
| -------------------------- | ------- | -------------------------------------------------- |
| confidence_logs_select_own | SELECT  | `user_id = auth.uid()`                             |
| confidence_logs_insert_own | INSERT  | `user_id = auth.uid()`                             |
| confidence_logs_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| confidence_logs_delete_own | DELETE  | `user_id = auth.uid()`                             |

### stress_metrics

| Policy                              | Command | Expression             |
| ----------------------------------- | ------- | ---------------------- |
| Users can view their stress metrics | SELECT  | `user_id = auth.uid()` |
| Users can create stress metrics     | INSERT  | `user_id = auth.uid()` |
| Users can update stress metrics     | UPDATE  | `user_id = auth.uid()` |

---

## Company Research Tables

### companies

| Policy                       | Command | Expression                  |
| ---------------------------- | ------- | --------------------------- |
| companies_authenticated_read | SELECT  | `true` (authenticated role) |
| companies_service_role_all   | ALL     | `true` (service_role only)  |

### company_research_cache

| Policy                                    | Command | Expression                  |
| ----------------------------------------- | ------- | --------------------------- |
| company_research_cache_authenticated_read | SELECT  | `true` (authenticated role) |
| company_research_cache_service_role_all   | ALL     | `true` (service_role only)  |

### user_company_notes

| Policy                                   | Command | Expression             |
| ---------------------------------------- | ------- | ---------------------- |
| Users can view their own company notes   | SELECT  | `user_id = auth.uid()` |
| Users can create their own company notes | INSERT  | `user_id = auth.uid()` |
| Users can update their own company notes | UPDATE  | `user_id = auth.uid()` |
| Users can delete their own company notes | DELETE  | `user_id = auth.uid()` |

---

## Competitive Benchmarking Tables

### career_progression_patterns

| Policy                     | Command | Expression               |
| -------------------------- | ------- | ------------------------ |
| career_patterns_read_all   | SELECT  | `auth.uid() IS NOT NULL` |
| career_patterns_admin_only | ALL     | `false` (no access)      |

### industry_standards

| Policy                        | Command | Expression               |
| ----------------------------- | ------- | ------------------------ |
| industry_standards_read_all   | SELECT  | `auth.uid() IS NOT NULL` |
| industry_standards_admin_only | ALL     | `false` (no access)      |

### peer_benchmarks

| Policy                     | Command | Expression               |
| -------------------------- | ------- | ------------------------ |
| peer_benchmarks_read_all   | SELECT  | `auth.uid() IS NOT NULL` |
| peer_benchmarks_admin_only | ALL     | `false` (no access)      |

### user_competitive_position

| Policy                   | Command | Expression                                         |
| ------------------------ | ------- | -------------------------------------------------- |
| user_position_select_own | SELECT  | `user_id = auth.uid()`                             |
| user_position_insert_own | INSERT  | `user_id = auth.uid()`                             |
| user_position_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| user_position_delete_own | DELETE  | `user_id = auth.uid()`                             |

---

## Pattern Recognition Tables

### success_patterns

| Policy                      | Command | Expression                                         |
| --------------------------- | ------- | -------------------------------------------------- |
| success_patterns_select_own | SELECT  | `user_id = auth.uid()`                             |
| success_patterns_insert_own | INSERT  | `user_id = auth.uid()`                             |
| success_patterns_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| success_patterns_delete_own | DELETE  | `user_id = auth.uid()`                             |

### timing_patterns

| Policy                     | Command | Expression                                         |
| -------------------------- | ------- | -------------------------------------------------- |
| timing_patterns_select_own | SELECT  | `user_id = auth.uid()`                             |
| timing_patterns_insert_own | INSERT  | `user_id = auth.uid()`                             |
| timing_patterns_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| timing_patterns_delete_own | DELETE  | `user_id = auth.uid()`                             |

### pattern_evolution

| Policy                       | Command | Expression                                         |
| ---------------------------- | ------- | -------------------------------------------------- |
| pattern_evolution_select_own | SELECT  | `user_id = auth.uid()`                             |
| pattern_evolution_insert_own | INSERT  | `user_id = auth.uid()`                             |
| pattern_evolution_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| pattern_evolution_delete_own | DELETE  | `user_id = auth.uid()`                             |

### strategy_effectiveness

| Policy                            | Command | Expression                                         |
| --------------------------------- | ------- | -------------------------------------------------- |
| strategy_effectiveness_select_own | SELECT  | `user_id = auth.uid()`                             |
| strategy_effectiveness_insert_own | INSERT  | `user_id = auth.uid()`                             |
| strategy_effectiveness_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| strategy_effectiveness_delete_own | DELETE  | `user_id = auth.uid()`                             |

### predictive_models

| Policy                       | Command | Expression                                         |
| ---------------------------- | ------- | -------------------------------------------------- |
| predictive_models_select_own | SELECT  | `user_id = auth.uid()`                             |
| predictive_models_insert_own | INSERT  | `user_id = auth.uid()`                             |
| predictive_models_update_own | UPDATE  | `user_id = auth.uid()` (both USING and WITH CHECK) |
| predictive_models_delete_own | DELETE  | `user_id = auth.uid()`                             |

---

## Enterprise & Cohort Tables

### cohorts

| Policy         | Command | Expression         |
| -------------- | ------- | ------------------ |
| cohorts_select | SELECT  | Active team member |

### cohort_members

| Policy                | Command | Expression                            |
| --------------------- | ------- | ------------------------------------- |
| cohort_members_select | SELECT  | Self OR admin/mentor of cohort's team |

### enterprise_branding

| Policy                     | Command | Expression         |
| -------------------------- | ------- | ------------------ |
| enterprise_branding_select | SELECT  | Active team member |

### program_analytics

| Policy                   | Command | Expression         |
| ------------------------ | ------- | ------------------ |
| program_analytics_select | SELECT  | Active team member |

---

## UI Customization Tables

### themes

| Policy                            | Command | Expression                                    |
| --------------------------------- | ------- | --------------------------------------------- |
| Users can view system themes      | SELECT  | `author = 'system'` OR `user_id = auth.uid()` |
| Users can create their own themes | INSERT  | `user_id = auth.uid()` AND `author = 'user'`  |
| Users can update their own themes | UPDATE  | `user_id = auth.uid()` AND `author = 'user'`  |
| Users can delete their own themes | DELETE  | `user_id = auth.uid()` AND `author = 'user'`  |

---

## RLS Helper Functions Used

| Function                                     | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `auth.uid()`                                 | Returns current authenticated user's UUID  |
| `auth.email()`                               | Returns current authenticated user's email |
| `is_team_admin(user_id, team_id)`            | Checks if user is admin of team            |
| `is_peer_group_member(group_id, user_id)`    | Checks peer group membership               |
| `is_peer_group_admin(group_id, user_id)`     | Checks peer group admin status             |
| `is_family_supporter(user_id, supporter_id)` | Checks family supporter relationship       |
| `get_user_team_ids(user_id)`                 | Returns all team IDs for a user            |
| `has_pending_invitation(email, team_id)`     | Checks for pending team invitation         |
| `user_owns_document(user_id, document_id)`   | Checks document ownership                  |
| `can_view_profile(profile_id)`               | Comprehensive profile view check           |

---

## Common RLS Patterns

### Simple Owner-Based Access

```sql
-- Most common pattern for personal data
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```

### Team-Based Access

```sql
-- Check active team membership
EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.team_id = table.team_id
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
)
```

### Role-Based Team Access

```sql
-- Check for specific team role (admin/mentor)
EXISTS (
  SELECT 1 FROM team_members tm
  WHERE tm.team_id = table.team_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'admin'::team_role_enum
    AND tm.is_active = true
)
```

### Parent Record Access

```sql
-- Access via parent record ownership (e.g., interview_feedback via interviews)
EXISTS (
  SELECT 1 FROM interviews
  WHERE interviews.id = interview_feedback.interview_id
    AND interviews.user_id = auth.uid()
)
```

### Visibility-Based Sharing

```sql
-- Complex visibility with sharing settings
EXISTS (
  SELECT 1 FROM progress_sharing_settings pss
  WHERE pss.user_id = table.user_id
    AND pss.visibility = ANY (ARRAY['team', 'public']::sharing_visibility_enum[])
)
```
