import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTestCaseDialog from "./CreateTestCaseDialog";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/app/generate/test-case/action", () => ({
  createTestCase: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { createTestCase } from "@/app/generate/test-case/action";

describe("CreateTestCaseDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render trigger button by default", () => {
    render(<CreateTestCaseDialog />);

    const button = screen.getByRole("button", { name: /create new test/i });
    expect(button).toBeInTheDocument();
  });

  it("should render custom trigger when children provided", () => {
    render(
      <CreateTestCaseDialog>
        <button>Custom Trigger</button>
      </CreateTestCaseDialog>
    );

    const customButton = screen.getByRole("button", { name: /custom trigger/i });
    expect(customButton).toBeInTheDocument();
  });

  it("should open dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    const button = screen.getByRole("button", { name: /create new test/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Create New Test Case")).toBeInTheDocument();
    });
  });

  it("should display all form fields", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/test case name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/voice bot description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kind of test cases/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/test phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  it("should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: /^create test case$/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/test case name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it("should validate phone number format", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/test phone number/i)).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/test phone number/i);
    await user.type(phoneInput, "123");

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it("should validate email format", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it("should successfully submit valid form", async () => {
    const user = userEvent.setup();
    vi.mocked(createTestCase).mockResolvedValue(undefined);

    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/test case name/i)).toBeInTheDocument();
    });

    // Fill in all fields
    await user.type(screen.getByLabelText(/test case name/i), "Login Test");
    await user.type(
      screen.getByLabelText(/voice bot description/i),
      "Test the login functionality of the voice bot"
    );
    await user.type(screen.getByLabelText(/kind of test cases/i), "Functional testing");
    await user.type(screen.getByLabelText(/test phone number/i), "+1234567890");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createTestCase).toHaveBeenCalledWith({
        name: "Login Test",
        description: "Test the login functionality of the voice bot",
        kindOfTestCases: "Functional testing",
        testPhoneNumber: "+1234567890",
        email: "test@example.com",
      });
      expect(toast.success).toHaveBeenCalledWith("Test case created successfully!");
    });
  });

  it("should handle submission errors gracefully", async () => {
    const user = userEvent.setup();
    const error = new Error("Database error");
    vi.mocked(createTestCase).mockRejectedValue(error);

    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/test case name/i)).toBeInTheDocument();
    });

    // Fill in all fields
    await user.type(screen.getByLabelText(/test case name/i), "Test Name");
    await user.type(
      screen.getByLabelText(/voice bot description/i),
      "Test description with enough characters"
    );
    await user.type(screen.getByLabelText(/kind of test cases/i), "Testing");
    await user.type(screen.getByLabelText(/test phone number/i), "+1234567890");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create test case. Please try again.");
    });
  });

  it("should show loading state during submission", async () => {
    const user = userEvent.setup();
    let resolveCreate: () => void;
    const createPromise = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(createTestCase).mockReturnValue(createPromise);

    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/test case name/i)).toBeInTheDocument();
    });

    // Fill in all fields
    await user.type(screen.getByLabelText(/test case name/i), "Test");
    await user.type(
      screen.getByLabelText(/voice bot description/i),
      "Description here"
    );
    await user.type(screen.getByLabelText(/kind of test cases/i), "Test");
    await user.type(screen.getByLabelText(/test phone number/i), "+1234567890");
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");

    const submitButton = screen.getByRole("button", { name: /^create test case$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });

    // Resolve the promise to finish loading
    resolveCreate!();
  });

  it("should close dialog on cancel button click", async () => {
    const user = userEvent.setup();
    render(<CreateTestCaseDialog />);

    await user.click(screen.getByRole("button", { name: /create new test/i }));

    await waitFor(() => {
      expect(screen.getByText("Create New Test Case")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Create New Test Case")).not.toBeInTheDocument();
    });
  });
});
