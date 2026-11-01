import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLoading } from "./loading.ts";

function setup() {
  const bar = { start: vi.fn(), done: vi.fn() };
  return { bar, begin: createLoading(bar, 200) };
}

describe("the loading bar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays hidden for a load under 200 ms", () => {
    const { bar, begin } = setup();
    const end = begin();
    vi.advanceTimersByTime(150);
    end();
    vi.advanceTimersByTime(500);
    expect(bar.start).not.toHaveBeenCalled();
    expect(bar.done).not.toHaveBeenCalled();
  });

  it("shows after 200 ms and finishes when the load ends", () => {
    const { bar, begin } = setup();
    const end = begin();
    vi.advanceTimersByTime(200);
    expect(bar.start).toHaveBeenCalledOnce();
    end();
    expect(bar.done).toHaveBeenCalledOnce();
  });

  it("runs once for overlapping loads, until the last one ends", () => {
    const { bar, begin } = setup();
    const first = begin();
    const second = begin();
    vi.advanceTimersByTime(300);
    first();
    expect(bar.done).not.toHaveBeenCalled();
    second();
    expect(bar.start).toHaveBeenCalledOnce();
    expect(bar.done).toHaveBeenCalledOnce();
  });

  it("counts an end only once", () => {
    const { bar, begin } = setup();
    const first = begin();
    const second = begin();
    vi.advanceTimersByTime(300);
    first();
    first();
    expect(bar.done).not.toHaveBeenCalled();
    second();
    expect(bar.done).toHaveBeenCalledOnce();
  });
});
