import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeToggle } from "./mode-toggle";

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: "light",
  }),
}));

describe("ModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render toggle button", () => {
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should have accessibility text", () => {
    render(<ModeToggle />);

    expect(screen.getByText("Toggle theme")).toBeInTheDocument();
  });

  it("should display sun and moon icons", () => {
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    const svgElements = button.querySelectorAll("svg");

    // Should have 2 SVG icons (Sun and Moon)
    expect(svgElements.length).toBeGreaterThanOrEqual(2);
  });

  it("should open dropdown menu when clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    // Wait for menu items to appear
    expect(await screen.findByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("should call setTheme with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    const lightOption = await screen.findByText("Light");
    await user.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should call setTheme with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    const darkOption = await screen.findByText("Dark");
    await user.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme with 'system' when System is clicked", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    const systemOption = await screen.findByText("System");
    await user.click(systemOption);

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
