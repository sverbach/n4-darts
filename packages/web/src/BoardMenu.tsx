import { useEffect, useRef, useState } from "react";
import { request } from "./adminApi.ts";

/** "Board online", "Board stopped" (detection off) or "Board offline". */
export function BoardStatus(props: { online: boolean; running: boolean; connected?: boolean }) {
  const { online, running, connected = true } = props;
  const label = !connected
    ? "Server offline"
    : !online
      ? "Board offline"
      : running
        ? "Board online"
        : "Board stopped";
  return (
    <span className={`status ${connected && online && running ? "ok" : "warn"}`}>{label}</span>
  );
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

/** The board's status plus a menu to stop/start detection, calibrate and reset the board. */
export function BoardMenu(props: {
  stationId: number;
  online: boolean;
  running: boolean;
  connected?: boolean;
}) {
  const { stationId, online, running, connected } = props;
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
        <span className={`board-message ${message.error ? "warn" : ""}`} role="status">
          {message.text}
        </span>
      ) : (
        <BoardStatus online={online} running={running} connected={connected ?? true} />
      )}
      <button
        type="button"
        className="ghost board-menu-button"
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
          <button type="button" role="menuitem" onClick={() => run(running ? "stop" : "start")}>
            {running ? "Stop detection" : "Start detection"}
          </button>
          <button type="button" role="menuitem" onClick={() => run("calibrate")}>
            Calibrate
          </button>
          <button type="button" role="menuitem" onClick={() => run("reset")}>
            Reset board
          </button>
        </div>
      )}
    </div>
  );
}
