import { type PointerEvent, useRef, useState } from "react";
import { nearestIndex } from "./scales.ts";

export function usePointer(positions: readonly number[], width: number) {
  const svg = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    setActive(nearestIndex(positions, ((event.clientX - box.left) / box.width) * width));
  };
  return {
    active: active !== null && active < positions.length ? active : null,
    handlers: {
      ref: svg,
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => e.pointerType === "mouse" && pick(e),
      onPointerDown: pick,
      onPointerLeave: (e: PointerEvent<SVGSVGElement>) =>
        e.pointerType === "mouse" && setActive(null),
    },
  };
}

export const tooltipShift = (share: number) =>
  `translateX(${share < 0.3 ? "-10%" : share > 0.7 ? "-90%" : "-50%"})`;
