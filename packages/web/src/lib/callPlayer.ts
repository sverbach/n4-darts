import { CALL_KEYS, type CallKey } from "./callouts.ts";

export type CallPack = Partial<Record<CallKey, string[]>>;

export const defaultPack: CallPack = Object.fromEntries(
  CALL_KEYS.map((key) => [key, [`/callouts/default/${key}.mp3`]]),
);

export const LATE_MS = 3000;

export interface CallPlayer {
  unlock(): Promise<void>;
  load(pack: CallPack): void;
  play(keys: CallKey[]): void;
  stop(): void;
}

interface Pending {
  key: CallKey;
  at: number;
}

export function createCallPlayer(pick: (count: number) => number = randomIndex): CallPlayer {
  let context: AudioContext | null = null;
  let pack: CallPack = {};
  let buffers = new Map<string, Promise<AudioBuffer | null>>();
  let queue: Pending[] = [];
  let playing = false;
  let current: AudioBufferSourceNode | null = null;
  let generation = 0;

  const audio = () => {
    context ??= new AudioContext();
    return context;
  };

  const buffer = (url: string) => {
    let loaded = buffers.get(url);
    if (!loaded) {
      loaded = fetch(url)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject()))
        .then((data) => audio().decodeAudioData(data))
        .catch(() => null);
      buffers.set(url, loaded);
    }
    return loaded;
  };

  const next = async (run = generation): Promise<void> => {
    if (run !== generation) return;
    const call = queue.shift();
    if (!call) {
      playing = false;
      return;
    }
    const urls = pack[call.key] ?? [];
    const url = urls[pick(urls.length)];
    const sound = url ? await buffer(url) : null;
    if (run !== generation) return;
    if (!sound || !context || performance.now() - call.at > LATE_MS) return next(run);
    const source = context.createBufferSource();
    source.buffer = sound;
    source.connect(context.destination);
    source.onended = () => {
      if (current === source) current = null;
      void next(run);
    };
    current = source;
    source.start();
  };

  return {
    async unlock() {
      const ctx = audio();
      if (ctx.state !== "running") await ctx.resume();
    },
    load(next) {
      pack = next;
      buffers = new Map();
      for (const urls of Object.values(pack)) for (const url of urls ?? []) void buffer(url);
    },
    play(keys) {
      const at = performance.now();
      queue.push(...keys.map((key) => ({ key, at })));
      if (!playing) {
        playing = true;
        void next();
      }
    },
    stop() {
      generation += 1;
      queue = [];
      playing = false;
      const source = current;
      current = null;
      if (source) {
        source.onended = null;
        source.stop();
      }
      void context?.close();
      context = null;
      buffers = new Map();
    },
  };
}

function randomIndex(count: number) {
  return Math.floor(Math.random() * count);
}
