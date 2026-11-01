import type { Award } from "@n4/server/api";

/** Each award's title, its number, and a unit word where the number needs one. */
const AWARDS: Record<
  Award["kind"],
  { title: string; format(value: number): string; unit?(value: number): string }
> = {
  bestAverage: { title: "Best match average", format: (v) => v.toFixed(1) },
  highestCheckout: { title: "High out", format: String },
  most180s: { title: "Most 180s", format: String },
  bestLeg: { title: "Best leg", format: String, unit: (v) => (v === 1 ? "dart" : "darts") },
};

/** On the projector (`--px` units) and in /admin. */
const STYLES = {
  projector: {
    list: "m-0 flex list-none flex-col gap-pu-14 p-0",
    item: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-pu-18 gap-y-pu-8 border border-border border-solid bg-panel px-pu-26 py-pu-22 [grid-template-areas:'title_value'_'players_value']",
    title: "font-pixel text-muted text-pu-20 uppercase tracking-pu-2 [grid-area:title]",
    players: "font-pixel text-pu-24 uppercase tracking-pu-2 [grid-area:players]",
    value: "text-pu-72 leading-[0.8] [grid-area:value]",
  },
  admin: {
    // Three to a row on the kiosk; on a phone two, an odd last one taking the whole row.
    list: "m-0 grid list-none grid-cols-2 gap-2.5 p-0 kiosk:grid-cols-3 max-kiosk:[&>li:last-child:nth-child(odd)]:col-span-full",
    item: "flex flex-col gap-2.5 border border-border border-solid bg-panel p-4",
    title: "font-pixel text-[11px] text-muted uppercase tracking-[1px]",
    players: "order-3 font-pixel text-[13px] uppercase tracking-[1px]",
    value: "order-2 text-[48px] leading-[0.85]",
  },
};

/** The evening's awards: what, the value, who. */
export function Awards({ awards, projector = false }: { awards: Award[]; projector?: boolean }) {
  const p = STYLES[projector ? "projector" : "admin"];
  return (
    <ul className={p.list}>
      {awards.map((award) => (
        <li key={award.kind} className={p.item}>
          <span className={p.title}>{AWARDS[award.kind].title}</span>
          {/* A tie of more than two would list most of the field: the count says it. */}
          <span className={p.players}>
            {award.players.length > 2
              ? `${award.players.length} players`
              : award.players.join(", ")}
          </span>
          {/* The number in the numbers' font, its unit as a label beside it. */}
          <span className={p.value}>
            {AWARDS[award.kind].format(award.value)}
            {AWARDS[award.kind].unit && (
              <span className="ml-[0.3em] font-pixel text-[0.25em] text-muted uppercase tracking-[1px]">
                {AWARDS[award.kind].unit?.(award.value)}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
