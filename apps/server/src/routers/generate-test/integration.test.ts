import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import generateTestRouter from "./controller";
import { generateTestService } from "./service";

// Mock the service layer
vi.mock("./service", () => ({
  generateTestService: vi.fn(),
}));

describe("Generate Test API Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Set up Express app with the router
    app = express();
    app.use(express.json());
    app.use("/api/generate-test", generateTestRouter);
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/generate-test", () => {
    it("should return 400 when testCaseId is missing", async () => {
      const response = await request(app)
        .post("/api/generate-test")
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: "testCaseId is required",
      });
    });

    it("should return 400 when testCaseId is null", async () => {
      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: null })
        .expect(400);

      expect(response.body).toEqual({
        error: "testCaseId is required",
      });
    });

    it("should successfully generate tests and return result", async () => {
      const mockTestCase = {
        id: 1,
        name: "API Endpoint Test",
        description: "Test /api/users endpoint",
        kindOfTestCases: "integration",
        email: "test@example.com",
        testPhoneNumber: "+1234567890",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResult = {
        testCase: mockTestCase,
        traceId: "trace-abc123",
      };

      vi.mocked(generateTestService).mockResolvedValue(mockResult as any);

      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 1 })
        .expect(200);

      expect(response.body.testCase.id).toBe(1);
      expect(response.body.testCase.name).toBe("API Endpoint Test");
      expect(response.body.traceId).toBe("trace-abc123");

      expect(generateTestService).toHaveBeenCalledWith(1);
    });

    it("should handle service errors and return 500", async () => {
      vi.mocked(generateTestService).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 1 })
        .expect(500);

      expect(response.body).toEqual({
        error: "Failed to generate test cases",
        message: "Database connection failed",
      });
    });

    it("should handle timeout errors", async () => {
      vi.mocked(generateTestService).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Test generation timed out after 60 seconds")),
              100
            )
          )
      );

      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 1 })
        .expect(500);

      expect(response.body.error).toBe("Failed to generate test cases");
      expect(response.body.message).toContain("timed out");
    });

    it("should handle test case not found error", async () => {
      vi.mocked(generateTestService).mockRejectedValue(
        new Error("Test case not found")
      );

      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 999 })
        .expect(500);

      expect(response.body).toEqual({
        error: "Failed to generate test cases",
        message: "Test case not found",
      });
    });

    it("should accept different testCaseId types", async () => {
      const mockResult = {
        testCase: { id: 42, title: "Test" },
        traceId: null,
      };

      vi.mocked(generateTestService).mockResolvedValue(mockResult as any);

      // Test with number
      await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 42 })
        .expect(200);

      expect(generateTestService).toHaveBeenCalledWith(42);

      // Test with string number
      await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: "42" })
        .expect(200);

      expect(generateTestService).toHaveBeenCalledWith("42");
    });

    it("should handle result without traceId", async () => {
      const mockResult = {
        testCase: {
          id: 1,
          title: "Test",
          description: "Description",
        },
        traceId: null,
      };

      vi.mocked(generateTestService).mockResolvedValue(mockResult as any);

      const response = await request(app)
        .post("/api/generate-test")
        .send({ testCaseId: 1 })
        .expect(200);

      expect(response.body.traceId).toBeNull();
      expect(response.body.testCase).toEqual(mockResult.testCase);
    });
  });
});
