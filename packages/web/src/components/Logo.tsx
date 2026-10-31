// The n4-darts logo, pixel art drawn in the text colour (so a theme can recolour it).

import sparkleSheet from "../assets/logo-sparkle.png";

const PATH =
  "M0 0h5v1h-5zM0 1h7v1h-7zM0 2h4v1h-4zM7 2h2v1h-2zM0 3h4v1h-4zM0 4h4v1h-4zM14 4h1v1h-1zM20 4h2v1h-2zM1 5h3v1h-3zM15 5h2v1h-2zM19 5h2v1h-2zM1 6h3v1h-3zM15 6h5v1h-5zM1 7h4v1h-4zM15 7h5v1h-5zM2 8h3v1h-3zM15 8h5v1h-5zM3 9h3v1h-3zM15 9h5v1h-5zM3 10h3v1h-3zM14 10h2v1h-2zM19 10h2v1h-2zM4 11h3v1h-3zM14 11h1v1h-1zM21 11h1v1h-1zM41 11h2v1h-2zM60 11h2v1h-2zM5 12h3v1h-3zM26 12h3v1h-3zM41 12h2v1h-2zM60 12h2v1h-2zM5 13h3v1h-3zM24 13h4v1h-4zM40 13h2v1h-2zM59 13h3v1h-3zM6 14h3v1h-3zM11 14h8v1h-8zM23 14h5v1h-5zM34 14h8v1h-8zM43 14h8v1h-8zM52 14h12v1h-12zM65 14h7v1h-7zM7 15h12v1h-12zM21 15h3v1h-3zM25 15h2v1h-2zM33 15h8v1h-8zM43 15h7v1h-7zM51 15h6v1h-6zM58 15h5v1h-5zM64 15h8v1h-8zM8 16h4v1h-4zM16 16h2v1h-2zM19 16h3v1h-3zM25 16h2v1h-2zM32 16h2v1h-2zM38 16h3v1h-3zM48 16h4v1h-4zM57 16h2v1h-2zM63 16h2v1h-2zM9 17h3v1h-3zM15 17h12v1h-12zM32 17h2v1h-2zM38 17h2v1h-2zM41 17h8v1h-8zM50 17h2v1h-2zM57 17h2v1h-2zM63 17h7v1h-7zM9 18h4v1h-4zM15 18h12v1h-12zM31 18h2v1h-2zM37 18h2v1h-2zM40 18h3v1h-3zM46 18h5v1h-5zM56 18h2v1h-2zM64 18h6v1h-6zM8 19h8v1h-8zM23 19h2v1h-2zM30 19h3v1h-3zM37 19h2v1h-2zM40 19h2v1h-2zM46 19h2v1h-2zM49 19h2v1h-2zM56 19h2v1h-2zM61 19h2v1h-2zM67 19h3v1h-3zM7 20h2v1h-2zM11 20h5v1h-5zM22 20h2v1h-2zM30 20h8v1h-8zM39 20h8v1h-8zM48 20h2v1h-2zM55 20h5v1h-5zM61 20h8v1h-8zM7 21h2v1h-2zM12 21h4v1h-4zM22 21h1v1h-1zM31 21h6v1h-6zM40 21h7v1h-7zM48 21h1v1h-1zM56 21h3v1h-3zM62 21h5v1h-5zM13 22h4v1h-4zM15 23h3v1h-3zM29 23h1v1h-1zM16 24h3v1h-3zM30 24h1v1h-1zM17 25h4v1h-4zM30 25h1v1h-1zM18 26h4v1h-4zM31 26h1v1h-1zM19 27h5v1h-5zM31 27h1v1h-1zM21 28h5v1h-5zM31 28h2v1h-2zM22 29h11v1h-11zM24 30h9v1h-9zM25 31h8v1h-8zM27 32h5v1h-5z";

/** Sized by its width (here or in CSS); the height follows (72 × 33 pixels). */
export function Logo({ width, className }: { width?: string; className?: string }) {
  return (
    <a href="/">
      <svg
        className={`logo block h-auto text-text ${className ?? ""}`}
        viewBox="0 0 72 33"
        shapeRendering="crispEdges"
        style={width ? { width } : undefined}
        role="img"
        aria-label="n4-darts"
      >
        <path fill="currentColor" d={PATH} />
      </svg>
    </a>
  );
}

/**
 * The logo hovering slowly with stars sparkling around it, for the home page. A spritesheet of
 * 64 frames of 76 × 39 pixels (the logo plus a 2 px margin), stepped through by the `logo-sparkle`
 * animation (styles/app.css): the strip is 64 frames wide and moves one frame at a time.
 * Its colours are baked in, so it doesn't follow the theme's text colour.
 */
export function SparkleLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`aspect-[76/39] overflow-hidden ${className}`} role="img" aria-label="n4-darts">
      <img
        src={sparkleSheet}
        alt=""
        draggable={false}
        className="block h-full w-[6400%] animate-[logo-sparkle_5.12s_steps(64)_infinite] [image-rendering:pixelated] motion-reduce:animate-none"
      />
    </div>
  );
}
