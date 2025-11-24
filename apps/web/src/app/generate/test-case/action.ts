"use server";
import { db, testCases, subTests, eq } from "@workspace/drizzle";

export const createTestCase = async (formData: any) => {
  await db.insert(testCases).values({
    name: formData.name,
    description: formData.description,
    kindOfTestCases: formData.kindOfTestCases,
    testPhoneNumber: formData.testPhoneNumber,
    email: formData.email,
  });
};

export const getAllTestCases = async () => {
  return await db.select().from(testCases).orderBy(testCases.createdAt);
};

export const updateTestCase = async (id: number, formData: any) => {
  await db
    .update(testCases)
    .set({
      name: formData.name,
      description: formData.description,
      kindOfTestCases: formData.kindOfTestCases,
      testPhoneNumber: formData.testPhoneNumber,
      email: formData.email,
      updatedAt: new Date(),
    })
    .where(eq(testCases.id, id));
};

export const getTestCaseById = async (id: number) => {
  const result = await db.select().from(testCases).where(eq(testCases.id, id));
  return result[0] || null;
};

export const deleteTestCase = async (id: number) => {
  await db.delete(testCases).where(eq(testCases.id, id));
};

export const getSubTestsByTestCaseId = async (testCaseId: number) => {
  return await db
    .select()
    .from(subTests)
    .where(eq(subTests.testCaseId, testCaseId))
    .orderBy(subTests.createdAt);
};

export const duplicateTestCase = async (id: number) => {
  const original = await getTestCaseById(id);
  if (!original) {
    throw new Error("Test case not found");
  }

  await db.insert(testCases).values({
    name: `${original.name} (Copy)`,
    description: original.description,
    kindOfTestCases: original.kindOfTestCases,
    testPhoneNumber: original.testPhoneNumber,
    email: original.email,
  });
};
