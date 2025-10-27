"use server";
import {
  db,
  subTests,
  subTextActivity,
  eq,
  desc,
  and,
  type SubTextActivityRecord,
} from "@workspace/drizzle";
import { revalidatePath } from "next/cache";
import { createSubTestSchema, updateSubTestSchema } from "./schema";

export async function createSubTest(formData: FormData) {
  const parsed = createSubTestSchema.safeParse({
    testCaseId: Number(formData.get("testCaseId")),
    name: (formData.get("name") ?? "").toString(),
    description: (formData.get("description") ?? "").toString(),
    expected: (formData.get("expected") ?? "").toString(),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message || "Invalid input");
  }

  const input = parsed.data;

  await db.insert(subTests).values({
    name: input.name?.trim() || null,
    description: input.description?.trim() || null,
    expected: input.expected?.trim() || null,
    testCaseId: input.testCaseId,
  });

  revalidatePath(`/generate/test-case/${input.testCaseId}/sub-tests`);
}

export async function updateSubTest(formData: FormData) {
  const parsed = updateSubTestSchema.safeParse({
    id: Number(formData.get("id")),
    testCaseId: Number(formData.get("testCaseId")),
    name: (formData.get("name") ?? "").toString(),
    description: (formData.get("description") ?? "").toString(),
    expected: (formData.get("expected") ?? "").toString(),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first?.message || "Invalid input");
  }

  const input = parsed.data;

  await db
    .update(subTests)
    .set({
      name: input.name?.trim() || null,
      description: input.description?.trim() || null,
      expected: input.expected?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(subTests.id, input.id));

  revalidatePath(`/generate/test-case/${input.testCaseId}/sub-tests`);
}

export async function getEmailsBySubTestId(formData: FormData) {
  const subTestId = Number(formData.get("subTestId"));
  if (!Number.isFinite(subTestId) || subTestId <= 0) {
    throw new Error("Invalid sub test id");
  }

  console.log("subTestId", subTestId);

  const emails = await db
    .select()
    .from(subTextActivity)
    .where(
      and(
        eq(subTextActivity.subTestId, subTestId),
        eq(subTextActivity.type, "EMAIL")
      )
    )
    .orderBy(desc(subTextActivity.createdAt));

  console.log("emails", emails);

  return emails as SubTextActivityRecord[];
}
