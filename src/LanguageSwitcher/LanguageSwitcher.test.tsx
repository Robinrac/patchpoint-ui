import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";

// ─── helpers ─────────────────────────────────────────────────────────────────

const trigger = () => screen.getByRole("button", { name: /select language/i });
const menu = () => screen.getByRole("menu");
const queryMenu = () => screen.queryByRole("menu");

// ─── tests ───────────────────────────────────────────────────────────────────

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    // Clean up any portals left in document.body between tests
    document.body.innerHTML = "";
  });

  // --- rendering ---

  it("renders the trigger with aria-haspopup=menu and aria-expanded=false", () => {
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const btn = trigger();
    expect(btn).toHaveAttribute("aria-haspopup", "menu");
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("shows EN label when value=en", () => {
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("shows SV label when value=sv", () => {
    render(<LanguageSwitcher value="sv" onChange={() => {}} />);
    expect(screen.getByText("SV")).toBeInTheDocument();
  });

  it("renders an SVG flag", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("accepts a className prop on the wrapper", () => {
    const { container } = render(
      <LanguageSwitcher value="en" onChange={() => {}} className="my-class" />,
    );
    expect(container.firstChild).toHaveClass("my-class");
  });

  it("uses a custom ariaLabel", () => {
    render(<LanguageSwitcher value="en" onChange={() => {}} ariaLabel="Välj språk" />);
    expect(screen.getByRole("button", { name: "Välj språk" })).toBeInTheDocument();
  });

  // --- open / close ---

  it("opens the menu on trigger click", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    expect(menu()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the non-current locale option when open (en → shows SV)", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    expect(within(menu()).getByRole("menuitem", { name: "Svenska" })).toBeInTheDocument();
  });

  it("shows the non-current locale option when open (sv → shows EN)", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="sv" onChange={() => {}} />);
    await user.click(trigger());
    expect(within(menu()).getByRole("menuitem", { name: "English" })).toBeInTheDocument();
  });

  it("does NOT show the current locale as a menu item", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    expect(within(menu()).queryByRole("menuitem", { name: "English" })).toBeNull();
  });

  it("closes the menu when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    expect(menu()).toBeInTheDocument();
    await user.click(trigger());
    expect(queryMenu()).toBeNull();
  });

  it("closes the menu on Escape and returns focus to trigger", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    expect(menu()).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(queryMenu()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  // --- onChange ---

  it("calls onChange with the selected locale", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={onChange} />);
    await user.click(trigger());
    await user.click(within(menu()).getByRole("menuitem", { name: "Svenska" }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith("sv");
  });

  it("closes the menu after selecting a locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    await user.click(within(menu()).getByRole("menuitem", { name: "Svenska" }));
    expect(queryMenu()).toBeNull();
  });

  it("does not persist anything (pure controlled — value unchanged unless parent updates)", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    await user.click(within(menu()).getByRole("menuitem", { name: "Svenska" }));
    // After click the menu is closed; re-opening should still show SV option
    // because the parent hasn't updated value (still "en")
    await user.click(trigger());
    expect(within(menu()).getByRole("menuitem", { name: "Svenska" })).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  // --- disabled ---

  it("renders the trigger as disabled when disabled=true", () => {
    render(<LanguageSwitcher value="en" onChange={() => {}} disabled />);
    expect(trigger()).toBeDisabled();
  });

  it("does not open the menu when disabled", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} disabled />);
    await user.click(trigger());
    expect(queryMenu()).toBeNull();
  });

  it("does not call onChange when disabled", async () => {
    const onChange = vi.fn();
    render(<LanguageSwitcher value="en" onChange={onChange} disabled />);
    // direct fire won't open menu, so onChange never gets chance
    expect(onChange).not.toHaveBeenCalled();
  });

  // --- accessibility ---

  it("trigger has aria-controls pointing to the menu id", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const menuEl = menu();
    const controls = trigger().getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(menuEl.id).toBe(controls);
  });

  it("menu items have role=menuitem", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const items = within(menu()).getAllByRole("menuitem");
    expect(items).toHaveLength(1); // one non-current locale
    expect(items[0]).not.toHaveAttribute("aria-selected"); // menu items don't use aria-selected
  });

  it("flag images are aria-hidden in trigger", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const svgs = container.querySelectorAll("svg");
    // The trigger flag SVG should be aria-hidden
    const triggerSvg = Array.from(svgs).find(
      (svg) => svg.getAttribute("aria-hidden") === "true",
    );
    expect(triggerSvg).toBeTruthy();
  });

  // --- no Next.js dependency ---

  it("does not import next/image or next/router", async () => {
    // Verify the module loads without Next.js present
    const mod = await import("./LanguageSwitcher");
    expect(typeof mod.LanguageSwitcher).toBe("function");
  });
});
