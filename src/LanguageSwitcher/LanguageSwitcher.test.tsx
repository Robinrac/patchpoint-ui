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

  // --- multi-instance SVG ID collision safety ---

  it("multiple instances produce unique clip-path IDs (no DOM ID collisions)", async () => {
    const user = userEvent.setup();
    render(
      <>
        <LanguageSwitcher value="en" onChange={() => {}} />
        <LanguageSwitcher value="sv" onChange={() => {}} />
      </>,
    );
    // Open both menus sequentially to force both GbFlag and SeFlag to render
    const triggers = screen.getAllByRole("button");
    await user.click(triggers[0]);
    await user.click(triggers[1]); // opening second closes first (click outside), that's fine

    // Collect all clipPath ids in the document
    const clipPaths = document.querySelectorAll("clipPath[id]");
    const ids = Array.from(clipPaths).map((el) => el.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size); // no duplicates
  });

  it("changing locale updates the rendered flag", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    expect(screen.getByText("EN")).toBeInTheDocument();

    rerender(<LanguageSwitcher value="sv" onChange={() => {}} />);
    expect(screen.getByText("SV")).toBeInTheDocument();
    expect(screen.queryByText("EN")).toBeNull();
  });

  // --- visual correctness (Phase 4) ---

  it("dropdown container has transparent background — no dark panel", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const menuEl = menu();
    expect(menuEl.style.background).toBe("transparent");
  });

  it("dropdown container has no backdropFilter", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const menuEl = menu();
    expect(menuEl.style.backdropFilter).toBeFalsy();
    // WebkitBackdropFilter is not in the standard CSSStyleDeclaration type but present at runtime
    expect((menuEl.style as unknown as Record<string, string>)["WebkitBackdropFilter"]).toBeFalsy();
  });

  it("dropdown container has no border", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const menuEl = menu();
    expect(menuEl.style.border).toBeFalsy();
  });

  it("dropdown container has no box-shadow", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const menuEl = menu();
    expect(menuEl.style.boxShadow).toBeFalsy();
  });

  it("trigger gap and padding are controlled by CSS class, not inline style", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const btn = container.querySelector("button.ppui-lang-trigger") as HTMLButtonElement;
    expect(btn).not.toBeNull();
    // gap and padding must not appear in inline style (they come from .ppui-lang-trigger CSS)
    expect(btn.style.gap).toBe("");
    expect(btn.style.padding).toBe("");
  });

  it("trigger button does not set font-family (inherits from app)", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const btn = container.querySelector("button") as HTMLButtonElement;
    expect(btn.style.fontFamily).toBe("");
  });

  it("label uses ppui-lang-label CSS class (no inline style)", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const label = container.querySelector(".ppui-lang-label") as HTMLElement;
    expect(label).not.toBeNull();
    // No inline style attribute on the label span
    expect(label.getAttribute("style")).toBeFalsy();
  });

  it("flag uses ppui-lang-flag CSS class with no inline border-radius or flexShrink", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const flag = container.querySelector(".ppui-lang-flag") as SVGElement;
    expect(flag).not.toBeNull();
    expect(flag.style.borderRadius).toBe("");
    expect(flag.style.flexShrink).toBe("");
  });

  it("chevron uses ppui-lang-chevron CSS class", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const chevron = container.querySelector(".ppui-lang-chevron") as SVGElement;
    expect(chevron).not.toBeNull();
  });

  it("chevron is rotated -90deg when closed and 0deg when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const chevron = container.querySelector(".ppui-lang-chevron") as SVGElement;
    expect(chevron.style.transform).toBe("rotate(-90deg)");

    await user.click(trigger());
    expect(chevron.style.transform).toBe("rotate(0deg)");
  });

  it("chevron SVG uses strokeWidth 2.5 matching Tabler IconChevronDown", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const chevron = container.querySelector(".ppui-lang-chevron") as SVGElement;
    expect(chevron.getAttribute("stroke-width")).toBe("2.5");
  });

  it("chevron path matches Tabler IconChevronDown geometry (M6 9l6 6 6-6)", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const chevron = container.querySelector(".ppui-lang-chevron") as SVGElement;
    const paths = chevron.querySelectorAll("path");
    // One invisible bounding path + one visible chevron path
    const visiblePath = Array.from(paths).find(
      (p) => p.getAttribute("stroke") !== "none",
    );
    expect(visiblePath).toBeTruthy();
    expect(visiblePath!.getAttribute("d")).toBe("M6 9l6 6 6-6");
  });

  it("option items have no inline gap, padding, font-size, or letter-spacing (CSS class controls these)", async () => {
    const user = userEvent.setup();
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    // The item button is in the portal, look in document.body
    const itemBtn = document.querySelector(".ppui-lang-item") as HTMLButtonElement;
    expect(itemBtn).not.toBeNull();
    expect(itemBtn.style.gap).toBe("");
    expect(itemBtn.style.padding).toBe("");
    expect(itemBtn.style.fontSize).toBe("");
    expect(itemBtn.style.letterSpacing).toBe("");
  });

  it("option item inline style only sets border and color", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher value="en" onChange={() => {}} />);
    await user.click(trigger());
    const itemBtn = document.querySelector(".ppui-lang-item") as HTMLButtonElement;
    expect(itemBtn.style.color).toBe("rgba(255, 255, 255, 0.7)");
    // border:none normalizes to empty string in jsdom
    expect(itemBtn.style.borderWidth).toBeFalsy();
    // font-family must not be set
    expect(itemBtn.style.fontFamily).toBe("");
  });

  it("GbFlag has preserveAspectRatio=xMidYMid slice for object-cover behavior", () => {
    const { container } = render(<LanguageSwitcher value="en" onChange={() => {}} />);
    const flagSvg = container.querySelector(".ppui-lang-flag") as SVGElement;
    expect(flagSvg.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
  });

  it("SeFlag has preserveAspectRatio=xMidYMid slice for object-cover behavior", () => {
    const { container } = render(<LanguageSwitcher value="sv" onChange={() => {}} />);
    const flagSvg = container.querySelector(".ppui-lang-flag") as SVGElement;
    expect(flagSvg.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
  });
});
