"use server";
import {
  db,
  testCases,
  subTests,
  eq,
  excludeDeleted,
  onlyDeleted,
  softDelete,
  restore,
} from "@workspace/drizzle";
import { desc } from "drizzle-orm";

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
  return await db
    .select()
    .from(testCases)
    .where(excludeDeleted(testCases.deletedAt))
    .orderBy(desc(testCases.createdAt));
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
  const result = await db
    .select()
    .from(testCases)
    .where(eq(testCases.id, id));
  return result[0] || null;
};

export const deleteTestCase = async (id: number) => {
  // Soft delete: mark as deleted instead of permanently removing
  await db.update(testCases).set(softDelete()).where(eq(testCases.id, id));

  // Also soft delete all associated sub tests
  await db.update(subTests).set(softDelete()).where(eq(subTests.testCaseId, id));
};

export const getSubTestsByTestCaseId = async (testCaseId: number) => {
  return await db
    .select()
    .from(subTests)
    .where(eq(subTests.testCaseId, testCaseId))
    .orderBy(subTests.createdAt);
};

// Trash/Recycle Bin Actions
export const getDeletedTestCases = async () => {
  return await db
    .select()
    .from(testCases)
    .where(onlyDeleted(testCases.deletedAt))
    .orderBy(desc(testCases.deletedAt));
};

export const restoreTestCase = async (id: number) => {
  // Restore the test case
  await db.update(testCases).set(restore()).where(eq(testCases.id, id));

  // Also restore all associated sub tests
  await db.update(subTests).set(restore()).where(eq(subTests.testCaseId, id));
};

export const permanentDeleteTestCase = async (id: number) => {
  // First delete all sub tests
  await db.delete(subTests).where(eq(subTests.testCaseId, id));

  // Then delete the test case permanently
  await db.delete(testCases).where(eq(testCases.id, id));
};
