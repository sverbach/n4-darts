import { checkoutRoute, type PlayerIndex, type Segment } from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import { Fragment } from "react";
import { dartLabel } from "../lib/darts.ts";
import { Avatar } from "./Avatar.tsx";

/** The route to finish this visit for the thrower, or null when there's none to show. */
function checkoutHint(match: MatchView): Segment[] | null {
  const { state, settings } = match;
  const thrower = state.players[state.currentPlayer];
  if (state.phase !== "throwing" || !thrower?.isIn) return null;
  const thrown = state.currentVisit?.darts.filter((d) => !d.ignored).length ?? 0;
  return checkoutRoute(thrower.remaining, 3 - thrown, settings.outRule);
}

/** Where the cards are: the station (phone and kiosk), or /watch on a projector (`--px` units). */
export type CardsSize = "station" | "projector";

/** A player's card, by size, compact (three players or more) or not, and the thrower's or not. */
function cardStyle(size: CardsSize, many: boolean, active: boolean) {
  const frame = active
    ? `border-accent bg-accent-tint ${size === "projector" ? "border-pu-3" : "border-2 kiosk:border-[3px]"}`
    : "border border-border bg-panel";
  if (size === "projector") {
    return {
      board: many
        ? "grid min-h-0 flex-1 grid-cols-[repeat(auto-fit,minmax(calc(240*var(--px)),1fr))] gap-pu-16"
        : "grid min-h-0 flex-1 grid-cols-2 gap-pu-16",
      card: many
        ? `relative flex min-h-0 min-w-0 flex-col items-start justify-between gap-pu-10 border-solid p-pu-18 avatar-pu-64 ${frame}`
        : `relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto_1fr] items-center gap-x-pu-18 gap-y-pu-6 border-solid px-pu-26 py-pu-22 avatar-pu-88 [grid-template-areas:'avatar_name'_'avatar_meta'_'score_score'] [&>.avatar]:[grid-area:avatar] ${frame}`,
      name: `max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-pixel font-bold uppercase tracking-pu-3 ${many ? "text-pu-22" : "self-end text-pu-32 [grid-area:name]"}`,
      remaining: `m-0 leading-[0.8] ${many ? "self-start text-pu-90" : "self-end text-pu-200 [grid-area:score]"} ${active ? "text-accent" : ""}`,
      meta: `min-h-[1em] font-pixel text-muted uppercase tracking-[1px] ${many ? "text-pu-12" : "self-start text-pu-14 [grid-area:meta]"}`,
    };
  }
  return {
    board: many
      ? "grid grid-cols-[1fr] gap-1.5 kiosk:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] kiosk:gap-3"
      : "grid grid-cols-2 gap-2 kiosk:gap-4",
    card: many
      ? `relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-solid py-0 pr-3.5 pl-2.5 [grid-template-areas:'avatar_name_score'_'avatar_meta_score'] [&>.avatar]:[grid-area:avatar] ${active ? "min-h-[72px] [--avatar:48px]" : "min-h-16 [--avatar:40px]"} kiosk:flex kiosk:min-h-0 kiosk:flex-col kiosk:items-start kiosk:justify-between kiosk:gap-3.5 kiosk:p-5 kiosk:[--avatar:72px] ${frame}`
      : `relative flex min-w-0 flex-col items-start gap-2 border-solid px-3 pt-3.5 pb-3 [--avatar:64px] kiosk:grid kiosk:grid-cols-[auto_minmax(0,1fr)] kiosk:grid-rows-[auto_auto_1fr_auto] kiosk:items-center kiosk:gap-x-5 kiosk:gap-y-2 kiosk:px-7 kiosk:py-6 kiosk:[--avatar:112px] kiosk:[grid-template-areas:'avatar_name'_'avatar_meta'_'score_score'_'checkout_checkout'] kiosk:[&>.avatar]:[grid-area:avatar] ${frame}`,
    name: many
      ? "max-w-full self-end overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[14px] uppercase tracking-[1px] [grid-area:name] kiosk:self-auto kiosk:font-bold kiosk:text-[26px] kiosk:tracking-[2px]"
      : "max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[16px] uppercase tracking-[1px] kiosk:self-end kiosk:font-bold kiosk:text-[36px] kiosk:tracking-[3px] kiosk:[grid-area:name]",
    remaining: many
      ? `leading-[0.8] [grid-area:score] ${active ? "text-[60px] text-accent" : "text-[48px]"} kiosk:m-0 kiosk:self-start kiosk:text-[length:clamp(64px,min(7vw,15vh),120px)]`
      : `text-[length:clamp(44px,17vw,72px)] leading-[0.8] ${active ? "text-accent" : ""} kiosk:mt-3 kiosk:self-end kiosk:text-[length:clamp(96px,min(13vw,24vh),220px)] kiosk:[grid-area:score]`,
    meta: many
      ? "min-h-[1em] self-start font-pixel text-[11px] text-muted uppercase tracking-[1px] [grid-area:meta] kiosk:self-auto kiosk:text-[13px]"
      : "min-h-[1em] font-pixel text-[11px] text-muted uppercase tracking-[1px] kiosk:self-start kiosk:text-[14px] kiosk:[grid-area:meta]",
  };
}

/**
 * A card per player: avatar, name, what's left, legs and last visit. The thrower's card is framed
 * and their score violet: the one sign of whose turn it is (DESIGN.md).
 * With `hints`, the thrower's card shows the checkout route on wide screens.
 */
export function PlayerCards({
  match,
  hints = false,
  size = "station",
}: {
  match: MatchView;
  hints?: boolean;
  size?: CardsSize;
}) {
  const { state, players, settings } = match;
  const leg = state.legs.at(-1);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";
  const route = hints ? checkoutHint(match) : null;
  const many = players.length > 2;

  const lastVisitOf = (player: PlayerIndex) => {
    const last = leg?.visits.findLast((v) => v.player === player);
    if (!last) return null;
    return last.bust ? "Bust" : String(last.darts.reduce((sum, d) => sum + d.score, 0));
  };

  return (
    // `scoreboard`: the station's match layout places it.
    <div className={`scoreboard ${cardStyle(size, many, false).board}`}>
      {state.players.map((player, p) => {
        const active = state.currentPlayer === p;
        const last = lastVisitOf(p);
        const style = cardStyle(size, many, active);
        return (
          <div key={players[p]?.id ?? p} className={style.card}>
            {players[p] && <Avatar player={players[p]} large />}
            <div className={style.name}>{nameOf(p)}</div>
            <div className={style.remaining}>{player.remaining}</div>
            {/* On every card, so the scores stay level whoever has a route. */}
            {hints && (
              <div className="kiosk:min-h-[1.2em] font-pixel kiosk:text-[24px] text-[20px] text-muted tracking-[1px] kiosk:[grid-area:checkout] max-kiosk:hidden">
                {(active ? (route ?? []) : []).map((segment, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a route can repeat a field (T20 T20 Bull).
                  <Fragment key={i}>
                    {i > 0 && <span className="mx-[0.5em] text-faint">·</span>}
                    <span className={i === 0 ? "text-text" : undefined}>{dartLabel(segment)}</span>
                  </Fragment>
                ))}
              </div>
            )}
            <div className={style.meta}>
              {!player.isIn ? (
                <span className="text-warn">Not in</span>
              ) : (
                [settings.legsToWin > 1 && `Legs ${player.legsWon}`, last && `Last ${last}`]
                  .filter(Boolean)
                  .join(" · ")
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
