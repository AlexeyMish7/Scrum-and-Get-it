# Network Hub Components

> React component reference for the network hub workspace.

---

## Directory Structure

```
network_hub/
├── components/
│   ├── AddContact/              # Add contact flow
│   ├── ContactDetails/          # Contact detail views
│   ├── ContactsList/            # Contact list display
│   ├── InformationInterview/    # Info interview components
│   ├── Mutuals/                 # Mutual connections
│   ├── NetworkingEvents/        # Events management
│   ├── References/              # Reference tracking
│   ├── Referral/                # Referral requests
│   ├── RelationshipMaintenance/ # Relationship tools
│   └── *.tsx                    # Standalone components
├── pages/                       # Route-level pages
└── hooks/                       # Custom hooks
```

---

## Add Contact Components (`AddContact/`)

| Component          | Purpose                            |
| ------------------ | ---------------------------------- |
| `AddContactButton` | Button to trigger add contact flow |
| `AddContactForm`   | Form for adding new contacts       |
| `ImportFromGoogle` | Import contacts from Google        |

---

## Contact Details Components (`ContactDetails/`)

| Component              | Purpose                       |
| ---------------------- | ----------------------------- |
| `ContactDetailsDialog` | Full contact detail modal     |
| `ContactEditTab`       | Edit contact information      |
| `ContactMutualsTab`    | View mutual connections       |
| `AddMutualsButton`     | Add mutual connection         |
| `ContactInteractions/` | Interaction history subfolder |

---

## Contacts List Components (`ContactsList/`)

| Component          | Purpose                 |
| ------------------ | ----------------------- |
| `ContactsList`     | Main contacts list view |
| `ContactsListItem` | Individual contact row  |

---

## Information Interview Components (`InformationInterview/`)

| Component                           | Purpose                      |
| ----------------------------------- | ---------------------------- |
| `InformationInterviewButton`        | Trigger info interview flow  |
| `InformationInterviewDialog`        | Create/edit interview dialog |
| `InformationInterviewList`          | List of scheduled interviews |
| `InformationInterviewListItem`      | Individual interview item    |
| `InformationInterviewContactPicker` | Select contact for interview |
| `InformationInterviewJobPicker`     | Select related job           |

---

## Networking Events Components (`NetworkingEvents/`)

| Component       | Purpose                   |
| --------------- | ------------------------- |
| `AddEvent`      | Add networking event form |
| `EventCard`     | Event display card        |
| `EventList`     | List of events            |
| `EventContacts` | Contacts met at event     |

---

## References Components (`References/`)

| Component                | Purpose                      |
| ------------------------ | ---------------------------- |
| `ReferenceHistory`       | Reference history list       |
| `AddReferenceHistory`    | Add reference record         |
| `GenerateReferenceGuide` | AI-generated reference guide |
| `JobSearch`              | Search jobs for reference    |

---

## Referral Components (`Referral/`)

| Component         | Purpose                       |
| ----------------- | ----------------------------- |
| `ReferralRequest` | Request referral from contact |

---

## Relationship Maintenance Components (`RelationshipMaintenance/`)

| Component       | Purpose                       |
| --------------- | ----------------------------- |
| `Actions/`      | Relationship action subfolder |
| `Reminders/`    | Reminder management subfolder |
| `Templates.tsx` | Outreach message templates    |

---

## Mutuals Components (`Mutuals/`)

| Component      | Purpose                            |
| -------------- | ---------------------------------- |
| `MutualsGraph` | Visual graph of mutual connections |

---

## Peer Groups Components (Standalone)

| Component          | Purpose                          |
| ------------------ | -------------------------------- |
| `GroupChallenges`  | Challenge list and participation |
| `GroupDiscussion`  | Discussion posts view            |
| `PeerReferrals`    | Job referrals in groups          |
| `SuccessStories`   | Shared success stories           |
| `NetworkingImpact` | Impact metrics dashboard         |
| `PrivacyControls`  | Privacy settings for groups      |

### Data Fetching (Peer Groups)

- Use TanStack React Query v5 for reads (cache-first) instead of `useEffect` + local loading state.
- Use `networkKeys` from `@shared/cache/networkQueryKeys` so peer group datasets stay in-memory (not persisted to disk).
- After writes (join/leave, like, reply, progress updates), prefer `queryClient.setQueryData()` for instant UI updates and/or `invalidateQueries()` for targeted refresh.

---

## Family Support Components (Standalone)

| Component                 | Purpose                    |
| ------------------------- | -------------------------- |
| `InviteSupporterDialog`   | Invite family supporter    |
| `EditSupporterDialog`     | Edit supporter permissions |
| `CreateMilestoneDialog`   | Create shareable milestone |
| `CreateBoundaryDialog`    | Create support boundary    |
| `StressCheckInDialog`     | Daily stress check-in      |
| `familySupportDialogs.ts` | Dialog exports barrel      |

---

## Shared Components

| Component           | Purpose                        |
| ------------------- | ------------------------------ |
| `ContactFilters`    | Filter controls for contacts   |
| `NetworkHubNavbar/` | Navigation bar for network hub |

---

## Page Components

### Main Pages

| Page                      | Route                 | Purpose                |
| ------------------------- | --------------------- | ---------------------- |
| `ContactsDashboard/`      | `/network`            | Main network dashboard |
| `Events/`                 | `/network/events`     | Networking events page |
| `InformationalInterview/` | `/network/interviews` | Info interviews page   |
| `TemplatesPage/`          | `/network/templates`  | Message templates      |

### Feature Pages

| Page               | Route                  | Purpose                 |
| ------------------ | ---------------------- | ----------------------- |
| `PeerGroupsHub`    | `/network/peer-groups` | Peer groups hub page    |
| `FamilySupportHub` | `/network/family`      | Family support hub page |

---

## Hooks

| Hook               | Purpose                          |
| ------------------ | -------------------------------- |
| `useFamilySupport` | Family support state and actions |
| `usePeerGroups`    | Peer groups state and actions    |
| `useWellBeing`     | Well-being tracking state        |

---

## Component Patterns

### Dialog Pattern

```tsx
// Dialogs receive open state and callbacks
interface InviteSupporterDialogProps {
  open: boolean;
  onClose: () => void;
  onSupporterInvited: (supporter: FamilySupporterRow) => void;
}
```

### List Item Pattern

```tsx
// List items receive data and action callbacks
interface ContactsListItemProps {
  contact: ContactWithInteractions;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

### Filter Pattern

```tsx
// Filters control parent's filter state
interface ContactFiltersProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
}
```

---

## Import Pattern

```typescript
// Import from component folders
import {
  ContactsList,
  ContactsListItem,
} from "@workspaces/network_hub/components/ContactsList";
import { AddContactForm } from "@workspaces/network_hub/components/AddContact";

// Import standalone components
import {
  PeerGroupsHub,
  GroupChallenges,
  SuccessStories,
} from "@workspaces/network_hub/components";

// Import from barrel
import {
  InviteSupporterDialog,
  CreateMilestoneDialog,
} from "@workspaces/network_hub/components/familySupportDialogs";
```
