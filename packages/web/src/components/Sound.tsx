import type { Callouts } from "../lib/useCallouts.ts";
import { PixelIcon } from "./PixelIcon.tsx";

export function SoundPrompt({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`status status-accent ${className}`}>
      Tap to turn sound on
    </button>
  );
}

export function SoundButton({ sound, className = "" }: { sound: Callouts; className?: string }) {
  return (
    <button
      type="button"
      className={`p-0 ${className}`}
      aria-label="Sound"
      aria-pressed={sound.on}
      onClick={sound.toggle}
    >
      <PixelIcon name={sound.on ? "sound" : "muted"} height="50%" />
    </button>
  );
}
