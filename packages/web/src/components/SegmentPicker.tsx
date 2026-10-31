import type { Segment } from "@n4/engine";
import { useState } from "react";

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);
const MULTIPLIERS = [
  { value: 1, label: "Single" },
  { value: 2, label: "Double" },
  { value: 3, label: "Triple" },
] as const;

interface Props {
  title: string;
  /** Above the title, e.g. "Ann · Dart 2". */
  context?: string;
  /** The dart's current value, marked in the grid. */
  current?: Segment;
  onPick(segment: Segment): void;
  onCancel(): void;
}

/** Full-screen picker for correcting a dart: pick single/double/triple, then the number. */
/** The segment the dart is on now, framed. */
const CURRENT = "border-[3px] border-accent border-solid bg-accent-tint text-accent";
/** 25, Bull and Miss. */
const EXTRA = "min-h-16 p-0 font-pixel text-[14px] tracking-[2px] kiosk:min-h-24 kiosk:text-[22px]";

export function SegmentPicker({ title, context, current, onPick, onCancel }: Props) {
  const start = current && current.number !== 25 && current.multiplier > 0 ? current.multiplier : 1;
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(start as 1 | 2 | 3);
  const isCurrent = (segment: Segment) =>
    current?.number === segment.number && current.multiplier === segment.multiplier;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto border-[3px] border-accent border-solid bg-bg kiosk:p-8 p-4"
      role="dialog"
      aria-label={title}
    >
      <div className="flex max-h-full w-full max-w-[1180px] flex-col gap-4 kiosk:gap-6">
        <div className="flex items-end justify-between gap-4 border-0 border-border border-b border-solid pb-3.5">
          <div>
            {context && (
              <span className="mb-1.5 block font-pixel kiosk:text-[14px] text-[11px] text-accent uppercase tracking-[2px]">
                {context}
              </span>
            )}
            <h2 className="kiosk:text-[48px] text-[26px] kiosk:tracking-[3px] tracking-[2px]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="danger kiosk:min-h-16 border-2 kiosk:px-7 kiosk:text-[16px]"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-[repeat(3,1fr)] gap-2 kiosk:gap-3">
          {MULTIPLIERS.map((m) => (
            <button
              type="button"
              key={m.value}
              aria-pressed={multiplier === m.value}
              onClick={() => setMultiplier(m.value)}
              className="kiosk:min-h-20 min-h-14 border-0 bg-line-soft kiosk:text-[20px] text-[13px] kiosk:tracking-[2px] [clip-path:polygon(12px_0,100%_0,calc(100%_-_12px)_100%,0_100%)] kiosk:[clip-path:polygon(16px_0,100%_0,calc(100%_-_16px)_100%,0_100%)] aria-pressed:bg-accent aria-pressed:font-bold aria-pressed:text-accent-text aria-pressed:shadow-none"
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(4,1fr)] kiosk:grid-cols-[repeat(10,1fr)] gap-2 kiosk:gap-2.5">
          {NUMBERS.map((n) => (
            <button
              type="button"
              key={n}
              className={`kiosk:min-h-[104px] min-h-16 p-0 font-text kiosk:text-[60px] text-[36px] tracking-normal ${isCurrent({ number: n, multiplier }) ? CURRENT : ""}`}
              onClick={() => onPick({ number: n, multiplier })}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(3,1fr)] gap-2 kiosk:gap-2.5">
          <button
            type="button"
            className={`${EXTRA} ${isCurrent({ number: 25, multiplier: 1 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 25, multiplier: 1 })}
          >
            25
          </button>
          <button
            type="button"
            className={`${EXTRA} ${isCurrent({ number: 25, multiplier: 2 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 25, multiplier: 2 })}
          >
            Bull
          </button>
          <button
            type="button"
            className={`${EXTRA} ${isCurrent({ number: 0, multiplier: 0 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 0, multiplier: 0 })}
          >
            Miss
          </button>
        </div>
      </div>
    </div>
  );
}
