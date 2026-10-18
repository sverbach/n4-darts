import type { BoardSim, BoardState } from "./sim.ts";

export interface RecordedState {
  /** Milliseconds since midnight, from the recording's `HH:MM:SS.mmm` prefix. */
  at: number;
  state: BoardState;
}

/** Parses a `listen-board.ps1` log: one `HH:MM:SS.mmm {"type":"state","data":{...}}` per line. */
export function parseRecording(text: string): RecordedState[] {
  const entries: RecordedState[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\[?(\d{2}):(\d{2}):(\d{2})\.(\d{3})\]?\s+(\{.*\})\s*$/.exec(line);
    if (!match) continue;
    const [, h, m, s, ms, json] = match;
    const message = JSON.parse(json as string);
    if (message.type !== "state") continue;
    const at = ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms);
    entries.push({ at, state: message.data });
  }
  return entries;
}

/** Publishes recorded states with their original spacing, divided by `speed`. */
export async function replay(sim: BoardSim, entries: RecordedState[], speed = 1): Promise<void> {
  let previous = entries[0]?.at ?? 0;
  for (const { at, state } of entries) {
    const gap = Math.max(0, at - previous) / speed;
    // Recordings can contain several sessions; don't wait across long breaks.
    if (gap > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(gap, 5000)));
    previous = at;
    sim.publish(state);
  }
}
