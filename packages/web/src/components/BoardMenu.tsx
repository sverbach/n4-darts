import { useEffect, useRef, useState } from "react";
import { request } from "../lib/api.ts";

/** The menu under ⋮, and its labels and items. */
const MENU =
  "absolute top-[calc(100%_+_8px)] right-0 z-10 flex w-[220px] flex-col border border-accent border-solid bg-surface kiosk:w-[280px]";
const MENU_LABEL = "px-3.5 pt-2.5 pb-1.5 kiosk:px-4 kiosk:pt-3 kiosk:pb-2 kiosk:text-[12px]";
const ITEM =
  "min-h-12 justify-start border-0 border-line-soft border-t border-solid bg-transparent px-3.5 text-left hover:bg-accent-tint focus-visible:bg-accent-tint kiosk:min-h-14 kiosk:px-4 kiosk:text-[14px]";

/** "Board online", "Board stopped" (detection off), "Board offline" or "Server offline". */
export function BoardStatus(props: {
  online: boolean;
  running: boolean;
  connected?: boolean;
  className?: string;
}) {
  const { online, running, connected = true, className = "" } = props;
  const [label, tone] = !connected
    ? ["Server offline", "danger"]
    : !online
      ? ["Board offline", "danger"]
      : running
        ? ["Board online", "ok"]
        : ["Board stopped", "warn"];
  return <span className={`status status-${tone} ${className}`}>{label}</span>;
}

/** The menu's "Match" entry on the station: end or cancel the match on it. */
export interface MatchAction {
  label: string;
  /** Below the entry, e.g. "Goes back in the queue". */
  note?: string | undefined;
  run(): void;
}

type Action = "start" | "stop" | "calibrate" | "reset";

const CONFIRM: Partial<Record<Action, string>> = {
  stop: "Stop detection? Darts won't count until it's started again.",
  calibrate: "Clear the board, then calibrate?",
};
const DONE: Record<Action, string> = {
  start: "Detection started",
  stop: "Detection stopped",
  calibrate: "Calibrated",
  reset: "Board reset",
};

/**
 * The board's status plus a menu to stop/start detection, calibrate and reset the board, and on
 * the station to end the match.
 */
export function BoardMenu(props: {
  stationId: number;
  online: boolean;
  running: boolean;
  connected?: boolean;
  matchAction?: MatchAction | undefined;
}) {
  const { stationId, online, running, connected, matchAction } = props;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A result stays a few seconds, then the status speaks for itself again.
  useEffect(() => {
    if (!message || busy) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message, busy]);

  const run = async (action: Action) => {
    setOpen(false);
    const question = CONFIRM[action];
    if (question && !confirm(question)) return;
    setBusy(true);
    setMessage(action === "calibrate" ? { text: "Calibrating…" } : null);
    const error = await request("POST", `/api/stations/${stationId}/board`, { action });
    setBusy(false);
    setMessage(error ? { text: error, error: true } : { text: DONE[action] });
  };

  return (
    <div className="relative flex items-center gap-1.5 kiosk:gap-2.5" ref={root}>
      {message ? (
        <span
          className={`status kiosk:min-h-10 ${message.error ? "status-danger" : busy ? "status-accent" : "status-ok"}`}
          role="status"
        >
          {message.text}
        </span>
      ) : (
        <BoardStatus
          online={online}
          running={running}
          connected={connected ?? true}
          className="kiosk:min-h-10"
        />
      )}
      <button
        type="button"
        className="kiosk:min-h-10 min-h-[30px] kiosk:min-w-10 min-w-[30px] bg-transparent p-0 font-text kiosk:text-[28px] text-[22px] tracking-normal aria-expanded:border-accent aria-expanded:bg-accent aria-expanded:text-accent-text"
        aria-label="Board menu"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <div className={MENU} role="menu">
          <span className={`label ${MENU_LABEL}`}>Board</span>
          <button
            type="button"
            role="menuitem"
            className={ITEM}
            onClick={() => run(running ? "stop" : "start")}
          >
            {running ? "Stop detection" : "Start detection"}
          </button>
          <button type="button" role="menuitem" className={ITEM} onClick={() => run("calibrate")}>
            Calibrate
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-danger`}
            onClick={() => run("reset")}
          >
            Reset board
          </button>
          {matchAction && (
            <>
              <span className={`label ${MENU_LABEL} border-0 border-border border-t border-solid`}>
                Match
              </span>
              <button
                type="button"
                role="menuitem"
                className={`${ITEM} text-danger`}
                onClick={() => {
                  setOpen(false);
                  matchAction.run();
                }}
              >
                {matchAction.label}
              </button>
              {matchAction.note && (
                <span className="label kiosk:px-4 px-3.5 kiosk:pb-3 pb-2.5 kiosk:text-[11px] text-[10px]">
                  {matchAction.note}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
