# External API Integration Guide

## Streaming Conversation API

This API allows third-party software to send structured test cases and receive real-time streaming conversations between an email test agent and an OpenAI model of choice.

### Endpoint

**POST** `http://localhost:3000/api/llm-dialog/external/stream`

**Content-Type:** `application/json`

### Request Body Schema

```typescript
{
  testCase: {
    name?: string;              // Optional test case name
    description: string;         // Required: The scenario description
    expected?: string;           // Optional: Expected agent behavior
  };
  metadata?: {
    personName?: string;         // Person's name for personalization
    jobPosition?: string;        // Job title/position
    company?: string;            // Company name
    email?: string;              // Email address
    phone?: string;              // Phone number
    customFields?: Record<string, any>;  // Any additional custom fields
  };
  model: "gpt-5" | "gpt-5-mini" | "gpt-4.1-mini" | "gpt-4.1-nano";
  maxMessages?: number;         // Optional: 1-50, default 10
}
```

### Response Format: Server-Sent Events (SSE)

The API streams responses using Server-Sent Events. Each event has a type and JSON data:

#### Event Types

1. **`start`** - Conversation initialization
   ```json
   {
     "model": "gpt-5",
     "testCase": { "name": "...", "description": "..." },
     "metadata": { ... },
     "maxMessages": 10
   }
   ```

2. **`message`** - Each new message as it's generated (streamed in real-time)
   ```json
   {
     "role": "user" | "assistant",
     "content": "Message text here",
     "messageIndex": 0,
     "totalMessages": 1
   }
   ```

3. **`evaluation`** - Evaluation metrics (sent after conversation completes)
   ```json
   {
     "semanticSimilarity": 0.85,
     "compositeScore": 0.92,
     "judge": {
       "succeeded": true,
       "taskCompletionConfidence": 0.95,
       "safetyScore": 1.0,
       "faithfulnessScore": 0.98,
       "reasoning": "The agent successfully...",
       "failureReasons": []
     }
   }
   ```

4. **`complete`** - Final summary with full conversation
   ```json
   {
     "totalMessages": 8,
     "summary": "Rolling summary of conversation",
     "state": { "isTaskCompleted": true, "notes": [] },
     "conversation": [
       { "role": "user", "content": "..." },
       { "role": "assistant", "content": "..." }
     ]
   }
   ```

5. **`error`** - Error occurred
   ```json
   {
     "error": "Failed to generate conversation",
     "message": "Detailed error message"
   }
   ```

### Example Integration Code

#### JavaScript/TypeScript (Browser)

```typescript
async function streamConversation(testCase: any, metadata?: any, model = "gpt-5") {
  const response = await fetch('http://localhost:3000/api/llm-dialog/external/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testCase, metadata, model, maxMessages: 10 })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        const eventType = line.replace('event: ', '').trim();
        const dataLine = lines[lines.indexOf(line) + 1];
        if (dataLine?.startsWith('data: ')) {
          const data = JSON.parse(dataLine.replace('data: ', ''));
          
          switch (eventType) {
            case 'start':
              console.log('Conversation started:', data);
              break;
            case 'message':
              console.log(`[${data.role}]: ${data.content}`);
              // Update UI with new message in real-time
              break;
            case 'evaluation':
              console.log('Evaluation:', data);
              break;
            case 'complete':
              console.log('Conversation complete:', data);
              break;
            case 'error':
              console.error('Error:', data);
              break;
          }
        }
      }
    }
  }
}

// Usage
streamConversation(
  {
    description: "User wants to schedule a meeting for next week",
    expected: "Agent should confirm date, time, and send calendar invite"
  },
  {
    personName: "Jane Smith",
    jobPosition: "Director of Engineering",
    company: "Acme Corp",
    email: "jane@acme.com"
  },
  "gpt-5"
);
```

#### Python

```python
import requests
import json
import re

def stream_conversation(test_case, metadata=None, model="gpt-5", max_messages=10):
    url = "http://localhost:3000/api/llm-dialog/external/stream"
    payload = {
        "testCase": test_case,
        "metadata": metadata or {},
        "model": model,
        "maxMessages": max_messages
    }
    
    response = requests.post(url, json=payload, stream=True)
    
    buffer = ""
    for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
        if chunk:
            buffer += chunk
            # Process complete SSE messages
            while "\n\n" in buffer:
                message, buffer = buffer.split("\n\n", 1)
                process_sse_message(message)

def process_sse_message(message):
    lines = message.strip().split("\n")
    event_type = None
    data = None
    
    for line in lines:
        if line.startswith("event: "):
            event_type = line.replace("event: ", "").strip()
        elif line.startswith("data: "):
            data = json.loads(line.replace("data: ", ""))
    
    if event_type and data:
        if event_type == "message":
            role = data.get("role", "unknown")
            content = data.get("content", "")
            print(f"[{role}]: {content}")
        elif event_type == "complete":
            print("Conversation complete!")
            print(f"Total messages: {data.get('totalMessages')}")

# Usage
stream_conversation(
    test_case={
        "description": "User wants to schedule a meeting for next week",
        "expected": "Agent should confirm date, time, and send calendar invite"
    },
    metadata={
        "personName": "Jane Smith",
        "jobPosition": "Director of Engineering",
        "company": "Acme Corp"
    },
    model="gpt-5"
)
```

#### Node.js

```javascript
const fetch = require('node-fetch');
const { Readable } = require('stream');

async function streamConversation(testCase, metadata, model = 'gpt-5') {
  const response = await fetch('http://localhost:3000/api/llm-dialog/external/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testCase, metadata, model, maxMessages: 10 })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';

    for (const msg of messages) {
      const lines = msg.split('\n');
      let eventType = null;
      let data = null;

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.replace('event: ', '').trim();
        } else if (line.startsWith('data: ')) {
          data = JSON.parse(line.replace('data: ', ''));
        }
      }

      if (eventType === 'message') {
        console.log(`[${data.role}]: ${data.content}`);
      } else if (eventType === 'complete') {
        console.log('Done!', data.totalMessages, 'messages');
      }
    }
  }
}
```

### Error Handling

- **400 Bad Request**: Invalid request body (check schema)
- **500 Internal Server Error**: Server-side error (check `error` event)
- **Connection Issues**: Handle network errors gracefully, implement retry logic

### Best Practices

1. **Real-time UI Updates**: Listen for `message` events and update your UI immediately as messages arrive
2. **Error Handling**: Always listen for `error` events and handle them appropriately
3. **Connection Management**: Implement timeout handling and reconnection logic for production
4. **Metadata Usage**: Include relevant metadata (name, position, etc.) to make conversations more realistic
5. **Model Selection**: Use `gpt-5` for best quality, `gpt-4.1-nano` for faster/cheaper testing
6. **Message Limits**: Set `maxMessages` based on your use case (default 10, max 50)

### Example Request

```bash
curl -X POST http://localhost:3000/api/llm-dialog/external/stream \
  -H "Content-Type: application/json" \
  -d '{
    "testCase": {
      "description": "User needs help resetting their password",
      "expected": "Agent should verify identity and guide through reset process"
    },
    "metadata": {
      "personName": "John Doe",
      "jobPosition": "Senior Developer",
      "company": "TechCorp",
      "email": "john@techcorp.com"
    },
    "model": "gpt-5",
    "maxMessages": 10
  }'
```

### Notes

- The API uses Server-Sent Events (SSE) for streaming, not WebSockets
- Messages are streamed in real-time as they're generated
- Evaluation metrics are computed after the conversation completes
- The conversation uses context management (rolling summaries) for long conversations
- All metadata is incorporated into the system prompt for more realistic conversations

