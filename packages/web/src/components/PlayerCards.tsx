import { checkoutRoute, type PlayerIndex, type Segment } from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import { Fragment } from "react";
import { dartLabel } from "../lib/darts.ts";
import { Avatar } from "./Avatar.tsx";
import { PixelIcon } from "./PixelIcon.tsx";

/** The route to finish this visit for the thrower, or null when there's none to show. */
function checkoutHint(match: MatchView): Segment[] | null {
  const { state, settings } = match;
  const thrower = state.players[state.currentPlayer];
  if (state.phase !== "throwing" || !thrower?.isIn) return null;
  const thrown = state.currentVisit?.darts.filter((d) => !d.ignored).length ?? 0;
  return checkoutRoute(thrower.remaining, 3 - thrown, settings.outRule);
}

/**
 * A card per player: avatar, name, what's left, legs and last visit; the thrower's framed.
 * With `hints`, the thrower's card shows the checkout route on wide screens.
 */
export function PlayerCards({ match, hints = false }: { match: MatchView; hints?: boolean }) {
  const { state, players, settings } = match;
  const leg = state.legs.at(-1);
  const nameOf = (player: PlayerIndex) => players[player]?.name ?? "?";
  const route = hints ? checkoutHint(match) : null;

  const lastVisitOf = (player: PlayerIndex) => {
    const last = leg?.visits.findLast((v) => v.player === player);
    if (!last) return null;
    return last.bust ? "Bust" : String(last.darts.reduce((sum, d) => sum + d.score, 0));
  };

  return (
    <div className={`scoreboard ${players.length > 2 ? "many" : ""}`}>
      {state.players.map((player, p) => {
        const active = state.currentPlayer === p;
        const last = lastVisitOf(p);
        return (
          <div key={players[p]?.id ?? p} className={`player ${active ? "active" : ""}`}>
            {active && (
              <span className="throwing">
                <PixelIcon name="caret" /> Throwing
              </span>
            )}
            {players[p] && <Avatar player={players[p]} large />}
            <div className="player-name">{nameOf(p)}</div>
            <div className="remaining">{player.remaining}</div>
            {/* On every card, so the scores stay level whoever has a route. */}
            {hints && (
              <div className="checkout wide-only">
                {(active ? (route ?? []) : []).map((segment, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a route can repeat a field (T20 T20 Bull).
                  <Fragment key={i}>
                    {i > 0 && <span className="checkout-dot">·</span>}
                    <span className={i === 0 ? "checkout-next" : undefined}>
                      {dartLabel(segment)}
                    </span>
                  </Fragment>
                ))}
              </div>
            )}
            <div className="player-meta">
              {!player.isIn ? (
                <span className="not-in">Not in</span>
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
