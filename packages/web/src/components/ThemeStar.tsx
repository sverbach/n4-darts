import { useEffect, useState } from "react";
import { useTheme } from "../lib/theme.ts";

const SPARKLES =
  "M3 3h1v2h-1zM2 5h3v1h-3zM0 6h7v1h-7zM2 7h3v1h-3zM3 8h1v2h-1zM8 0h1v1h-1zM7 1h3v1h-3zM8 2h1v1h-1z";

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
        className={`ghost text-text hover:text-accent focus-visible:text-accent flex-none border-0 p-0 ${className}`}
        aria-label={`Theme: ${theme.name}. Next theme`}
        onClick={() => {
          next();
          setShown((prev) => (prev ?? 0) + 1);
        }}
      >
        <svg
          viewBox="0 0 10 10"
          className={`block h-auto ${star}`}
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <path fill="currentColor" d={SPARKLES} />
        </svg>
      </button>
      <span role="status" className="sr-only">
        {shown !== null ? theme.name : ""}
      </span>
      {shown !== null && (
        <span
          key={shown}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 z-40 -translate-y-1/2 ${side === "left" ? "right-full mr-1" : "left-full ml-1"} border-accent-line bg-accent-tint font-pixel text-accent border border-solid px-2 py-1 tracking-[1px] whitespace-nowrap uppercase motion-safe:animate-[theme-flash_1.5s_ease-out_forwards] ${flash}`}
        >
          {theme.name}
        </span>
      )}
    </span>
  );
}
