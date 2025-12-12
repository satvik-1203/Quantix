# capstone-class

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Express, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Express** - Fast, unopinionated web framework
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Environment Setup

This repo uses **per-app env files**.

1. Copy the example env files:

```bash
cp apps/server/.env.example apps/server/.env.local
cp apps/web/.env.example apps/web/.env.local
```

2. Fill in the required values (at minimum `DATABASE_URL` in both files).

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Set `DATABASE_URL` in:
   - `apps/server/.env.local`
   - `apps/web/.env.local`

3. Apply the schema to your database:

```bash
pnpm db:push
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
capstone-class/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Express)
```

## Expense ("exp") Feature Folder Map

If you're looking for the expense reporting flow (cost per sub-test), these are the main touchpoints:

```
apps/server/src/routers/analytics-expense/
  controller.ts   # GET /api/analytics-expense/:subTestId
  service.ts      # backfills cost (Vapi + token cost) and returns totals

apps/web/src/app/generate/test-case/[id]/sub-tests/
  ExpenseDialog.tsx  # UI dialog that calls /api/analytics-expense/:subTestId
```

## Available Scripts

### Development

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps

### Database

- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI

### Email Threads & Pinecone

- `pnpm --filter server pinecone:ingest`: Ingest email threads into Pinecone vector database
- `pnpm --filter server pinecone:test`: Test Pinecone retrieval with example queries
- `pnpm --filter server demo:test-gen`: Demo test generation with email context

### Evaluation Scripts

- `pnpm --filter server eval:generate-tests`: Evaluate test generation
- `pnpm --filter server eval:agentmail-loop`: Evaluate agent email loop
- `pnpm --filter server eval:all`: Run all evaluations

## Documentation

### For Users

- **[Test Case Creation Guide](./TEST_CASE_CREATION_GUIDE.md)** - How to fill out the test case form, with examples for different use cases

### For Developers

- **[Email Threads Integration](./EMAIL_THREADS_INTEGRATION.md)** - Technical details on Pinecone setup, ingestion, and retrieval
