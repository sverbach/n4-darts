import { BERMUDA_ROUNDS, type BermudaState, bermudaTarget } from "@n4/engine";
import { bermudaTargetLabel, bermudaTargetShort } from "../lib/labels.ts";
import type { CardsSize } from "./PlayerCards.tsx";

const STYLE = {
  station: {
    root: "grid min-w-0 gap-2 border border-border border-solid bg-panel px-3 py-3 kiosk:gap-3 kiosk:px-4 kiosk:py-4",
    label: "font-pixel text-[11px] text-muted uppercase tracking-[1px] kiosk:text-[13px]",
    target: "text-[40px] text-accent leading-[0.8] kiosk:text-[52px]",
    track: "m-0 flex list-none flex-wrap gap-1 p-0",
    step: "min-w-[2.2em] border border-solid px-1 py-0.5 text-center font-pixel text-[12px] kiosk:text-[14px]",
  },
  projector: {
    root: "grid min-w-0 gap-pu-12 border border-border border-solid bg-panel px-pu-20 py-pu-16",
    label: "font-pixel text-muted text-pu-18 uppercase tracking-[1px]",
    target: "text-accent text-pu-64 leading-[0.8]",
    track: "m-0 flex list-none flex-wrap gap-pu-6 p-0",
    step: "min-w-[2.2em] border border-solid px-pu-6 py-pu-4 text-center font-pixel text-pu-20",
  },
};

/** Bermuda's round: its target big, and the 13 targets in order (done, current, to come). */
export function BermudaPanel(props: { state: BermudaState; size?: CardsSize }) {
  const { state } = props;
  const style = STYLE[props.size ?? "station"];
  const target = bermudaTarget(state.round, state.targets);
  return (
    <section className={style.root} aria-label="Bermuda targets">
      <span className={style.label}>
        {state.suddenDeath ? "Sudden death" : `Round ${state.round} of ${BERMUDA_ROUNDS}`}
      </span>
      <span className={style.target}>{bermudaTargetLabel(target)}</span>
      <ol className={style.track}>
        {state.targets.map((t, i) => {
          const round = i + 1;
          const tone =
            round === state.round
              ? "border-accent bg-accent-tint text-accent"
              : round < state.round
                ? "border-border text-faint"
                : "border-border text-muted";
          return (
            <li key={String(t)} className={`${style.step} ${tone}`}>
              {bermudaTargetShort(t)}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
