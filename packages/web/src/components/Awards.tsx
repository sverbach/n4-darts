import type { Award } from "@n4/server/api";

const AWARDS: Record<Award["kind"], { title: string; format(value: number): string }> = {
  bestAverage: { title: "Best match average", format: (v) => v.toFixed(1) },
  highestCheckout: { title: "Highest checkout", format: String },
  most180s: { title: "Most 180s", format: String },
  bestLeg: { title: "Best leg", format: (v) => `${v} dart${v === 1 ? "" : "s"}` },
};

/** On the projector (`--px` units); on /admin it keeps its classes for admin.css. */
const PROJECTOR = {
  list: "m-0 flex list-none flex-col gap-pu-14 p-0",
  item: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-pu-18 gap-y-pu-8 border border-border border-solid bg-panel px-pu-26 py-pu-22 [grid-template-areas:'title_value'_'players_value']",
  title: "font-pixel text-muted text-pu-15 uppercase tracking-pu-2 [grid-area:title]",
  players: "font-pixel text-pu-24 uppercase tracking-pu-2 [grid-area:players]",
  value: "text-accent text-pu-72 leading-[0.8] [grid-area:value]",
};

/** The evening's awards: what, the value, who. */
export function Awards({ awards, projector = false }: { awards: Award[]; projector?: boolean }) {
  const p = projector ? PROJECTOR : null;
  return (
    <ul className={p ? p.list : "awards"}>
      {awards.map((award) => (
        <li key={award.kind} className={p?.item}>
          <span className={p ? p.title : "award-title"}>{AWARDS[award.kind].title}</span>
          <span className={p ? p.players : "award-players"}>{award.players.join(", ")}</span>
          <span className={p ? p.value : "award-value"}>
            {AWARDS[award.kind].format(award.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
