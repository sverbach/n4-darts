import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CallPack, createCallPlayer, defaultPack, LATE_MS } from "./callPlayer.ts";

let played: string[];
let sources: { onended: (() => void) | null }[];

class FakeContext {
  state = "suspended";
  destination = {};
  async resume() {
    this.state = "running";
  }
  async close() {}
  async decodeAudioData(data: ArrayBuffer) {
    return { url: new TextDecoder().decode(data) };
  }
  createBufferSource() {
    const source = {
      buffer: null as { url: string } | null,
      onended: null as (() => void) | null,
      connect() {},
      start() {
        played.push(source.buffer?.url ?? "?");
      },
      stop() {},
    };
    sources.push(source);
    return source;
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const end = async () => {
  sources.at(-1)?.onended?.();
  await settle();
};

beforeEach(() => {
  played = [];
  sources = [];
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("fetch", async (url: string) =>
    url.includes("missing")
      ? new Response(null, { status: 404 })
      : new Response(new TextEncoder().encode(url)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const pack: CallPack = { "60": ["/60.mp3"], gameshot: ["/gs.mp3", "/gs+1.mp3"] };

describe("the call player", () => {
  it("plays calls one after another", async () => {
    const player = createCallPlayer(() => 0);
    await player.unlock();
    player.load(pack);
    player.play(["60", "gameshot"]);
    await settle();
    expect(played).toEqual(["/60.mp3"]);
    await end();
    expect(played).toEqual(["/60.mp3", "/gs.mp3"]);
  });

  it("picks one of a key's variants", async () => {
    const player = createCallPlayer((count) => count - 1);
    await player.unlock();
    player.load(pack);
    player.play(["gameshot"]);
    await settle();
    expect(played).toEqual(["/gs+1.mp3"]);
  });

  it("skips a key the pack lacks or can't load", async () => {
    const player = createCallPlayer(() => 0);
    await player.unlock();
    player.load({ ...pack, busted: ["/missing.mp3"] });
    player.play(["180", "busted", "60"]);
    await settle();
    expect(played).toEqual(["/60.mp3"]);
  });

  it("skips calls that would come late", async () => {
    const player = createCallPlayer(() => 0);
    await player.unlock();
    player.load(pack);
    player.play(["60", "gameshot"]);
    await settle();
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now + LATE_MS + 1);
    await end();
    expect(played).toEqual(["/60.mp3"]);
  });

  it("plays nothing once stopped", async () => {
    const player = createCallPlayer(() => 0);
    await player.unlock();
    player.load(pack);
    player.play(["60", "gameshot"]);
    player.stop();
    await settle();
    expect(played).toEqual([]);
  });

  it("ships a file for every key by default", () => {
    const files = Object.keys(import.meta.glob("/public/callouts/default/*.mp3")).map((file) =>
      file.replace("/public", ""),
    );
    expect(Object.values(defaultPack).flat().sort()).toEqual(files.sort());
    expect(defaultPack["180"]).toEqual(["/callouts/default/180.mp3"]);
  });
});
