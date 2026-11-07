import { useEffect, useState } from "react";
import { useTheme } from "../lib/theme.ts";

const STAR =
  "M7 0h1v1h-1zM7 1h1v1h-1zM7 2h1v1h-1zM6 3h3v1h-3zM6 4h3v1h-3zM5 5h5v1h-5zM3 6h9v1h-9zM0 7h15v1h-15zM3 8h9v1h-9zM5 9h5v1h-5zM6 10h3v1h-3zM6 11h3v1h-3zM7 12h1v1h-1zM7 13h1v1h-1zM7 14h1v1h-1z";

export function ThemeStar({
  className = "size-11",
  star = "w-5",
  flash = "text-[11px]",
  side = "left",
}: {
  className?: string;
  star?: string;
  flash?: string;
  side?: "left" | "right";
}) {
  const { theme, next } = useTheme();
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(null), 1500);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <span className="relative inline-flex flex-none">
      <button
        type="button"
        className={`ghost flex-none border-0 p-0 text-accent hover:text-text focus-visible:text-text ${className}`}
        aria-label={`Theme: ${theme.name}. Next theme`}
        onClick={() => {
          next();
          setShown((prev) => (prev ?? 0) + 1);
        }}
      >
        <svg
          viewBox="0 0 15 15"
          className={`block h-auto ${star}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path fill="currentColor" d={STAR} />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {shown !== null ? theme.name : ""}
      </span>
      {shown !== null && (
        <span
          key={shown}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 z-40 -translate-y-1/2 ${side === "left" ? "right-full mr-1" : "left-full ml-1"} whitespace-nowrap border border-accent-line border-solid bg-accent-tint px-2 py-1 font-pixel text-accent uppercase tracking-[1px] motion-safe:animate-[theme-flash_1.5s_ease-out_forwards] ${flash}`}
        >
          {theme.name}
        </span>
      )}
    </span>
  );
}
