import type { RandomCheckoutState, Segment } from "@n4/engine";
import { Fragment } from "react";
import { dartLabel } from "../lib/darts.ts";
import type { CardsSize } from "./PlayerCards.tsx";

const STYLE = {
  station: {
    root: "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4 gap-y-2 border border-border border-solid bg-panel px-3 py-3 kiosk:gap-y-3 kiosk:px-4 kiosk:py-4",
    label: "font-pixel text-[11px] text-muted uppercase tracking-[1px] kiosk:text-[13px]",
    number: "text-[48px] leading-[0.8] kiosk:text-[64px]",
    route: "font-pixel text-[20px] tracking-[1px] kiosk:text-[24px]",
  },
  projector: {
    root: "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-x-pu-20 gap-y-pu-12 border border-border border-solid bg-panel px-pu-20 py-pu-16",
    label: "font-pixel text-muted text-pu-18 uppercase tracking-[1px]",
    number: "text-pu-72 leading-[0.8]",
    route: "font-pixel text-pu-28 tracking-[1px]",
  },
};

/** Random Checkout's number, what the thrower has left of it, and the route to finish. */
export function CheckoutPanel(props: {
  state: RandomCheckoutState;
  route: Segment[] | null;
  size?: CardsSize;
}) {
  const { state, route } = props;
  const style = STYLE[props.size ?? "station"];
  const visit = state.currentVisit;
  const left = visit?.checkout ? 0 : state.remaining;
  return (
    <section className={style.root} aria-label="Checkout">
      <span className={`${style.label} col-span-2`}>
        Check out{left !== state.target && ` · from ${state.target}`}
      </span>
      <span className={`${style.number} ${visit?.bust ? "text-danger" : "text-accent"}`}>
        {visit?.checkout ? "✓" : left}
      </span>
      <span className={`${style.route} justify-self-end`}>
        {(route ?? []).map((segment, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a route can repeat a field (T20 T20 Bull).
          <Fragment key={i}>
            {i > 0 && <span className="text-faint mx-[0.5em]">·</span>}
            <span className={i === 0 ? "text-text" : "text-muted"}>{dartLabel(segment)}</span>
          </Fragment>
        ))}
      </span>
    </section>
  );
}
