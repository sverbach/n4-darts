import { useMemo } from "react";
import { BoardFields } from "../Dartboard.tsx";
import { densityBands, type Point } from "./density.ts";
import { HEAT_FILL } from "./heat.ts";

const SIZE = 1.35;

export function DensityHeatmap({
  points,
  label,
  className = "max-w-[420px]",
}: {
  points: readonly Point[];
  label: string;
  className?: string;
}) {
  const bands = useMemo(() => densityBands(points), [points]);
  return (
    <svg
      viewBox={`${-SIZE} ${-SIZE} ${SIZE * 2} ${SIZE * 2}`}
      role="img"
      aria-label={label}
      className={`block h-auto w-full ${className}`}
    >
      <BoardFields dim>
        <g className="opacity-85">
          {bands.map((band) => (
            <path
              key={band.step}
              d={band.path}
              className={HEAT_FILL[band.step - 1]}
              fillRule="evenodd"
            />
          ))}
        </g>
      </BoardFields>
    </svg>
  );
}
