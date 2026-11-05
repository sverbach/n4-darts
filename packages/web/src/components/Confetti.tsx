import { useEffect, useState } from "react";
import ReactConfetti from "react-confetti";

const TOKENS = ["--accent", "--ok", "--warn", "--danger", "--text"];
const PIECES = 400;

const windowSize = () => ({ width: window.innerWidth, height: window.innerHeight });

/** One burst of confetti over the whole window, in the theme's colours; none under reduced motion. */
export function Confetti() {
  const [colors] = useState(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
    const style = getComputedStyle(document.documentElement);
    return TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean);
  });
  const [size, setSize] = useState(windowSize);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onResize = () => setSize(windowSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!colors || done) return null;
  return (
    <ReactConfetti
      width={size.width}
      height={size.height}
      colors={colors}
      numberOfPieces={PIECES}
      recycle={false}
      onConfettiComplete={() => setDone(true)}
      style={{ position: "fixed", zIndex: 50 }}
      aria-hidden
    />
  );
}
