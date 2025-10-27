import { z } from "zod";

export const createSubTestSchema = z.object({
  testCaseId: z.number({ error: "Missing test case" }).int().positive(),
  name: z
    .string()
    .trim()
    .max(255, "Title must be 255 characters or fewer")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long")
    .optional()
    .or(z.literal("")),
  expected: z
    .string()
    .trim()
    .min(5, "Expected result must be at least 5 characters")
    .max(2000, "Expected result is too long")
    .optional()
    .or(z.literal("")),
});

export type CreateSubTestInput = z.infer<typeof createSubTestSchema>;

// Input for updating a sub-test. Title/description/expected are optional; empty strings become nulls.
export const updateSubTestSchema = z.object({
  id: z.number({ error: "Missing sub-test id" }).int().positive(),
  testCaseId: z.number({ error: "Missing test case" }).int().positive(),
  name: z
    .string()
    .trim()
    .max(255, "Title must be 255 characters or fewer")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long")
    .optional()
    .or(z.literal("")),
  expected: z
    .string()
    .trim()
    .min(5, "Expected result must be at least 5 characters")
    .max(2000, "Expected result is too long")
    .optional()
    .or(z.literal("")),
});

export type UpdateSubTestInput = z.infer<typeof updateSubTestSchema>;
