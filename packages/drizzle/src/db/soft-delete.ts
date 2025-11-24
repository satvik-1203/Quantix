import { SQL, and, isNull, sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

/**
 * Soft Delete Helper Functions
 *
 * These utilities help implement soft delete patterns across the application.
 * Soft delete marks records as deleted without removing them from the database,
 * enabling data recovery and audit trails.
 */

/**
 * Creates a WHERE clause to exclude soft-deleted records
 * Usage: db.query.users.findMany({ where: excludeDeleted(users.deletedAt) })
 */
export function excludeDeleted(deletedAtColumn: PgColumn): SQL {
  return isNull(deletedAtColumn);
}

/**
 * Creates a WHERE clause to include ONLY soft-deleted records
 * Usage: db.query.users.findMany({ where: onlyDeleted(users.deletedAt) })
 */
export function onlyDeleted(deletedAtColumn: PgColumn): SQL {
  return sql`${deletedAtColumn} IS NOT NULL`;
}

/**
 * Creates a WHERE clause that combines a condition with excluding deleted records
 * Usage: db.query.users.findMany({ where: withoutDeleted(eq(users.id, 1), users.deletedAt) })
 */
export function withoutDeleted(condition: SQL, deletedAtColumn: PgColumn): SQL {
  return and(condition, excludeDeleted(deletedAtColumn)) as SQL;
}

/**
 * Soft delete update object
 * Usage: db.update(users).set(softDelete()).where(eq(users.id, 1))
 */
export function softDelete() {
  return {
    deletedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Restore (undelete) update object
 * Usage: db.update(users).set(restore()).where(eq(users.id, 1))
 */
export function restore() {
  return {
    deletedAt: null,
    updatedAt: new Date(),
  };
}

/**
 * Hard delete condition - only allow hard delete of already soft-deleted records
 * This prevents accidental permanent deletion of active records
 */
export function canHardDelete(deletedAtColumn: PgColumn): SQL {
  return onlyDeleted(deletedAtColumn);
}
