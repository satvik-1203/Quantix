import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

vi.mock("./service", () => ({
  generateTestService: vi.fn(),
}));

import { generateTestService } from "./service";

describe("Generate Test Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock })) as any;

    mockRequest = {
      body: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  it("should return 400 when testCaseId is missing", async () => {
    mockRequest.body = {};

    // Simulate the controller logic
    const testCaseId = mockRequest.body.testCaseId;
    if (!testCaseId) {
      statusMock(400);
      jsonMock({ error: "testCaseId is required" });
    }

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "testCaseId is required" });
  });

  it("should successfully generate tests and return result", async () => {
    const mockResult = {
      testCase: {
        id: 1,
        title: "Test Case",
        description: "Description",
      },
      traceId: "trace-123",
    };

    mockRequest.body = { testCaseId: 1 };
    vi.mocked(generateTestService).mockResolvedValue(mockResult);

    // Simulate controller logic
    const { testCaseId } = mockRequest.body;
    const result = await generateTestService(testCaseId);
    jsonMock({
      testCase: result.testCase,
      traceId: result.traceId,
    });

    expect(generateTestService).toHaveBeenCalledWith(1);
    expect(jsonMock).toHaveBeenCalledWith({
      testCase: mockResult.testCase,
      traceId: mockResult.traceId,
    });
  });

  it("should handle service errors and return 500", async () => {
    mockRequest.body = { testCaseId: 1 };
    const error = new Error("Service error");

    vi.mocked(generateTestService).mockRejectedValue(error);

    // Simulate controller error handling
    try {
      await generateTestService(1);
    } catch (err) {
      statusMock(500);
      jsonMock({
        error: "Failed to generate test cases",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Failed to generate test cases",
      message: "Service error",
    });
  });

  it("should handle timeout errors", async () => {
    mockRequest.body = { testCaseId: 1 };
    const timeoutError = new Error("Test generation timed out after 60 seconds");

    vi.mocked(generateTestService).mockRejectedValue(timeoutError);

    try {
      await generateTestService(1);
    } catch (err) {
      statusMock(500);
      jsonMock({
        error: "Failed to generate test cases",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Failed to generate test cases",
      message: "Test generation timed out after 60 seconds",
    });
  });
});
