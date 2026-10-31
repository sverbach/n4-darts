import type { MatchView } from "@n4/server/api";
import { Fragment, type ReactNode } from "react";
import { Avatar } from "./Avatar.tsx";

/** The game shot's styles on the station (phone and kiosk) and on /watch (`--px` units). */
const STYLES = {
  station: {
    root: "flex flex-1 flex-col items-center gap-6 text-center kiosk:gap-7",
    title: "mt-auto text-[40px] text-accent tracking-[4px] kiosk:text-[72px] kiosk:tracking-[8px]",
    frame: "avatar-frame text-[10px] [--avatar:120px] kiosk:text-[20px] kiosk:[--avatar:172px]",
    winner:
      "m-0 font-bold font-pixel text-[28px] uppercase tracking-[3px] kiosk:text-[44px] kiosk:tracking-[4px]",
    legs: "text-[96px] leading-[0.78] kiosk:text-[160px]",
    dash: "text-[60px] text-faint leading-[0.9] kiosk:text-[96px]",
    name: "label",
  },
  projector: {
    root: "flex flex-1 flex-col items-center justify-center gap-pu-28 p-pu-32 text-center",
    title: "mt-0 text-accent text-pu-72 tracking-pu-8",
    frame: "avatar-frame text-pu-20 avatar-pu-172",
    winner: "m-0 font-bold font-pixel text-pu-44 uppercase tracking-pu-4",
    legs: "text-pu-160 leading-[0.78]",
    dash: "text-faint text-pu-96 leading-[0.9]",
    name: "font-pixel text-muted text-pu-13 uppercase tracking-[1px]",
  },
};

/** "Game shot", the winner and the legs; `children` go below (the station's buttons). */
export function MatchOver({
  match,
  children,
  size = "station",
}: {
  match: MatchView;
  children?: ReactNode;
  size?: keyof typeof STYLES;
}) {
  const { state, players, settings } = match;
  const winner = state.winner ?? 0;
  const winnerPlayer = players[winner];
  const style = STYLES[size];
  return (
    <section className={style.root}>
      <h1 className={style.title}>Game shot</h1>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {winnerPlayer && (
          <span className={style.frame}>
            <Avatar player={winnerPlayer} large />
          </span>
        )}
        <div className="flex flex-col items-center gap-[18px]">
          <p className={style.winner}>{winnerPlayer?.name ?? "?"} wins</p>
          {settings.legsToWin > 1 &&
            (players.length === 2 ? (
              <div className="flex items-start gap-5 kiosk:gap-7">
                {state.players.map((p, i) => (
                  <Fragment key={players[i]?.id ?? i}>
                    {i > 0 && <span className={style.dash}>–</span>}
                    <div className="flex flex-col items-center">
                      <span className={`${style.legs} ${i === winner ? "text-accent" : ""}`}>
                        {p.legsWon}
                      </span>
                      <span className={style.name}>{players[i]?.name}</span>
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
