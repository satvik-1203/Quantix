"use server";
import { db, subTests } from "@workspace/drizzle";
import { revalidatePath } from "next/cache";
import { createSubTestSchema } from "./schema";

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
