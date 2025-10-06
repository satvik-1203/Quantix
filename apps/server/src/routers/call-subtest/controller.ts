import { getVapiClient } from "@/lib/vapi";
import { db, eq, subTests, testCases } from "@workspace/drizzle";
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

  if (!subTest[0].test_cases.testPhoneNumber) {
    throw new Error("Test phone number not found");
  }

  const [subTestData] = subTest;

  const callingAgentDescription = subTestData.test_cases.description;

  const taskDescription = subTestData.sub_tests.description;

  // const taskExpected = subTestData.sub_tests.expected;

  const result = await vapi.calls.create({
    assistantId: "e6d0707e-8347-4c09-a93f-af1eed22fffe",
    customer: {
      number: subTestData.test_cases.testPhoneNumber as string,
    },
    phoneNumberId: "61077b28-602c-4417-9155-3b0ef6cb2d88",
    assistantOverrides: {
      variableValues: {
        description: callingAgentDescription,
        task: taskDescription,
      },
    },
  });

  res.json({ result });
});

export default router;
