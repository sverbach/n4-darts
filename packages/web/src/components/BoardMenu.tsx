import { useEffect, useRef, useState } from "react";
import { request } from "../lib/api.ts";

/** "Board online", "Board stopped" (detection off), "Board offline" or "Server offline". */
export function BoardStatus(props: { online: boolean; running: boolean; connected?: boolean }) {
  const { online, running, connected = true } = props;
  const [label, tone] = !connected
    ? ["Server offline", "danger"]
    : !online
      ? ["Board offline", "danger"]
      : running
        ? ["Board online", "ok"]
        : ["Board stopped", "warn"];
  return <span className={`status ${tone}`}>{label}</span>;
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
    <div className="board-menu" ref={root}>
      {message ? (
        <span
          className={`status ${message.error ? "danger" : busy ? "accent" : "ok"}`}
          role="status"
        >
          {message.text}
        </span>
      ) : (
        <BoardStatus online={online} running={running} connected={connected ?? true} />
      )}
      <button
        type="button"
        className="board-menu-button"
        aria-label="Board menu"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <div className="board-menu-items" role="menu">
          <span className="label">Board</span>
          <button type="button" role="menuitem" onClick={() => run(running ? "stop" : "start")}>
            {running ? "Stop detection" : "Start detection"}
          </button>
          <button type="button" role="menuitem" onClick={() => run("calibrate")}>
            Calibrate
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-danger"
            onClick={() => run("reset")}
          >
            Reset board
          </button>
          {matchAction && (
            <>
              <span className="label menu-section">Match</span>
              <button
                type="button"
                role="menuitem"
                className="menu-danger"
                onClick={() => {
                  setOpen(false);
                  matchAction.run();
                }}
              >
                {matchAction.label}
              </button>
              {matchAction.note && <span className="label menu-note">{matchAction.note}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
