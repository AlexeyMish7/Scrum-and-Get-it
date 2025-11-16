# Service Layer Standards & Template

This document defines the standards for creating service modules in the application. Services provide a consistent abstraction over data access and business logic.

## Service Responsibilities

A service should:

1. **Abstract data access**: Hide Supabase/API implementation details from components
2. **Transform data**: Map between database rows and domain models
3. **Handle errors**: Return `Result<T>` type, never throw errors to components
4. **Provide type safety**: Fully typed inputs and outputs
5. **Scope to users**: Use `withUser(userId)` for user-owned data
6. **Support pagination**: Provide pagination options for list operations

## Service Template

```typescript
/**
 * [ENTITY] SERVICE
 *
 * Service for managing [entity] data operations.
 * Handles CRUD operations and transforms between DB rows and domain models.
 *
 * Usage:
 *   import { exampleService } from '@shared/services/exampleService';
 *
 *   const res = await exampleService.list(userId);
 *   if (res.error) {
 *     handleError(res.error);
 *     return;
 *   }
 *   const items = res.data;
 */

import { withUser } from "@shared/services/api/crud";
import type { Result } from "@shared/services/api/types";
import type { EntityRow, Entity } from "@shared/types";

// ===== MAPPING FUNCTIONS =====

/**
 * Transform database row to domain model
 * Converts snake_case → camelCase, parses dates, computes fields
 */
function mapRowToDomain(row: EntityRow): Entity {
  return {
    id: row.id,
    // Map all fields from snake_case to camelCase
    someField: row.some_field,
    // Parse dates
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    // Compute derived fields if needed
    displayName: `${row.first_name} ${row.last_name}`,
  };
}

/**
 * Transform domain model to database row (for inserts/updates)
 * Converts camelCase → snake_case, formats dates
 */
function mapDomainToRow(entity: Partial<Entity>): Partial<EntityRow> {
  const row: Partial<EntityRow> = {};

  // Map all fields from camelCase to snake_case
  if (entity.someField !== undefined) row.some_field = entity.someField;

  // Format dates as ISO strings
  if (entity.createdAt) row.created_at = entity.createdAt.toISOString();

  return row;
}

// ===== SERVICE OBJECT =====

export const exampleService = {
  /**
   * List all entities for a user
   *
   * @param userId - User ID to scope query
   * @param options - Optional pagination/filtering
   * @returns Result with array of entities
   */
  async list(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: "created_at" | "updated_at" | "name";
      ascending?: boolean;
    }
  ): Promise<Result<Entity[]>> {
    const crud = withUser(userId);

    const res = await crud.listRows<EntityRow>("entities", "*", {
      order: {
        column: options?.orderBy || "created_at",
        ascending: options?.ascending ?? false,
      },
      limit: options?.limit,
      offset: options?.offset,
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data) return { data: [], error: null };

    const entities = res.data.map(mapRowToDomain);
    return { data: entities, error: null };
  },

  /**
   * Get a single entity by ID
   *
   * @param userId - User ID to scope query
   * @param entityId - Entity ID to fetch
   * @returns Result with entity or null if not found
   */
  async get(userId: string, entityId: string): Promise<Result<Entity | null>> {
    const crud = withUser(userId);

    const res = await crud.getRow<EntityRow>("entities", "*", {
      eq: { id: entityId },
      single: true,
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data) return { data: null, error: null };

    const entity = mapRowToDomain(res.data);
    return { data: entity, error: null };
  },

  /**
   * Create a new entity
   *
   * @param userId - User ID (owner of entity)
   * @param data - Entity data (without id, timestamps)
   * @returns Result with created entity
   */
  async create(
    userId: string,
    data: Omit<Entity, "id" | "createdAt" | "updatedAt">
  ): Promise<Result<Entity>> {
    const crud = withUser(userId);

    const payload = mapDomainToRow(data);
    const res = await crud.insertRow<EntityRow>("entities", payload);

    if (res.error) return { data: null, error: res.error };
    if (!res.data)
      return { data: null, error: { message: "No data returned" } };

    const entity = mapRowToDomain(res.data);
    return { data: entity, error: null };
  },

  /**
   * Update an existing entity
   *
   * @param userId - User ID to scope query
   * @param entityId - Entity ID to update
   * @param data - Partial entity data to update
   * @returns Result with updated entity
   */
  async update(
    userId: string,
    entityId: string,
    data: Partial<Omit<Entity, "id" | "createdAt" | "updatedAt">>
  ): Promise<Result<Entity>> {
    const crud = withUser(userId);

    const payload = mapDomainToRow(data);
    const res = await crud.updateRow<EntityRow>("entities", payload, {
      eq: { id: entityId },
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data)
      return { data: null, error: { message: "Entity not found" } };

    const entity = mapRowToDomain(res.data);
    return { data: entity, error: null };
  },

  /**
   * Delete an entity
   *
   * @param userId - User ID to scope query
   * @param entityId - Entity ID to delete
   * @returns Result with null data on success
   */
  async delete(userId: string, entityId: string): Promise<Result<null>> {
    const crud = withUser(userId);

    const res = await crud.deleteRow("entities", { eq: { id: entityId } });

    if (res.error) return { data: null, error: res.error };
    return { data: null, error: null };
  },

  // ===== HELPER/UTILITY METHODS =====

  /**
   * Search entities by name/description
   *
   * @param userId - User ID to scope query
   * @param searchTerm - Search term
   * @returns Result with matching entities
   */
  async search(userId: string, searchTerm: string): Promise<Result<Entity[]>> {
    const crud = withUser(userId);

    const res = await crud.listRows<EntityRow>("entities", "*", {
      ilike: { name: `%${searchTerm}%` },
      order: { column: "name", ascending: true },
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data) return { data: [], error: null };

    const entities = res.data.map(mapRowToDomain);
    return { data: entities, error: null };
  },
};

export default exampleService;
```

## Service Standards Checklist

When creating a new service, ensure:

- [ ] All functions are async and return `Promise<Result<T>>`
- [ ] All user-scoped operations use `withUser(userId)`
- [ ] Database rows are mapped to domain models (no raw DB objects in components)
- [ ] Dates are converted from ISO strings to Date objects
- [ ] Snake_case DB fields are converted to camelCase
- [ ] Service has clear JSDoc comments explaining each method
- [ ] Service exports a single default object with methods
- [ ] Error handling never throws (always returns Result type)
- [ ] Pagination support for list operations
- [ ] Type imports use `import type` for types

## Service Naming Conventions

- **File**: `[entity]Service.ts` (e.g., `profileService.ts`, `jobsService.ts`)
- **Object**: `[entity]Service` (e.g., `profileService`, `jobsService`)
- **Methods**: CRUD operations use standard names:
  - `list()` - Get all entities (with pagination)
  - `get()` - Get single entity by ID
  - `create()` - Create new entity
  - `update()` - Update existing entity
  - `delete()` - Delete entity
  - Additional methods as needed (e.g., `search()`, `archive()`)

## Testing Services

Every service should have a corresponding test file:

```typescript
// exampleService.test.ts
import { describe, it, expect, vi } from "vitest";
import { exampleService } from "./exampleService";

describe("exampleService", () => {
  describe("mapRowToDomain", () => {
    it("should transform DB row to domain model", () => {
      // Test mapping logic
    });
  });

  describe("list", () => {
    it("should return all entities for user", async () => {
      // Test list functionality
    });

    it("should handle pagination", async () => {
      // Test pagination
    });
  });

  // ... more tests
});
```

## Common Patterns

### Handling Optional Fields

```typescript
function mapRowToDomain(row: EntityRow): Entity {
  return {
    id: row.id,
    // Optional fields use optional chaining or conditional
    description: row.description ?? undefined,
    endDate: row.end_date ? new Date(row.end_date) : undefined,
  };
}
```

### Computed Fields

```typescript
function mapRowToDomain(row: EntityRow): Entity {
  const startDate = new Date(row.start_date);
  const endDate = row.end_date ? new Date(row.end_date) : new Date();

  return {
    id: row.id,
    startDate,
    endDate: row.end_date ? endDate : undefined,
    // Computed field
    duration: calculateDuration(startDate, endDate),
  };
}
```

### Nested Objects

```typescript
function mapRowToDomain(row: JobRow): Job {
  return {
    id: row.id,
    // Nested location object
    location: {
      street: row.street_address,
      city: row.city_name,
      state: row.state_code,
      zipcode: row.zipcode,
    },
    // Nested salary range
    salaryRange:
      row.start_salary_range && row.end_salary_range
        ? {
            min: row.start_salary_range,
            max: row.end_salary_range,
          }
        : undefined,
  };
}
```

## Integration with Components

Components should use services via hooks:

```typescript
// In component
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { exampleService } from "@shared/services/exampleService";

function MyComponent() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      const res = await exampleService.list(user.id);
      if (res.error) {
        handleError(res.error);
        return;
      }
      setItems(res.data);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  // ... render
}
```

---

**Last Updated**: November 15, 2025
**Maintained By**: Development Team
