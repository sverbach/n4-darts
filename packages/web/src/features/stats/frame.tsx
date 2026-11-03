import type { ReactNode } from "react";
import { Link } from "wouter";
import { Logo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const pad2 = (n: number) => String(n).padStart(2, "0");
/** "21 Oct 2026" */
export const date = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** A day key (YYYY-MM-DD) as a short date. */
export const shortDay = (day: string) => date(`${day}T12:00:00`).slice(0, 6);
/** A day key as "Jul 2026". */
export const monthOf = (day: string) => date(`${day}T12:00:00`).slice(3).replace(" ", "\u00a0");

/** A section of a stats page: a heading and its chart or list. */
export const SECTION = "flex flex-col gap-2.5";
/** The stats pages' lists: tournaments and matches. */
export const ROW =
  "flex min-h-16 items-center gap-3 border-0 border-line-soft border-b border-solid [&_.pixel-icon]:h-[22px] [&_.pixel-icon]:text-text";
export const ROW_MAIN =
  "flex min-w-0 flex-1 flex-col gap-1.5 font-pixel text-[13px] uppercase tracking-[1px] kiosk:text-[16px]";
export const ROW_DATE = "text-[11px] text-muted tracking-normal kiosk:text-[12px]";
export const ROW_VALUE = "min-w-12 text-right text-[28px] kiosk:w-[60px] kiosk:text-[32px]";

/** The stats pages' frame: a back link and the logo, then the page. */
export function StatsFrame(props: { back: [string, string] | null; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh]">
      <header className="border-0 border-border border-b border-solid">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between kiosk:px-6 px-4 kiosk:py-3 py-2">
          {props.back ? (
            <Link className="back" href={props.back[0]}>
              <PixelIcon name="back" height="0.7em" /> {props.back[1]}
            </Link>
          ) : (
            <span className="min-h-11" />
          )}
          <Logo width="72px" />
        </div>
      </header>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 kiosk:gap-6 kiosk:px-6 px-4 kiosk:pt-6 pt-6 kiosk:pb-6 pb-6">
        {props.children}
      </main>
    </div>
  );
}
