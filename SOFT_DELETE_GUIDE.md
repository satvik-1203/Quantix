# Soft Delete Implementation Guide

## Overview

Soft delete allows marking records as deleted without permanently removing them from the database. This enables data recovery, audit trails, and compliance requirements.

## Database Changes

### Added Fields

All major tables now have a `deleted_at` timestamp field:
- `users.deleted_at`
- `organizations.deleted_at`
- `test_cases.deleted_at`
- `sub_tests.deleted_at`

When `deleted_at` is NULL, the record is active. When it has a timestamp, the record is soft-deleted.

### Indexes

Performance indexes added for efficient queries:
- `users_deleted_at_index`
- `organizations_deleted_at_index`
- `test_cases_deleted_at_index`
- `sub_tests_deleted_at_index`

## Usage Examples

### Import Helper Functions

```typescript
import {
  db,
  testCases,
  excludeDeleted,
  onlyDeleted,
  withoutDeleted,
  softDelete,
  restore
} from "@workspace/drizzle";
import { eq } from "drizzle-orm";
```

### Query Active Records Only (Exclude Deleted)

```typescript
// Get all active test cases (excludes soft-deleted)
const activeTestCases = await db.query.testCases.findMany({
  where: excludeDeleted(testCases.deletedAt)
});

// Get specific active test case
const testCase = await db.query.testCases.findFirst({
  where: withoutDeleted(
    eq(testCases.id, testCaseId),
    testCases.deletedAt
  )
});
```

### Query Deleted Records Only

```typescript
// Get all soft-deleted test cases (for trash/recycle bin)
const deletedTestCases = await db.query.testCases.findMany({
  where: onlyDeleted(testCases.deletedAt)
});
```

### Soft Delete a Record

```typescript
// Soft delete a test case
await db
  .update(testCases)
  .set(softDelete())
  .where(eq(testCases.id, testCaseId));

// The record still exists in DB but deleted_at is set to current timestamp
```

### Restore a Soft-Deleted Record

```typescript
// Restore a soft-deleted test case
await db
  .update(testCases)
  .set(restore())
  .where(eq(testCases.id, testCaseId));

// Sets deleted_at back to NULL, making it active again
```

### Hard Delete (Permanent)

```typescript
// Only hard delete records that are already soft-deleted
// This prevents accidental permanent deletion of active records
await db
  .delete(testCases)
  .where(
    and(
      eq(testCases.id, testCaseId),
      onlyDeleted(testCases.deletedAt)
    )
  );
```

## API Implementation Examples

### Delete Endpoint (Soft Delete)

```typescript
// DELETE /api/test-cases/:id
export async function deleteTestCase(req, res) {
  const { id } = req.params;

  await db
    .update(testCases)
    .set(softDelete())
    .where(
      and(
        eq(testCases.id, id),
        eq(testCases.organizationId, req.user.organizationId)
      )
    );

  return res.json({ message: "Test case deleted successfully" });
}
```

### Restore Endpoint

```typescript
// POST /api/test-cases/:id/restore
export async function restoreTestCase(req, res) {
  const { id } = req.params;

  await db
    .update(testCases)
    .set(restore())
    .where(
      and(
        eq(testCases.id, id),
        eq(testCases.organizationId, req.user.organizationId)
      )
    );

  return res.json({ message: "Test case restored successfully" });
}
```

### List Active Records

```typescript
// GET /api/test-cases
export async function listTestCases(req, res) {
  const cases = await db.query.testCases.findMany({
    where: and(
      eq(testCases.organizationId, req.user.organizationId),
      excludeDeleted(testCases.deletedAt)
    )
  });

  return res.json(cases);
}
```

### Trash/Recycle Bin Endpoint

```typescript
// GET /api/test-cases/trash
export async function listDeletedTestCases(req, res) {
  const deletedCases = await db.query.testCases.findMany({
    where: and(
      eq(testCases.organizationId, req.user.organizationId),
      onlyDeleted(testCases.deletedAt)
    ),
    orderBy: desc(testCases.deletedAt)
  });

  return res.json(deletedCases);
}
```

### Permanent Delete (Admin Only)

```typescript
// DELETE /api/test-cases/:id/permanent
export async function permanentDeleteTestCase(req, res) {
  const { id } = req.params;

  // Only admins can permanently delete
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Can only hard delete already soft-deleted records
  const result = await db
    .delete(testCases)
    .where(
      and(
        eq(testCases.id, id),
        onlyDeleted(testCases.deletedAt)
      )
    );

  return res.json({ message: "Test case permanently deleted" });
}
```

## Migration Instructions

### Development Environment

```bash
cd packages/drizzle
pnpm drizzle-kit push --config=src/drizzle.config.ts
```

### Production Environment

```bash
psql -U postgres -d quantix_db
\i packages/drizzle/src/db/migrations/0003_add_soft_delete.sql
```

## Benefits

1. **Data Recovery**: Users can restore accidentally deleted records
2. **Audit Trail**: Know when records were deleted and by whom (if you add deletedBy field)
3. **Compliance**: Meet regulatory requirements for data retention
4. **User Experience**: Implement "Trash" or "Recycle Bin" features
5. **Safety**: Prevent accidental permanent data loss

## Best Practices

### Always Filter by deleted_at

Update all existing queries to exclude deleted records:

```typescript
// Before
const testCases = await db.query.testCases.findMany();

// After
const testCases = await db.query.testCases.findMany({
  where: excludeDeleted(testCases.deletedAt)
});
```

### Cascade Soft Deletes

When soft-deleting a parent record, consider soft-deleting children:

```typescript
async function softDeleteTestCaseWithSubTests(testCaseId: number) {
  // Soft delete the test case
  await db
    .update(testCases)
    .set(softDelete())
    .where(eq(testCases.id, testCaseId));

  // Soft delete all its sub tests
  await db
    .update(subTests)
    .set(softDelete())
    .where(eq(subTests.testCaseId, testCaseId));
}
```

### Auto-Purge Old Deleted Records

Set up a scheduled job to permanently delete old soft-deleted records:

```typescript
// Run this daily via cron job
async function purgeOldDeletedRecords() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Permanently delete test cases soft-deleted over 30 days ago
  await db
    .delete(testCases)
    .where(
      and(
        onlyDeleted(testCases.deletedAt),
        sql`${testCases.deletedAt} < ${thirtyDaysAgo}`
      )
    );
}
```

### Track Who Deleted

Add a `deletedBy` field for accountability:

```typescript
// In schema.ts (future enhancement)
export const testCases = pgTable("test_cases", {
  // ... other fields
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by").references(() => users.id),
});

// When deleting
await db
  .update(testCases)
  .set({
    deletedAt: new Date(),
    deletedBy: req.user.id,
    updatedAt: new Date()
  })
  .where(eq(testCases.id, testCaseId));
```

## Rollback Instructions

If you need to remove soft delete functionality:

```sql
-- Remove deleted_at columns
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE organizations DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE test_cases DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sub_tests DROP COLUMN IF EXISTS deleted_at;

-- Remove indexes
DROP INDEX IF EXISTS users_deleted_at_index;
DROP INDEX IF EXISTS organizations_deleted_at_index;
DROP INDEX IF EXISTS test_cases_deleted_at_index;
DROP INDEX IF EXISTS sub_tests_deleted_at_index;
```

## Next Steps

1. Update all existing query endpoints to use `excludeDeleted()`
2. Add trash/recycle bin UI components
3. Implement restore functionality in frontend
4. Add scheduled job for auto-purging old deleted records
5. Consider adding `deletedBy` field to track who deleted records
6. Add admin panel for viewing/managing all deleted records

---

Implementation Date: 2025-11-24
Status: Schema and migration completed
