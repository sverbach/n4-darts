import type { Award } from "@n4/server/api";

const AWARDS: Record<Award["kind"], { title: string; format(value: number): string }> = {
  bestAverage: { title: "Best match average", format: (v) => v.toFixed(1) },
  highestCheckout: { title: "Highest checkout", format: String },
  most180s: { title: "Most 180s", format: String },
  bestLeg: { title: "Best leg", format: (v) => `${v} dart${v === 1 ? "" : "s"}` },
};

/** The evening's awards: what, the value, who. */
export function Awards({ awards }: { awards: Award[] }) {
  return (
    <ul className="awards">
      {awards.map((award) => (
        <li key={award.kind}>
          <span className="award-title">{AWARDS[award.kind].title}</span>
          <span className="award-players">{award.players.join(", ")}</span>
          <span className="award-value">{AWARDS[award.kind].format(award.value)}</span>
        </li>
      ))}
    </ul>
  );
}
