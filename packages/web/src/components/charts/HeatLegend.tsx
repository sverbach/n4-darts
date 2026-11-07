import { HEAT_BG } from "./heat.ts";

export function HeatLegend({ low, high }: { low: string; high: string }) {
  return (
    <div
      className="flex w-[200px] flex-col gap-1.5"
      role="img"
      aria-label={`Colours from ${low} to ${high}`}
    >
      <span className="flex h-2.5 gap-px">
        {HEAT_BG.map((bg) => (
          <span key={bg} className={`flex-1 ${bg}`} />
        ))}
      </span>
      <span className="flex justify-between whitespace-nowrap">
        <span className="label">{low}</span>
        <span className="label">{high}</span>
      </span>
    </div>
  );
}
