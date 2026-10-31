// Small pixel-art icons, drawn in the text colour; one SVG unit is one pixel.

const ICONS = {
  /** A solid triangle pointing right: "Continue", "Next player", list chevrons. */
  arrow: { size: [4, 7], d: "M0 0h1v7h-1zM1 1h1v5h-1zM2 2h1v3h-1zM3 3h1v1h-1z" },
  /** A small caret pointing right: "Throwing", collapsible sections. */
  caret: { size: [3, 5], d: "M0 0h1v5h-1zM1 1h1v3h-1zM2 2h1v1h-1z" },
  /** An arrow pointing left: back links. */
  back: { size: [7, 5], d: "M2 0h1v1h-1zM1 1h1v1h-1zM0 2h7v1h-7zM1 3h1v1h-1zM2 4h1v1h-1z" },
  up: { size: [5, 7], d: "M2 0h1v7h-1zM1 1h1v1h-1zM3 1h1v1h-1zM0 2h1v1h-1zM4 2h1v1h-1z" },
  down: { size: [5, 7], d: "M2 0h1v7h-1zM1 5h1v1h-1zM3 5h1v1h-1zM0 4h1v1h-1zM4 4h1v1h-1z" },
  /** Three dots: "edit" badges. */
  dots: { size: [5, 1], d: "M0 0h1v1h-1zM2 0h1v1h-1zM4 0h1v1h-1z" },
  trophy: {
    size: [12, 12],
    d: "M3 1h6v1h2v3h-1v1h-1v1h-1v1h-1v1h2v2h-6v-2h2v-1h-1v-1h-1v-1h-1v-1h-1v-3h2zM2 3v2h1v-2zM9 3v2h1v-2z",
  },
} as const;

export type PixelIconName = keyof typeof ICONS;

/** Sized by its height (default 1em); the width follows the icon's proportions. */
export function PixelIcon(props: { name: PixelIconName; height?: string; label?: string }) {
  const { name, height, label } = props;
  const { size, d } = ICONS[name];
  const box = `0 0 ${size[0]} ${size[1]}`;
  const style = height ? { height } : undefined;
  const path = <path fill="currentColor" d={d} />;
  return label ? (
    <svg className="pixel-icon" viewBox={box} shapeRendering="crispEdges" style={style} role="img">
      <title>{label}</title>
      {path}
    </svg>
  ) : (
    <svg
      className="pixel-icon"
      viewBox={box}
      shapeRendering="crispEdges"
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
