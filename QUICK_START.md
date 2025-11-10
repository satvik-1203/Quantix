# Quick Start - Creating Your First Test Case

## TL;DR - Quick Reference

| Field                     | Purpose                                    | Example                                                                |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **Test Case Name**        | Short identifier                           | "Restaurant Bot - Orders"                                              |
| **Voice Bot Description** | ⭐ **MOST IMPORTANT** - What your bot does | "A bot for Pizza Palace that takes orders, handles pickup/delivery..." |
| **Kind of Test Cases**    | What to focus on                           | "Happy path, dietary restrictions, edge cases"                         |
| **Test Phone Number**     | Your bot's phone #                         | "+1 (555) 123-4567"                                                    |
| **Email**                 | Where to send results                      | "you@company.com"                                                      |

## The One Field That Matters Most

### **Voice Bot Description** 🎯

This field determines EVERYTHING. The AI uses it to:

1. Find similar email conversations in Pinecone
2. Generate realistic test scenarios
3. Understand what your bot should/shouldn't do

**Minimum to include:**

```
[What it does] + [Key features] + [Important rules/constraints]
```

## 3 Quick Examples

### 1. Restaurant Bot (Simple)

```yaml
Name: Pizza Orders
Description: Takes pizza orders for delivery or pickup.
  Collects name, phone, address. Handles toppings
  and special requests. Provides order total and
  estimated time.
Kind: Order flow, dietary restrictions, edge cases
Phone: +1 (555) 555-1234
Email: test@pizzaplace.com
```

### 2. Appointment Bot (Medium)

```yaml
Name: Medical Scheduling
Description: Schedules doctor appointments. Checks availability,
  collects patient info (name, DOB, insurance).
  Handles rescheduling. HIPAA compliant - doesn't
  discuss symptoms.
Kind: Scheduling conflicts, insurance verification, compliance
Phone: +1 (555) 555-5678
Email: admin@clinic.com
```

### 3. Business Assistant (Detailed)

```yaml
Name: Executive Email Helper
Description: Manages business emails for executives. Summarizes
  threads, drafts responses, handles contract
  terminations, schedules meetings. Understands
  business context (legal terms, deadlines).
  Maintains professional corporate tone.
Kind: Business scenarios - contracts, meetings, escalations
Phone: +1 (555) 555-9999
Email: assistant@company.com
```

## What Happens Next?

```
1. Fill out form → Submit
        ↓
2. Go to test case page → Click "Generate Sub-Tests"
        ↓
3. System queries 4,167 real email conversations
        ↓
4. AI generates 8 diverse test scenarios
        ↓
5. Click "Run" on any test to call your bot
```

## Pro Tips

✅ **More detail = Better tests**

- Good: "Takes pizza orders with toppings and handles delivery"
- Better: "Takes pizza orders (small/medium/large) with toppings, handles 3 fulfillment modes (pickup/delivery/dine-in), collects address for delivery, provides total price and estimated time"

✅ **Mention what the bot should NOT do**

- "Doesn't discuss medical symptoms"
- "Refuses requests outside restaurant operations"
- "Won't share customer data"

✅ **Include your industry/domain**

- "Restaurant", "Medical", "Legal", "Business" - helps find relevant email examples

❌ **Don't be vague**

- Bad: "A helpful chatbot"
- Bad: "Talks to customers"

## Full Guide

For detailed explanations and more examples, see:
📖 [TEST_CASE_CREATION_GUIDE.md](./TEST_CASE_CREATION_GUIDE.md)
