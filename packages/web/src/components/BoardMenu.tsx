import { useEffect, useRef, useState } from "react";
import { request } from "../lib/api.ts";
import { MENU_ITEM as ITEM, MENU, MENU_BUTTON } from "./ActionMenu.tsx";

const MENU_LABEL = "px-3 pt-2.5 pb-1.5 kiosk:px-4 kiosk:pt-3 kiosk:pb-2 kiosk:text-[12px]";

/** "Board online", "Board stopped" (detection off), "Board offline" or "Server offline". */
export function BoardStatus(props: {
  online: boolean;
  running: boolean;
  connected?: boolean;
  quiet?: boolean;
  className?: string;
}) {
  const { online, running, connected = true, quiet = false, className = "" } = props;
  const [label, tone] = !connected
    ? ["Server offline", "danger"]
    : !online
      ? ["Board offline", "danger"]
      : running
        ? ["Board online", "ok"]
        : ["Board stopped", "warn"];
  if (quiet && tone === "ok") return null;
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

const TAKEOUT_STUCK_MS = 10_000;

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
  quiet?: boolean;
  takeout?: boolean;
  matchAction?: MatchAction | undefined;
  sound?: { on: boolean; toggle(): void };
}) {
  const {
    stationId,
    online,
    running,
    connected,
    quiet,
    takeout = false,
    matchAction,
    sound,
  } = props;
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    setStuck(false);
    if (!takeout) return;
    const timer = setTimeout(() => setStuck(true), TAKEOUT_STUCK_MS);
    return () => clearTimeout(timer);
  }, [takeout]);
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
          className={`status ${message.error ? "status-danger" : busy ? "status-accent" : "status-ok"}`}
          role="status"
        >
          {message.text}
        </span>
      ) : takeout && online && (connected ?? true) ? (
        stuck ? (
          <>
            <span className="status status-warn" role="status">
              Takeout stuck
            </span>
            <button
              type="button"
              className="kiosk:min-h-9 min-h-[30px] px-3"
              onClick={() => run("reset")}
            >
              Reset board
            </button>
          </>
        ) : (
          <span className="status" role="status">
            Takeout…
          </span>
        )
      ) : (
        <BoardStatus
          online={online}
          running={running}
          connected={connected ?? true}
          quiet={quiet ?? false}
        />
      )}
      <button
        type="button"
        className={MENU_BUTTON}
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
          {sound && (
            <>
              <span className={`label ${MENU_LABEL} border-0 border-border border-t border-solid`}>
                Sound
              </span>
              <button
                type="button"
                role="menuitem"
                className={ITEM}
                onClick={() => {
                  setOpen(false);
                  sound.toggle();
                }}
              >
                {sound.on ? "Turn sound off" : "Turn sound on"}
              </button>
            </>
          )}
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
                <span className="label kiosk:px-4 px-3 kiosk:pb-3 pb-2.5 kiosk:text-[11px] text-[11px]">
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
