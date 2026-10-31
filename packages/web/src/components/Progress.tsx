// The tournament's progress in the /display and admin headers.

/** A square per match, filled once played. */
export function Progress(props: { played: number; total: number; className?: string }) {
  const { played, total, className = "" } = props;
  return (
    <div
      className={`ml-auto grid w-pu-360 gap-pu-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`${played} of ${total} matches played`}
    >
      {Array.from({ length: total }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the squares are just positions.
        <span key={i} className={`h-pu-14 ${i < played ? "bg-accent" : "bg-border"}`} />
      ))}
    </div>
  );
}
