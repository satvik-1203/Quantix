# Testing Guide

This document describes the testing infrastructure and how to run tests for the Quantix project.

## Overview

The project uses **Vitest** as the testing framework, with the following test types:

- **Unit Tests**: Test individual functions and services in isolation
- **Integration Tests**: Test API endpoints and component interactions
- **Component Tests**: Test React components with React Testing Library

## Test Structure

```
Quantix/
├── vitest.config.ts                    # Root Vitest configuration
├── apps/
│   ├── server/
│   │   └── src/
│   │       └── routers/
│   │           └── generate-test/
│   │               ├── service.test.ts        # Unit tests for service
│   │               ├── controller.test.ts     # Unit tests for controller
│   │               └── integration.test.ts    # API integration tests
│   └── web/
│       ├── vitest.config.ts            # Web-specific Vitest config
│       ├── vitest.setup.ts             # Test setup and global imports
│       └── src/
│           ├── app/
│           │   └── generate/
│           │       └── test-case/
│           │           └── action.test.ts     # Server action tests
│           └── components/
│               ├── CreateTestCaseDialog.test.tsx  # Component tests
│               └── mode-toggle.test.tsx           # Component tests
```

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests with UI

```bash
pnpm test:ui
```

This opens an interactive UI to view and run tests.

### Run Tests with Coverage

```bash
pnpm test:coverage
```

This generates a coverage report in HTML format at `coverage/index.html`.

### Run Server Tests Only

```bash
pnpm test:server
# or
cd apps/server && pnpm test
```

### Run Web Tests Only

```bash
pnpm test:web
# or
cd apps/web && pnpm test
```

### Watch Mode

```bash
# Server tests in watch mode
cd apps/server && pnpm test:watch

# Web tests in watch mode
cd apps/web && pnpm test:watch
```

## Test Categories

### Server-Side Tests

#### Unit Tests

Located in `apps/server/src/routers/generate-test/`:

- **service.test.ts**: Tests the `generateTestService` function
  - Test case not found error handling
  - Successful test generation
  - RAG trace logging
  - Database error propagation

- **controller.test.ts**: Tests the Express controller logic
  - Missing testCaseId validation
  - Successful response handling
  - Error handling and status codes
  - Timeout scenarios

#### Integration Tests

Located in `apps/server/src/routers/generate-test/`:

- **integration.test.ts**: Tests the full API endpoint
  - POST /api/generate-test endpoint
  - Request validation
  - Response format verification
  - Error scenarios
  - Different input types

### Web-Side Tests

#### Server Action Tests

Located in `apps/web/src/app/generate/test-case/`:

- **action.test.ts**: Tests Next.js server actions
  - `createTestCase`: Insert test case
  - `getAllTestCases`: Query all test cases
  - `updateTestCase`: Update and revalidation
  - `getTestCaseById`: Query by ID
  - `deleteTestCase`: Cascade delete
  - `getSubTestsByTestCaseId`: Query subtests
  - `duplicateTestCase`: Duplicate with validation

#### Component Tests

Located in `apps/web/src/components/`:

- **CreateTestCaseDialog.test.tsx**: Tests the dialog component
  - Rendering trigger button
  - Form field validation
  - Phone number validation
  - Email validation
  - Form submission
  - Error handling
  - Loading states
  - Cancel functionality

- **mode-toggle.test.tsx**: Tests the theme toggle
  - Rendering toggle button
  - Accessibility
  - Dropdown menu interaction
  - Theme switching (light/dark/system)

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("MyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("should handle click", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";
import myRouter from "./router";

describe("API Integration", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/test", myRouter);

  it("should return 200", async () => {
    const response = await request(app)
      .get("/api/test")
      .expect(200);

    expect(response.body).toEqual({ success: true });
  });
});
```

## Mocking

### Mock Database

```typescript
vi.mock("@workspace/drizzle", () => ({
  db: {
    query: {
      testCases: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  },
  testCases: {},
}));
```

### Mock Next.js Functions

```typescript
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));
```

## Coverage Reports

After running `pnpm test:coverage`, view the report:

```bash
# Open coverage report in browser
open coverage/index.html
```

Coverage is configured to exclude:
- `node_modules/`
- `.next/` and `dist/` directories
- Config files (`*.config.*`)
- Type definition files (`*.d.ts`)
- Eval and script directories

## Continuous Integration

Tests should be run in CI/CD pipelines before deployment:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

1. **Write tests first**: Consider TDD (Test-Driven Development)
2. **Keep tests isolated**: Each test should be independent
3. **Use descriptive names**: Test names should clearly describe what they test
4. **Mock external dependencies**: Database, APIs, file system, etc.
5. **Test edge cases**: Not just happy paths
6. **Maintain test coverage**: Aim for >80% coverage on critical paths
7. **Clean up after tests**: Use `beforeEach` and `afterEach` hooks
8. **Avoid testing implementation details**: Test behavior, not internals

## Troubleshooting

### Tests failing due to missing dependencies

```bash
pnpm install
```

### Database connection errors in tests

Ensure database mocks are properly configured. Tests should NOT connect to real databases.

### React component rendering issues

Make sure `vitest.setup.ts` is properly configured and includes:

```typescript
import "@testing-library/jest-dom/vitest";
```

### ESM module errors

Ensure `"type": "module"` is set in package.json and Vitest config uses ES module syntax.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
