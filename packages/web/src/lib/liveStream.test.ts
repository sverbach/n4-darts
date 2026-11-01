import { describe, expect, it } from "vitest";
import { followStream, type StreamSource } from "./liveStream.ts";

function fakeSources() {
  const all: FakeSource[] = [];
  class FakeSource implements StreamSource {
    readyState = 0;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((e: { data: string }) => void) | null = null;
    closed = false;
    readonly url: string;
    constructor(url: string) {
      this.url = url;
      all.push(this);
    }
    close() {
      this.closed = true;
    }
  }
  return { Source: FakeSource, all, open: () => all.filter((s) => !s.closed) };
}

const pageEvent = (type: string, persisted = false) =>
  Object.assign(new Event(type), { persisted }) as Event;

describe("following a live stream", () => {
  it("opens one stream and passes on its views", () => {
    const { Source, all } = fakeSources();
    const views: unknown[] = [];
    followStream(
      "/api/x/live",
      { onView: (v) => views.push(v) },
      { Source, page: new EventTarget() },
    );
    all[0]?.onmessage?.({ data: '{"n":1}' });
    expect(all).toHaveLength(1);
    expect(views).toEqual([{ n: 1 }]);
  });

  it("closes the stream when the page is left, even if the browser keeps the page", () => {
    const { Source, open } = fakeSources();
    const page = new EventTarget();
    followStream("/api/x/live", {}, { Source, page });
    page.dispatchEvent(pageEvent("pagehide", true));
    expect(open()).toHaveLength(0);
  });

  it("opens it again when the browser brings the page back", () => {
    const { Source, open } = fakeSources();
    const page = new EventTarget();
    followStream("/api/x/live", {}, { Source, page });
    page.dispatchEvent(pageEvent("pagehide", true));
    page.dispatchEvent(pageEvent("pageshow", true));
    expect(open().map((s) => s.url)).toEqual(["/api/x/live"]);
  });

  it("doesn't open a second stream on the first pageshow", () => {
    const { Source, open } = fakeSources();
    const page = new EventTarget();
    followStream("/api/x/live", {}, { Source, page });
    page.dispatchEvent(pageEvent("pageshow", false));
    expect(open()).toHaveLength(1);
  });

  it("stops for good: no stream, and no reopening on pageshow", () => {
    const { Source, open } = fakeSources();
    const page = new EventTarget();
    const stop = followStream("/api/x/live", {}, { Source, page });
    stop();
    page.dispatchEvent(pageEvent("pageshow", true));
    expect(open()).toHaveLength(0);
  });
});
