# Network Hub Workspace Overview

> Professional networking, contacts management, peer support groups, and family support features.

---

## Workspace Path

```
frontend/src/app/workspaces/network_hub/
```

---

## Use Cases

| UC ID  | Feature                | Description                                      |
| ------ | ---------------------- | ------------------------------------------------ |
| UC-106 | Contacts Management    | Professional contacts with relationship tracking |
| UC-107 | Information Interviews | Schedule and track informational interviews      |
| UC-112 | Peer Groups            | Industry-based support groups and challenges     |
| UC-113 | Family Support         | Family-friendly progress sharing and milestones  |

---

## Directory Structure

```
network_hub/
├── components/
│   ├── AddContact/           # Add new contacts
│   ├── ContactDetails/       # Contact detail views
│   ├── ContactsList/         # Contacts list display
│   ├── InformationInterview/ # Informational interview flow
│   ├── Mutuals/              # Mutual connections graph
│   ├── NetworkingEvents/     # Networking events management
│   ├── References/           # Reference management
│   ├── Referral/             # Referral request components
│   ├── RelationshipMaintenance/ # Relationship maintenance tools
│   └── *.tsx                 # Standalone components
├── hooks/                    # Custom React hooks
├── pages/                    # Route-level pages
├── services/                 # Supabase service layer
├── types/                    # TypeScript definitions
└── utils/                    # Utility functions
```

---

## Database Tables

### Contacts System

| Table                  | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `contacts`             | Professional contacts with relationship info |
| `contact_interactions` | Interaction history with contacts            |
| `mutual_connections`   | Mutual connections between contacts          |
| `contact_references`   | Reference history from contacts              |
| `networking_events`    | Networking events attended                   |
| `event_contacts`       | Contacts met at events                       |

### Information Interviews

| Table                      | Purpose                             |
| -------------------------- | ----------------------------------- |
| `informational_interviews` | Scheduled informational interviews  |
| `interview_notes`          | Notes from informational interviews |

### Peer Groups (UC-112)

| Table                     | Purpose                                |
| ------------------------- | -------------------------------------- |
| `peer_groups`             | Support groups by industry/role        |
| `peer_group_members`      | Group membership with privacy settings |
| `peer_group_posts`        | Discussion posts and replies           |
| `peer_post_likes`         | Post likes/reactions                   |
| `peer_group_challenges`   | Accountability challenges              |
| `challenge_participants`  | Challenge participation tracking       |
| `peer_success_stories`    | Shared success stories                 |
| `peer_referrals`          | Job referrals shared in groups         |
| `peer_referral_interests` | Interest in shared referrals           |
| `peer_networking_impact`  | Networking impact metrics              |
| `user_peer_settings`      | Privacy and notification settings      |

### Family Support (UC-113)

| Table                       | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| `family_supporters`         | Family/friend supporters with permissions |
| `family_support_settings`   | Global settings for family feature        |
| `family_progress_summaries` | Family-friendly progress summaries        |
| `family_milestones`         | Shareable achievements                    |
| `family_resources`          | Educational content for supporters        |
| `stress_metrics`            | Well-being and stress tracking            |
| `support_boundaries`        | Healthy support boundary settings         |
| `family_communications`     | Updates sent to supporters                |

---

## Key Patterns

### Privacy-First Design

Family support hides sensitive information by default:

```typescript
// Settings hide salary, rejection details, company names
hide_salary_info: boolean;
hide_rejection_details: boolean;
hide_company_names: boolean;
```

### Anonymous Posting

Peer groups support anonymous contributions:

```typescript
// Posts can be anonymous with privacy levels
is_anonymous: boolean;
privacy_level: "full_name" | "initials_only" | "anonymous";
```

### Relationship Maintenance

Contacts have relationship strength tracking:

```typescript
// Interaction types and frequencies
interaction_type: "email" | "call" | "meeting" | "linkedin" | "other";
relationship_strength: "strong" | "moderate" | "weak" | "new";
```

---

## Routes

| Route                  | Page                   | Description             |
| ---------------------- | ---------------------- | ----------------------- |
| `/network`             | ContactsDashboard      | Main contacts dashboard |
| `/network/contacts`    | ContactsList           | All contacts view       |
| `/network/events`      | EventsPage             | Networking events       |
| `/network/interviews`  | InformationalInterview | Info interviews         |
| `/network/templates`   | TemplatesPage          | Outreach templates      |
| `/network/peer-groups` | PeerGroupsHub          | Peer support groups     |
| `/network/family`      | FamilySupportHub       | Family support hub      |

---

## Import Pattern

```typescript
// Import from workspace
import {
  ContactsList,
  AddContactForm,
  PeerGroupsHub,
  FamilySupportHub,
} from "@workspaces/network_hub/components";

// Import services
import {
  familySupportService,
  peerGroupsService,
} from "@workspaces/network_hub/services";

// Import types
import type {
  FamilySupporterRow,
  PeerGroupRow,
} from "@workspaces/network_hub/types";
```
