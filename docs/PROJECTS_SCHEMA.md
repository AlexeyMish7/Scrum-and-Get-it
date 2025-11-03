# Projects Section Schema

## Overview

The Projects section allows users to showcase their professional work with image uploads, metadata, and portfolio organization.

## Database Schema

### `public.projects` Table

| Column               | Type      | Description                          |
| -------------------- | --------- | ------------------------------------ |
| `id`                 | UUID      | Primary key, auto-generated          |
| `user_id`            | UUID      | Foreign key to `auth.users.id`       |
| `proj_name`          | TEXT      | Project name (required)              |
| `proj_description`   | TEXT      | Project description                  |
| `role`               | TEXT      | User's role in the project           |
| `start_date`         | DATE      | Project start date (required)        |
| `end_date`           | DATE      | Project end date (optional)          |
| `tech_and_skills`    | TEXT[]    | Array of technologies used           |
| `project_url`        | TEXT      | Live project URL                     |
| `team_size`          | INTEGER   | Number of team members               |
| `team_details`       | TEXT      | Team collaboration details           |
| `industry_proj_type` | TEXT      | Industry or project category         |
| `proj_outcomes`      | TEXT      | Project results and achievements     |
| `status`             | TEXT      | `planned`, `ongoing`, or `completed` |
| `media_path`         | TEXT      | Storage path for project image       |
| `meta`               | JSONB     | Metadata (preview shape, etc.)       |
| `created_at`         | TIMESTAMP | Auto-generated                       |
| `updated_at`         | TIMESTAMP | Auto-updated                         |

### `public.documents` Integration

Projects link to the documents table for file management:

- `project_id` column references `projects.id`
- Stores uploaded project screenshots
- Enables centralized file cleanup

## Storage Architecture

### Supabase Storage Bucket: `projects`

- **Access**: Private (RLS protected)
- **File Path**: `{user_id}/{timestamp}_{filename}`
- **Supported Formats**: JPEG, PNG, WebP, GIF
- **Size Limit**: 10MB per file
- **Cleanup**: Automatic on project deletion

## Frontend Architecture

### Core Files

- **Types**: `src/types/project.ts` - TypeScript interfaces
- **Service**: `src/services/projects.ts` - CRUD operations
- **Components**: `src/pages/projects/` - UI components
- **Styling**: `src/pages/projects/Projects.css` - Unified theme

### Key Features

- **Interactive Cropping**: Manual image crop with `react-image-crop`
- **Preview Shapes**: Rounded corners or circle thumbnails
- **Real-time Search**: Filter by name, technology, industry
- **Signed URLs**: Secure image access via Supabase storage
- **Print Support**: Professional portfolio printing

### Data Flow

1. **Create/Edit**: Form → Validation → Image Upload → Database Insert → Documents Link
2. **Portfolio View**: Database Query → Image URL Resolution → Grid Display
3. **Delete**: Database Cleanup → Storage Cleanup → Documents Cleanup

## Security

### Row Level Security (RLS)

- Users can only access their own projects
- All queries filtered by `user_id = auth.uid()`
- Storage policies enforce user isolation

### File Security

- Private storage bucket
- Signed URLs with expiration
- File type and size validation
- Automatic cleanup on deletion

## API Patterns

### CRUD Operations

```typescript
// Create
projectsService.insertProject(userId, projectData);

// Read
projectsService.listProjects(userId);
projectsService.getProject(userId, projectId);

// Update
projectsService.updateProject(userId, projectId, updates);

// Delete (with cleanup)
projectsService.deleteProject(userId, projectId);
```

### Media Management

```typescript
// Upload and get signed URL
projectsService.resolveMediaUrl(mediaPath);

// Cleanup on deletion
projectsService.deleteProject(); // Handles both DB and storage
```

## Migration Notes

- **2025-10-26**: Initial projects schema creation
- **2025-10-28**: Added documents.project_id FK for file linking
- Storage DELETE policies ensure proper file cleanup
