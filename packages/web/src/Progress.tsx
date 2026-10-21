// The tournament's progress in the /display and admin headers.

/** A square per match, filled once played. */
export function Progress({ played, total }: { played: number; total: number }) {
  return (
    <div
      className="progress"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`${played} of ${total} matches played`}
    >
      {Array.from({ length: total }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the squares are just positions.
        <span key={i} className={i < played ? "done" : ""} />
      ))}
    </div>
  );
}
