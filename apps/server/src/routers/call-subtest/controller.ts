import { getVapiClient } from "@/lib/vapi";
import { db, subTests, testCases } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router: Router = Router();

router.post("/", async (req, res) => {
  const vapi = getVapiClient();
  const { subTestId } = req.body;

  const subTest = await db
    .select()
    .from(subTests)
    .where(eq(subTests.id, subTestId))
    .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
    .limit(1);

  if (!subTest || !subTest.length) {
    throw new Error("Sub test not found");
  }

  const [subTestData] = subTest;

  const callingAgentDescription = subTestData.test_cases.description;

  const taskDescription = subTestData.sub_tests.description;

  // Inject fulfillment-mode exclusivity guidance directly into the task given to the assistant.
  const guardrailHeader =
    "System policy: fulfillment_mode must be exactly one of ['pickup','delivery','dine_in']. If the user mentions multiple modes, ask them to choose one before proceeding. Do not proceed to checkout while ambiguous. If the user switches modes, clear conflicting fields from the previous mode and reconfirm. In confirmations, always state the chosen mode and omit any other mode.";

  const taskWithGuardrails = `${guardrailHeader}\n\nTask: ${taskDescription}`;

  const result = await vapi.calls.create({
    assistantId: "e6d0707e-8347-4c09-a93f-af1eed22fffe",
    customer: {
      number: "+19494321144",
    },
    phoneNumberId: "61077b28-602c-4417-9155-3b0ef6cb2d88",
    assistantOverrides: {
      variableValues: {
        description: callingAgentDescription,
        task: taskWithGuardrails,
      },
    },
  });

  res.json({ result });
});

export default router;
