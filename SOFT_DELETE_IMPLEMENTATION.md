# Soft Delete Implementation Summary

## What Was Done

Added soft delete functionality to enable data recovery and audit trails without permanently deleting records from the database.

## Files Modified

### 1. Schema Updates
**File**: `packages/drizzle/src/db/schema.ts`

Added `deletedAt` timestamp field to:
- `users` table
- `organizations` table
- `test_cases` table
- `sub_tests` table

Added performance indexes:
- `users_deleted_at_index`
- `organizations_deleted_at_index`
- `test_cases_deleted_at_index`
- `sub_tests_deleted_at_index`

### 2. Migration File
**File**: `packages/drizzle/src/db/migrations/0003_add_soft_delete.sql`

SQL migration that:
- Adds `deleted_at` columns to all tables
- Creates indexes for efficient soft delete queries
- Uses `IF NOT EXISTS` for idempotent execution

### 3. Helper Functions
**File**: `packages/drizzle/src/db/soft-delete.ts`

Utility functions for soft delete operations:
- `excludeDeleted()` - Filter out deleted records
- `onlyDeleted()` - Get only deleted records
- `withoutDeleted()` - Combine condition with delete filter
- `softDelete()` - Mark record as deleted
- `restore()` - Undelete a record
- `canHardDelete()` - Safety check for permanent deletion

### 4. Export Updates
**File**: `packages/drizzle/src/db/index.ts`

Added export for soft delete utilities:
```typescript
export * from "./soft-delete";
```

### 5. Service Updates
**File**: `apps/server/src/routers/generate-test/service.ts`

Updated to exclude soft-deleted test cases:
```typescript
import { withoutDeleted } from "@workspace/drizzle";

const testCase = await db.query.testCases.findFirst({
  where: withoutDeleted(eq(testCases.id, testCaseId), testCases.deletedAt),
});
```

### 6. Documentation
**File**: `SOFT_DELETE_GUIDE.md`

Comprehensive guide with:
- Usage examples
- API implementation patterns
- Best practices
- Migration instructions

## How Soft Delete Works

### Active Record (Not Deleted)
```typescript
{
  id: 1,
  name: "Test Case",
  deletedAt: null  // NULL = active
}
```

### Soft Deleted Record
```typescript
{
  id: 1,
  name: "Test Case",
  deletedAt: "2025-11-24T10:30:00Z"  // Timestamp = deleted
}
```

## Usage Examples

### Query Active Records
```typescript
import { db, testCases, excludeDeleted } from "@workspace/drizzle";

const activeTests = await db.query.testCases.findMany({
  where: excludeDeleted(testCases.deletedAt)
});
```

### Soft Delete a Record
```typescript
import { db, testCases, softDelete } from "@workspace/drizzle";
import { eq } from "drizzle-orm";

await db
  .update(testCases)
  .set(softDelete())
  .where(eq(testCases.id, 1));
```

### Restore a Record
```typescript
import { db, testCases, restore } from "@workspace/drizzle";
import { eq } from "drizzle-orm";

await db
  .update(testCases)
  .set(restore())
  .where(eq(testCases.id, 1));
```

## Benefits

1. **Data Recovery**: Users can restore accidentally deleted records
2. **Audit Trail**: Track when records were deleted
3. **Compliance**: Meet regulatory data retention requirements
4. **User Experience**: Implement trash/recycle bin features
5. **Safety**: Prevent accidental permanent data loss

## Migration Instructions

### Development
```bash
cd packages/drizzle
pnpm drizzle-kit push --config=src/drizzle.config.ts
```

### Production
```bash
psql -U postgres -d quantix_db
\i packages/drizzle/src/db/migrations/0003_add_soft_delete.sql
```

## Next Steps

1. **Update All Queries**: Add `excludeDeleted()` to existing database queries
2. **Implement Trash API**: Create endpoints for listing/restoring deleted records
3. **Frontend UI**: Add trash/recycle bin interface
4. **Auto-Purge**: Schedule job to permanently delete old soft-deleted records (e.g., after 30 days)
5. **Track Deleter**: Add `deletedBy` field to know who deleted records

## Rollback

If needed, rollback with:
```sql
ALTER TABLE users DROP COLUMN deleted_at;
ALTER TABLE organizations DROP COLUMN deleted_at;
ALTER TABLE test_cases DROP COLUMN deleted_at;
ALTER TABLE sub_tests DROP COLUMN deleted_at;

DROP INDEX users_deleted_at_index;
DROP INDEX organizations_deleted_at_index;
DROP INDEX test_cases_deleted_at_index;
DROP INDEX sub_tests_deleted_at_index;
```

---

**Implementation Date**: 2025-11-24
**Status**: Complete - Schema, migration, and utilities ready for use
