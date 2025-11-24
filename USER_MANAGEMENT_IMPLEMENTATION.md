# User and Organization Management Implementation

## Completed Work

### 1. Database Schema Updates

Added the following tables in `packages/drizzle/src/db/schema.ts`:

#### users table - User information
```typescript
- id: Primary key
- email: Email address (unique)
- name: User name
- passwordHash: Password hash
- role: Role (admin | user | viewer)
- emailVerified: Email verification status
- createdAt: Creation timestamp
- updatedAt: Update timestamp
```

#### organizations table - Organizations/Teams
```typescript
- id: Primary key
- name: Organization name
- slug: URL-friendly identifier
- createdAt: Creation timestamp
- updatedAt: Update timestamp
```

#### user_organizations table - User-Organization relationship
```typescript
- userId: User ID (foreign key)
- organizationId: Organization ID (foreign key)
- role: Role within organization (owner | admin | member)
- createdAt: Join timestamp
- Composite primary key: (userId, organizationId)
```

#### test_cases table updates - Multi-tenancy support
```typescript
New fields:
- userId: Creator ID (foreign key, nullable)
- organizationId: Organization ID (foreign key)
```

### 2. Database Migration File

Created migration file: `packages/drizzle/src/db/migrations/0002_add_user_and_organization_tables.sql`

Includes:
- CREATE statements for users, organizations, user_organizations tables
- All necessary foreign key constraints
- Performance optimization indexes
- test_cases table structure updates

### 3. Index Optimization

Added the following indexes for query performance:
- `users_email_index` - Fast email lookups
- `user_orgs_user_index` - User organization list queries
- `user_orgs_org_index` - Organization member list queries
- `test_cases_user_index` - User test case queries
- `test_cases_org_index` - Organization test case queries
- `test_cases_created_at_index` - Time-based sorting queries

---

## How to Apply Migration

### Method 1: Using Drizzle Kit Push (Recommended for development)
```bash
cd packages/drizzle
pnpm drizzle-kit push --config=src/drizzle.config.ts
```

### Method 2: Manual SQL Execution (Recommended for production)
```bash
# Connect to database
psql -U postgres -d quantix_db

# Execute migration file
\i packages/drizzle/src/db/migrations/0002_add_user_and_organization_tables.sql
```

### Method 3: Using Project Script
```bash
# From project root
pnpm db:push
```

---

## Data Relationship Diagram

```
users (users table)
  -> 1:N
user_organizations (relationship table)
  -> N:1
organizations (organizations table)
  -> 1:N
test_cases (test cases)
  -> 1:N
sub_tests (sub tests)
  -> 1:N
sub_text_activity (test activity)
```

---

## Permission Model

### System Level Roles (users.role)
- **admin**: System administrator, can manage all data
- **user**: Regular user, can create and manage own data
- **viewer**: Read-only user, can only view data

### Organization Level Roles (user_organizations.role)
- **owner**: Organization owner, full control
- **admin**: Organization administrator, can manage members and settings
- **member**: Regular member, can create and edit test cases

---

## Next Steps

### 1. Immediate Implementation Needs

#### A. User Registration and Login API
Create files in: `apps/server/src/routers/auth/`
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user info

#### B. Organization Management API
Create files in: `apps/server/src/routers/organizations/`
- POST `/api/organizations` - Create organization
- GET `/api/organizations/:id` - Get organization details
- POST `/api/organizations/:id/members` - Add member
- DELETE `/api/organizations/:id/members/:userId` - Remove member

#### C. Frontend Authentication Components
Create files in: `apps/web/src/app/auth/`
- `/login` page - Login form
- `/register` page - Registration form
- Auth middleware - Protect authenticated pages

### 2. Database Query Updates

Update existing queries to include organization filtering:

```typescript
// Before
const testCases = await db.query.testCases.findMany();

// After
const testCases = await db.query.testCases.findMany({
  where: eq(testCases.organizationId, currentUser.organizationId)
});
```

### 3. Middleware Implementation

Create authentication middleware: `apps/server/src/middleware/auth.ts`

```typescript
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token and set req.user
  next();
}

export async function requireOrganization(req, res, next) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ error: 'No organization' });
  }
  next();
}
```

---

## Security Considerations

1. **Password Encryption**: Use bcrypt or argon2
2. **JWT Token**: Use jose or jsonwebtoken
3. **CSRF Protection**: Add CSRF token
4. **Rate Limiting**: Limit login attempts
5. **SQL Injection Protection**: Provided by Drizzle ORM
6. **XSS Protection**: Frontend input validation and escaping

---

## Test Data Examples

### Create Test User
```sql
INSERT INTO users (email, name, password_hash, role)
VALUES ('admin@example.com', 'Admin User', '$2b$10$...', 'admin');
```

### Create Test Organization
```sql
INSERT INTO organizations (name, slug)
VALUES ('Acme Corp', 'acme-corp');
```

### Link User and Organization
```sql
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES (1, 1, 'owner');
```

---

## Related Documentation

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
- [Multi-tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)

---

## Verification Checklist

- [ ] Migration file created
- [ ] Schema updated
- [ ] Migration applied to database
- [ ] Indexes created
- [ ] Foreign key constraints added
- [ ] Type exports updated
- [ ] Test data created (optional)
- [ ] Authentication API implemented
- [ ] Frontend login page created
- [ ] Middleware added
- [ ] Existing queries updated

---

## Common Issues

### Q: Migration fails, table already exists
A: Uses `IF NOT EXISTS` clause, migration is idempotent

### Q: How to rollback migration?
A: Create rollback SQL:
```sql
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE test_cases DROP COLUMN IF EXISTS user_id;
ALTER TABLE test_cases DROP COLUMN IF EXISTS organization_id;
```

### Q: What about existing test cases?
A: Their `organization_id` will be NULL, can be batch assigned via script

---

## Next Optimization Suggestions

1. Soft Delete - Add `deleted_at` field
2. Audit Logs - Record all operations
3. API Key Management - For third-party integrations
4. Test Scheduling - Automated scheduled tests
5. Cost Tracking - Track AI API usage

---

**Implementation Date**: 2025-11-24
**Implementer**: Claude Code
**Status**: Schema and migration files completed
