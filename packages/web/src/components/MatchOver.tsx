import { isX01Match, stateDartStats, threeDartAverage, winningCheckout } from "@n4/engine";
import type { MatchView, X01MatchView } from "@n4/server/api";
import type { ReactNode } from "react";
import { dartLabel } from "../lib/darts.ts";
import { Avatar } from "./Avatar.tsx";
import { Confetti } from "./Confetti.tsx";

/** The game shot's styles on the station (phone and kiosk) and on /watch (`--px` units). */
const STYLES = {
  station: {
    versus: "",
    versusLegs: "",
    root: "flex flex-1 flex-col items-center gap-6 text-center kiosk:gap-6",
    title: "mt-auto text-[40px] text-accent tracking-[4px] kiosk:text-[72px] kiosk:tracking-[8px]",
    frame: "avatar-frame text-[11px] [--avatar:120px] kiosk:text-[20px] kiosk:[--avatar:172px]",
    side: "flex flex-col items-center gap-4 kiosk:items-start kiosk:gap-6",
    winner:
      "m-0 font-bold font-pixel text-[28px] uppercase tracking-[3px] kiosk:text-[48px] kiosk:tracking-[4px]",
    legs: "flex items-baseline gap-4 text-[96px] leading-[0.78] kiosk:gap-6 kiosk:text-[160px]",
    dash: "text-[56px] text-faint kiosk:text-[96px]",
    stats: "flex gap-6 kiosk:gap-6",
    value: "text-[40px] leading-[0.85] kiosk:text-[48px]",
    label: "label",
  },
  projector: {
    root: "flex flex-1 flex-col items-center justify-center gap-pu-28 p-pu-32 text-center",
    title: "mt-0 text-accent text-pu-96 tracking-pu-8",
    frame: "avatar-frame text-pu-28 avatar-pu-240",
    side: "flex flex-col items-start gap-pu-28",
    winner: "m-0 font-bold font-pixel text-pu-56 uppercase tracking-pu-4",
    legs: "flex items-baseline gap-pu-24 text-pu-160 leading-[0.78]",
    dash: "text-faint text-pu-96",
    stats: "flex gap-pu-48",
    value: "text-pu-72 leading-[0.85]",
    label: "font-pixel text-muted text-pu-20 uppercase tracking-[1px]",
    versus: "m-0 flex items-baseline gap-pu-16 font-pixel text-pu-28 uppercase tracking-pu-3",
    versusLegs: "font-text text-pu-56 normal-case tracking-normal",
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
  const { players } = match;
  const winner = match.state.winner ?? 0;
  const winnerPlayer = players[winner];
  const style = STYLES[size];

  return (
    <section className={style.root}>
      <Confetti />
      <h1 className={style.title}>Game shot</h1>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-6">
        {winnerPlayer && (
          <span className={style.frame}>
            <Avatar player={winnerPlayer} large />
          </span>
        )}
        <div className={style.side}>
          <p className={style.winner}>{winnerPlayer?.name ?? "?"} wins</p>
          {isX01Match(match) && <X01Result match={match} size={size} />}
        </div>
      </div>
      {children}
    </section>
  );
}

function X01Result({ match, size }: { match: X01MatchView; size: keyof typeof STYLES }) {
  const { state, players, settings } = match;
  const winner = state.winner ?? 0;
  const winnerPlayer = players[winner];
  const style = STYLES[size];
  const checkout = winningCheckout(state);
  const own = stateDartStats(state)[winner];
  const average = own ? threeDartAverage([own]) : null;
  const others = state.players.filter((_, i) => i !== winner).map((p) => p.legsWon);
  return (
    <>
      {size === "projector" && others.length === 1 && (
        <p className={style.versus}>
          <span>{winnerPlayer?.name}</span>
          <span className={style.versusLegs}>
            {state.players[winner]?.legsWon} – {others[0]}
          </span>
          <span className="text-muted">{players.find((_, i) => i !== winner)?.name}</span>
        </p>
      )}
      {settings.legsToWin > 1 && others.length > 1 && (
        <p className={`m-0 ${style.label}`}>{state.players[winner]?.legsWon} legs</p>
      )}
      {size === "station" && settings.legsToWin > 1 && others.length === 1 && (
        <div
          className={style.legs}
          role="img"
          aria-label={`Legs ${state.players[winner]?.legsWon} to ${others[0]}`}
        >
          <span>{state.players[winner]?.legsWon}</span>
          {others.map((legs, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: the losers' legs, in throwing order.
            <span key={i} className="contents">
              <span className={style.dash}>–</span>
              <span>{legs}</span>
            </span>
          ))}
        </div>
      )}
      <dl className={`m-0 ${style.stats}`}>
        {checkout && (
          <div className="flex flex-col-reverse items-start gap-2">
            <dt className={style.label}>Checkout · {dartLabel(checkout.segment)}</dt>
            <dd className={`m-0 ${style.value}`}>{checkout.points}</dd>
          </div>
        )}
        {average !== null && (
          <div className="flex flex-col-reverse items-start gap-2">
            <dt className={style.label}>3-dart avg</dt>
            <dd className={`m-0 ${style.value}`}>{average.toFixed(1)}</dd>
          </div>
        )}
      </dl>
    </>
  );
}
