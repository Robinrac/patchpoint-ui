import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParticleImage } from "./ParticleImage";

const createSketchMock = vi.fn();
const p5Instances: Array<{
  loop: ReturnType<typeof vi.fn>;
  noLoop: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}> = [];

vi.mock("./engine/createSketch", () => ({
  createSketch: (...args: unknown[]) => createSketchMock(...args),
}));

vi.mock("p5", () => ({
  default: class P5Mock {
    loop = vi.fn();
    noLoop = vi.fn();
    remove = vi.fn();

    constructor(_: unknown, __: HTMLElement) {
      p5Instances.push({
        loop: this.loop,
        noLoop: this.noLoop,
        remove: this.remove,
      });
    }
  },
}));

let currentRect = { width: 0, height: 0 };

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];

  callback: ResizeObserverCallback;
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe() {}
  unobserve() {}
}

class MockIntersectionObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

function triggerResizeObservers() {
  for (const observer of MockResizeObserver.instances) {
    observer.callback([], observer as unknown as ResizeObserver);
  }
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("ParticleImage sizing lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentRect = { width: 0, height: 0 };
    createSketchMock.mockReset();
    p5Instances.length = 0;
    MockResizeObserver.instances = [];

    createSketchMock.mockImplementation((params: unknown) => ({
      sketch: vi.fn(),
      controller: {
        resize: vi.fn(),
        getMetrics: vi.fn(() => ({
          dotCount: 0,
          bouncerCount: 0,
          lastDrawMs: 0,
          avgDrawMs: 0,
          worstDrawMs: 0,
          lastAction: "init",
          genCacheHit: false,
        })),
      },
    }));

    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number),
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((id: number) => clearTimeout(id)),
    );

    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value() {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: currentRect.width,
          bottom: currentRect.height,
          width: currentRect.width,
          height: currentRect.height,
          toJSON() {
            return this;
          },
        };
      },
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value() {
        let fillStyle = "#000000";
        return {
          get fillStyle() {
            return fillStyle;
          },
          set fillStyle(value: string) {
            fillStyle = value;
          },
        };
      },
    });
  });

  it("repairs an initially incomplete measurement in image mode without recreating the engine", async () => {
    currentRect = { width: 640, height: 0 };
    render(<ParticleImage imagePath="/logo.png" />);

    await flushMicrotasks();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    expect(createSketchMock.mock.calls[0]?.[0]).toMatchObject({ width: 500, height: 300, skipImage: false });

    currentRect = { width: 640, height: 320 };
    act(() => triggerResizeObservers());
    await flushEffects();

    const controller = createSketchMock.mock.results[0]?.value.controller;
    expect(controller.resize).toHaveBeenCalledTimes(1);
    expect(controller.resize).toHaveBeenLastCalledWith(640, 320, expect.any(Object));
    expect(createSketchMock).toHaveBeenCalledTimes(1);
  });

  it("uses the measured non-square container in particle-only mode", async () => {
    currentRect = { width: 720, height: 0 };
    render(<ParticleImage mode="particles" preset="background" />);

    await flushMicrotasks();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    expect(createSketchMock.mock.calls[0]?.[0]).toMatchObject({ width: 800, height: 800, skipImage: true });

    currentRect = { width: 720, height: 420 };
    act(() => triggerResizeObservers());
    await flushEffects();

    const controller = createSketchMock.mock.results[0]?.value.controller;
    expect(controller.resize).toHaveBeenLastCalledWith(720, 420, expect.any(Object));
  });

  it("updates the canvas on later size changes through the fast path", async () => {
    currentRect = { width: 800, height: 360 };
    const { rerender } = render(<ParticleImage imagePath="/logo.png" width={800} height={360} />);

    await flushMicrotasks();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    expect(createSketchMock.mock.calls[0]?.[0]).toMatchObject({ width: 800, height: 360 });
    const controller = createSketchMock.mock.results[0]?.value.controller;

    rerender(<ParticleImage imagePath="/logo.png" width={980} height={520} />);
    await flushMicrotasks();

    expect(controller.resize).toHaveBeenCalledTimes(1);
    expect(controller.resize).toHaveBeenLastCalledWith(980, 520, expect.any(Object));
    expect(createSketchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated same-size notifications and keeps a single p5 instance", async () => {
    currentRect = { width: 760, height: 340 };
    render(<ParticleImage imagePath="/logo.png" />);

    await flushMicrotasks();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    const controller = createSketchMock.mock.results[0]?.value.controller;

    act(() => triggerResizeObservers());
    await flushEffects();

    expect(controller.resize).not.toHaveBeenCalled();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    expect(p5Instances).toHaveLength(1);
  });

  it("cleans up observers, animation work, and the p5 instance on unmount", async () => {
    currentRect = { width: 0, height: 0 };
    const { unmount } = render(<ParticleImage imagePath="/logo.png" />);

    await flushMicrotasks();
    expect(createSketchMock).toHaveBeenCalledTimes(1);
    unmount();

    expect(MockResizeObserver.instances[0]?.disconnect).toHaveBeenCalledTimes(1);
    expect(p5Instances[0]?.remove).toHaveBeenCalledTimes(1);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not inline a derived fallback height when height is uncontrolled", () => {
    currentRect = { width: 640, height: 320 };
    const { container } = render(<ParticleImage imagePath="/logo.png" />);
    const wrapper = container.querySelector("[data-component='ParticleImage']") as HTMLDivElement;

    expect(wrapper.style.height).toBe("");
    expect(wrapper.style.aspectRatio).toBe(String(1 / 0.6));
  });
});
