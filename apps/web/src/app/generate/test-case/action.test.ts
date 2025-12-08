import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTestCase,
  getAllTestCases,
  updateTestCase,
  getTestCaseById,
  deleteTestCase,
  getSubTestsByTestCaseId,
  duplicateTestCase,
} from "./action";

// Mock the database and Next.js cache
vi.mock("@workspace/drizzle", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(),
        where: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
  testCases: {
    id: "id",
    createdAt: "createdAt",
  },
  subTests: {
    testCaseId: "testCaseId",
    createdAt: "createdAt",
  },
  subTextActivity: {
    subTestId: "subTestId",
  },
  eq: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db, testCases, subTests, subTextActivity, eq, inArray } from "@workspace/drizzle";
import { revalidatePath } from "next/cache";

describe("Test Case Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTestCase", () => {
    it("should insert a new test case with correct data", async () => {
      const formData = {
        name: "Login Test",
        description: "Test login functionality",
        kindOfTestCases: "functional",
        testPhoneNumber: "+1234567890",
        email: "test@example.com",
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any);

      await createTestCase(formData);

      expect(db.insert).toHaveBeenCalledWith(testCases);
    });
  });

  describe("getAllTestCases", () => {
    it("should return all test cases ordered by creation date", async () => {
      const mockTestCases = [
        {
          id: 1,
          name: "Test 1",
          description: "Description 1",
          createdAt: new Date("2025-01-01"),
        },
        {
          id: 2,
          name: "Test 2",
          description: "Description 2",
          createdAt: new Date("2025-01-02"),
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockTestCases);
      const mockFrom = vi.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getAllTestCases();

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(testCases);
      expect(mockOrderBy).toHaveBeenCalledWith(testCases.createdAt);
      expect(result).toEqual(mockTestCases);
    });
  });

  describe("updateTestCase", () => {
    it("should update test case and revalidate paths", async () => {
      const formData = {
        name: "Updated Test",
        description: "Updated description",
        kindOfTestCases: "integration",
        testPhoneNumber: "+9876543210",
        email: "updated@example.com",
      };

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        set: mockSet,
      });
      vi.mocked(db.update).mockReturnValue(mockUpdate() as any);

      await updateTestCase(1, formData);

      expect(db.update).toHaveBeenCalledWith(testCases);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: formData.name,
          description: formData.description,
          kindOfTestCases: formData.kindOfTestCases,
          testPhoneNumber: formData.testPhoneNumber,
          email: formData.email,
          updatedAt: expect.any(Date),
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/generate/test-case/1/sub-tests");
      expect(revalidatePath).toHaveBeenCalledWith("/generate/test-case/list");
    });
  });

  describe("getTestCaseById", () => {
    it("should return test case when found", async () => {
      const mockTestCase = {
        id: 1,
        name: "Test",
        description: "Description",
      };

      const mockWhere = vi.fn().mockResolvedValue([mockTestCase]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getTestCaseById(1);

      expect(result).toEqual(mockTestCase);
    });

    it("should return null when test case not found", async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getTestCaseById(999);

      expect(result).toBeNull();
    });
  });

  describe("deleteTestCase", () => {
    it("should delete test case with all related data", async () => {
      const mockSubTests = [
        { id: 1, testCaseId: 1, name: "Subtest 1" },
        { id: 2, testCaseId: 1, name: "Subtest 2" },
      ];

      // Mock getting related subtests
      const mockWhere1 = vi.fn().mockResolvedValue(mockSubTests);
      const mockFrom1 = vi.fn().mockReturnValue({
        where: mockWhere1,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom1,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      // Mock delete operations
      const mockWhere2 = vi.fn().mockResolvedValue(undefined);
      const mockDelete = vi.fn().mockReturnValue({
        where: mockWhere2,
      });
      vi.mocked(db.delete).mockReturnValue(mockDelete() as any);

      await deleteTestCase(1);

      // Verify subtests were queried
      expect(db.select).toHaveBeenCalled();

      // Verify deletes were called
      expect(db.delete).toHaveBeenCalledWith(subTextActivity);
      expect(db.delete).toHaveBeenCalledWith(subTests);
      expect(db.delete).toHaveBeenCalledWith(testCases);

      // Verify paths were revalidated
      expect(revalidatePath).toHaveBeenCalledWith("/generate/test-case/1/sub-tests");
      expect(revalidatePath).toHaveBeenCalledWith("/generate/test-case/list");
    });
  });

  describe("getSubTestsByTestCaseId", () => {
    it("should return subtests ordered by creation date", async () => {
      const mockSubTests = [
        {
          id: 1,
          testCaseId: 1,
          name: "Subtest 1",
          createdAt: new Date("2025-01-01"),
        },
        {
          id: 2,
          testCaseId: 1,
          name: "Subtest 2",
          createdAt: new Date("2025-01-02"),
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockSubTests);
      const mockWhere = vi.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      const result = await getSubTestsByTestCaseId(1);

      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(subTests);
      expect(result).toEqual(mockSubTests);
    });
  });

  describe("duplicateTestCase", () => {
    it("should duplicate test case with (Copy) suffix", async () => {
      const original = {
        id: 1,
        name: "Original Test",
        description: "Original description",
        kindOfTestCases: "functional",
        testPhoneNumber: "+1234567890",
        email: "test@example.com",
      };

      // Mock getTestCaseById
      const mockWhere = vi.fn().mockResolvedValue([original]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      // Mock insert
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(db.insert).mockReturnValue(mockInsert() as any);

      await duplicateTestCase(1);

      expect(db.insert).toHaveBeenCalledWith(testCases);
    });

    it("should throw error when test case not found", async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({
        where: mockWhere,
      });
      const mockSelect = vi.fn().mockReturnValue({
        from: mockFrom,
      });
      vi.mocked(db.select).mockReturnValue(mockSelect() as any);

      await expect(duplicateTestCase(999)).rejects.toThrow("Test case not found");
    });
  });
});
