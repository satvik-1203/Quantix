# Supabase Edge Function Deployment Guide

This guide explains how to deploy the streaming LLM dialog API as a Supabase Edge Function.

## Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase project** created at [supabase.com](https://supabase.com)

3. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```

4. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in your Supabase dashboard URL: `https://app.supabase.com/project/your-project-ref`)

## Environment Variables

Set these secrets in your Supabase project:

```bash
# Required
supabase secrets set OPENAI_API_KEY=your-openai-api-key

# Optional (if you use a different key name)
supabase secrets set OPENAI_API_KEY_PRIVATE=your-openai-api-key

# Optional (defaults to text-embedding-3-large)
supabase secrets set EMBEDDING_MODEL=text-embedding-3-large
```

Or set them via the Supabase Dashboard:
1. Go to Project Settings → Edge Functions → Secrets
2. Add each secret

## Deployment

### Initial Setup

1. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

2. **Deploy the function**:
   ```bash
   supabase functions deploy llm-dialog-stream
   ```

### Updating the Function

After making changes to `supabase/functions/llm-dialog-stream/index.ts`:

```bash
supabase functions deploy llm-dialog-stream
```

## Testing

### Local Testing

Test locally before deploying:

```bash
supabase functions serve llm-dialog-stream
```

Then test with:

```bash
curl -X POST http://localhost:54321/functions/v1/llm-dialog-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "testCase": {
      "description": "User wants to schedule a meeting",
      "expected": "Agent should confirm date and time"
    },
    "metadata": {
      "personName": "Jane Smith",
      "jobPosition": "Director"
    },
    "model": "gpt-5",
    "maxMessages": 10
  }'
```

### Production Testing

Once deployed, your function will be available at:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/llm-dialog-stream
```

Test with:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/llm-dialog-stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "testCase": {
      "description": "User wants to schedule a meeting",
      "expected": "Agent should confirm date and time"
    },
    "metadata": {
      "personName": "Jane Smith",
      "jobPosition": "Director"
    },
    "model": "gpt-5",
    "maxMessages": 10
  }'
```

## Authentication

By default, the function is set to `verify_jwt = false` in `supabase/config.toml`, meaning it's publicly accessible.

To add authentication:

1. **Enable JWT verification** in `supabase/config.toml`:
   ```toml
   [functions.llm-dialog-stream]
   verify_jwt = true
   ```

2. **Include Authorization header** in requests:
   ```bash
   -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
   ```

   Or use a user's JWT token for authenticated requests.

## API Endpoint

**Production URL:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/llm-dialog-stream
```

**Request:** Same as documented in `EXTERNAL_API_INTEGRATION.md`

**Response:** Server-Sent Events (SSE) stream with the same event types:
- `start` - Conversation initialized
- `message` - Each new message (streamed in real-time)
- `evaluation` - Evaluation metrics
- `complete` - Final summary
- `error` - Error occurred

## Differences from Express Version

1. **Deno Runtime**: Uses Deno instead of Node.js
2. **Import Syntax**: Uses `npm:` specifiers for npm packages
3. **Streaming**: Uses Deno's ReadableStream API
4. **Environment Variables**: Accessed via `Deno.env.get()`
5. **No File System**: Can't write to local files (no logging to JSONL)

## Monitoring

View function logs:

```bash
supabase functions logs llm-dialog-stream
```

Or in the Supabase Dashboard:
- Go to Edge Functions → llm-dialog-stream → Logs

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **OpenAI API**: Pay per token usage (varies by model)
- **Embeddings**: Additional cost for semantic similarity calculation

## Troubleshooting

### Function not deploying

1. Check you're logged in: `supabase status`
2. Verify project link: `supabase projects list`
3. Check function syntax: `supabase functions serve llm-dialog-stream --no-verify-jwt`

### Environment variables not working

1. Verify secrets are set: `supabase secrets list`
2. Redeploy after setting secrets: `supabase functions deploy llm-dialog-stream`

### Streaming not working

1. Check CORS headers are set correctly
2. Verify client is handling SSE properly
3. Check function logs for errors

## Next Steps

1. Update your `EXTERNAL_API_INTEGRATION.md` to include the Supabase endpoint URL
2. Test the production endpoint with your 3rd party software
3. Set up monitoring/alerts for function errors
4. Consider adding rate limiting if needed

