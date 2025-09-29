"use server";
import { db, testCases, eq } from "@workspace/drizzle";

export const createTestCase = async (formData: any) => {
  await db.insert(testCases).values({
    name: formData.name,
    description: formData.description,
    kindOfTestCases: formData.kindOfTestCases,
    testPhoneNumber: formData.testPhoneNumber,
  });
};

export const getAllTestCases = async () => {
  return await db.select().from(testCases).orderBy(testCases.createdAt);
};

export const updateTestCase = async (id: number, formData: any) => {
  await db.update(testCases)
    .set({
      name: formData.name,
      description: formData.description,
      kindOfTestCases: formData.kindOfTestCases,
      testPhoneNumber: formData.testPhoneNumber,
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
