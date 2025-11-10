# Test Case Creation Guide

## Overview

When you create a test case, the system uses AI to generate 8 sub-tests that will automatically test your voice bot. The system leverages real email conversations from Pinecone to make the tests realistic and contextually relevant.

## How It Works

```
You fill out the form
    ↓
System queries Pinecone for similar email threads
    ↓
AI (GPT-4) uses your description + real email examples
    ↓
Generates 8 diverse sub-tests
    ↓
Each sub-test can be executed against your voice bot
```

## Form Fields Explained

### 1. **Test Case Name** (Required)

**What it is:** A short, memorable name for this test scenario.

**Examples:**

- ✅ "Restaurant Ordering Bot - Happy Path"
- ✅ "Customer Service Agent - Complaints"
- ✅ "Appointment Scheduler - Edge Cases"
- ❌ "Test 1" (too vague)

**Tips:**

- Keep it under 50 characters
- Make it descriptive enough that you know what it tests

---

### 2. **Voice Bot Description** (Required)

**What it is:** This is THE MOST IMPORTANT field. It describes what your voice bot does and how it should behave. This is used to:

1. Query Pinecone for similar email conversations
2. Give context to the AI for generating realistic tests

**What to include:**

- What the bot does (its main purpose)
- Key features and capabilities
- Expected behavior patterns
- Domain/industry context
- Any specific rules or constraints

**Good Examples:**

**Example 1: Restaurant Bot**

```
A voice agent for "Maria's Italian Restaurant" that handles phone orders.
The bot should:
- Take food orders including item names, quantities, and special requests
- Handle three fulfillment modes: pickup, delivery, or dine-in
- Collect customer contact info (name, phone, address for delivery)
- Provide order confirmation and estimated time
- Handle menu questions and dietary restrictions
- Stay professional and friendly throughout
```

**Example 2: Appointment Scheduler**

```
A medical office scheduling assistant that:
- Books appointments with doctors across multiple specialties
- Checks availability and offers time slots
- Collects patient information (name, DOB, insurance)
- Handles rescheduling and cancellations
- Provides appointment confirmations via email/SMS
- Must verify insurance eligibility before booking
- Maintains HIPAA compliance - never discusses medical details
```

**Example 3: Business Email Assistant**

```
An AI agent that helps executives manage business email communications:
- Reads and summarizes email threads
- Drafts professional responses
- Handles contract termination requests
- Schedules meetings and manages calendar
- Routes urgent matters to appropriate team members
- Maintains professional corporate tone
- Understands business context (contracts, deadlines, legal terms)
```

**Bad Example:**

```
❌ "A chatbot that talks to customers"
```

(Too vague - AI won't know what scenarios to generate)

---

### 3. **Kind of Test Cases** (Required)

**What it is:** What aspects or categories you want the tests to focus on. This helps the AI balance the types of tests it generates.

**Common Options:**

**Functional Testing:**

```
"Happy path scenarios, successful order completions, standard workflows"
```

**Edge Cases & Error Handling:**

```
"Invalid inputs, incomplete information, system errors, boundary conditions"
```

**Business Scenarios:**

```
"Contract management, meeting scheduling, professional communication patterns"
```

**Adversarial/Safety Testing:**

```
"Prompt injection attempts, inappropriate requests, out-of-scope queries,
attempts to bypass guardrails"
```

**Domain-Specific:**

```
"Restaurant-specific: dietary restrictions, special requests, large orders,
time-sensitive pickups"
```

**Compliance & Policy:**

```
"HIPAA compliance, data privacy, refusal of inappropriate requests,
staying within defined role"
```

**Mixed/Balanced:**

```
"Balanced coverage: happy path, edge cases, error handling, and
adversarial attempts"
```

**Examples by Industry:**

**Restaurant:**

```
"Focus on order modifications, dietary restrictions, delivery logistics,
and handling special requests"
```

**Healthcare:**

```
"Appointment scheduling edge cases, insurance verification,
HIPAA compliance, emergency handling"
```

**Business/Email:**

```
"Contract terminations, meeting coordination, urgent escalations,
professional communication tone"
```

---

### 4. **Test Phone Number** (Required)

**What it is:** The actual phone number that the system will call to test your voice bot.

**Format:**

- `+1 (555) 123-4567` (US)
- `+44 20 1234 5678` (UK)
- Or any format with country code

**Important:**

- This should be YOUR voice bot's phone number (the one you're testing)
- Tests will actually call this number when executed
- Make sure the bot is active and ready to receive calls

**Examples:**

```
+1 (555) 555-1234      # Your Vapi phone number
+1-800-RESTAURANT      # Toll-free number
+44 20 7123 4567       # International format
```

---

### 5. **Email Address** (Required)

**What it is:** Email for receiving test results and notifications.

**Examples:**

```
you@company.com
qa-team@company.com
test-notifications@company.com
```

---

## Complete Examples

### Example 1: Restaurant Ordering Bot

```
Test Case Name:
Pizza Palace - Complete Order Flow

Voice Bot Description:
A voice agent for "Pizza Palace" that handles phone orders. The bot should
greet customers, take pizza orders with customizations (size, toppings,
crust type), offer side items and drinks, handle three fulfillment modes
(pickup, delivery, dine-in), collect customer contact info, calculate
estimated time (30 min pickup, 45 min delivery), provide total price,
and confirm orders with an order number. Must handle dietary restrictions
and special requests professionally.

Kind of Test Cases:
Balanced testing: happy path orders, modifications and substitutions,
dietary restrictions, delivery address handling, large party orders,
and edge cases like unclear addresses or menu questions

Test Phone Number:
+1 (555) 867-5309

Email:
test-team@pizzapalace.com
```

### Example 2: Medical Appointment Bot

```
Test Case Name:
Dr. Smith Clinic - Appointment Scheduler

Voice Bot Description:
A voice scheduling assistant for a multi-specialty medical clinic. The bot
schedules appointments with various doctors (family medicine, cardiology,
dermatology), checks real-time availability, collects patient information
(full name, DOB, insurance provider and member ID), handles new patient
intake vs returning patients, provides appointment confirmations, and
handles rescheduling/cancellations. Must verify insurance eligibility
before confirming. Never discusses medical symptoms or gives medical advice.
HIPAA compliant - only collects necessary booking information.

Kind of Test Cases:
Focus on appointment scheduling edge cases: booking conflicts, insurance
verification failures, rescheduling requests, new vs returning patients,
multiple appointment requests, and compliance testing (refusing to discuss
medical details)

Test Phone Number:
+1 (555) 234-5678

Email:
clinic-admin@drsmith.com
```

### Example 3: Business Email Assistant

```
Test Case Name:
Executive Email Assistant - Business Communication

Voice Bot Description:
An AI assistant that helps executives manage email communications. The bot
can read and summarize email threads, draft professional responses, handle
contract termination requests following proper legal protocols, schedule
business meetings, coordinate with multiple stakeholders, understand business
context (legal terms, deadlines, financial transactions), route urgent
matters to appropriate team members, and maintain professional corporate
tone. Understands business domains like energy trading, contract law, and
corporate communications.

Kind of Test Cases:
Business-focused scenarios: contract management, meeting scheduling across
time zones, professional communication patterns, handling urgent escalations,
understanding business context, and maintaining appropriate corporate tone

Test Phone Number:
+1 (555) 123-4567

Email:
executive-assistant@company.com
```

---

## What Happens After You Submit?

1. **Immediate:**

   - Test case is saved to the database
   - You're redirected to the test case detail page

2. **Background (when you generate sub-tests):**

   - System queries Pinecone with your description and focus areas
   - Retrieves 4 most relevant email threads from the database of 4,167 real conversations
   - AI analyzes your description + real email examples
   - Generates 8 diverse sub-tests

3. **Sub-Tests Created:**
   Each sub-test includes:

   - **Name**: Brief description (e.g., "Order with dietary restrictions")
   - **Prompt**: Exact words to say to the bot (e.g., "I'd like a large pizza but I'm gluten-free")
   - **Expected**: What should happen (e.g., "Bot should offer gluten-free crust options and confirm dietary needs")

4. **Running Tests:**
   - Click "Run Test" on any sub-test
   - System calls your bot's phone number
   - Speaks the prompt
   - Records the conversation
   - AI judges if the bot's response matches expected behavior

---

## Tips for Best Results

### ✅ DO:

- **Be specific** about what your bot does
- **Include domain context** (restaurant, medical, business, etc.)
- **Mention constraints** (HIPAA, professional tone, specific workflows)
- **Describe edge cases** you care about in "kind of test cases"
- **Use realistic scenarios** that match how your bot will be used

### ❌ DON'T:

- Be too vague ("a helpful chatbot")
- Leave out important constraints or rules
- Forget to mention all fulfillment modes or options
- Skip domain-specific terminology your bot should understand

---

## How Email Thread Integration Helps

The system now has access to **4,167 real business email conversations** covering:

- Contract terminations and legal agreements
- Meeting scheduling and coordination
- Financial transactions
- Professional business communications
- Problem resolution and escalations
- Multi-party email threads

When you describe a business-related bot, the AI automatically finds similar real conversations to inspire realistic test scenarios!

**Example:** If you mention "contract termination" in your description, the system finds actual contract termination email threads and creates test cases that reflect real-world patterns like:

- Proper notice periods
- Required documentation
- Professional communication tone
- Legal terminology
- Multi-step approval processes

---

## Need Help?

**Unclear about any field?**
Look at the placeholder text and form descriptions in the UI for hints.

**Want to see examples in action?**
Run the demo: `pnpm --filter server demo:test-gen`

**Not getting relevant tests?**

- Make your "Voice Bot Description" more detailed
- Be more specific in "Kind of Test Cases"
- Add domain-specific keywords that match your use case
