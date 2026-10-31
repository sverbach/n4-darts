import type { MatchView } from "@n4/server/api";
import { Fragment, type ReactNode } from "react";
import { Avatar } from "./Avatar.tsx";

/** "Game shot", the winner and the legs; `children` go below (the station's buttons). */
export function MatchOver({ match, children }: { match: MatchView; children?: ReactNode }) {
  const { state, players, settings } = match;
  const winner = state.winner ?? 0;
  const winnerPlayer = players[winner];
  return (
    <section className="match-over">
      <h1 className="game-shot">Game shot</h1>
      <div className="match-over-result">
        {winnerPlayer && (
          <span className="avatar-frame">
            <Avatar player={winnerPlayer} large />
          </span>
        )}
        <div className="match-over-text">
          <p className="match-over-winner">{winnerPlayer?.name ?? "?"} wins</p>
          {settings.legsToWin > 1 &&
            (players.length === 2 ? (
              <div className="legs-result">
                {state.players.map((p, i) => (
                  <Fragment key={players[i]?.id ?? i}>
                    {i > 0 && <span className="legs-dash">–</span>}
                    <div className={i === winner ? "won" : ""}>
                      <span className="legs-number">{p.legsWon}</span>
                      <span className="label">{players[i]?.name}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
            ) : (
              <p className="label">{state.players[winner]?.legsWon} legs</p>
            ))}
        </div>
      </div>
      {children}
    </section>
  );
}
