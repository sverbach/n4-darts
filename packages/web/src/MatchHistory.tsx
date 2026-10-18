import type { DartView } from "@n4/engine";
import type { MatchDetail, MatchSummary } from "@n4/server/api";
import { useCallback, useEffect, useState } from "react";
import { dartLabel } from "./darts.ts";
import { legsLabel } from "./MatchSetup.tsx";
import { SegmentPicker } from "./SegmentPicker.tsx";

/** How often an open match's detail refreshes while it's being played. */
const REFRESH_MS = 3000;

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

function result(match: MatchSummary) {
  if (match.abandoned) return "Abandoned";
  const winner = match.players.find((p) => p.id === match.winner);
  if (!winner) return match.closedAt ? "No winner (corrected)" : "In progress";
  const legs = match.settings.legsToWin > 1 ? ` ${match.legsWon.join("–")}` : "";
  return `${winner.name} won${legs}`;
}

export function MatchHistory({ onOpen }: { onOpen(id: string): void }) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/matches").catch(() => null);
      if (res?.ok) setMatches(await res.json());
    })();
  }, []);

  if (!matches) return <p className="hint">Loading…</p>;
  if (matches.length === 0) return <p className="hint">No finished matches yet.</p>;
  return (
    <ul className="history-list">
      {matches.map((m) => (
        <li key={m.id}>
          <button type="button" onClick={() => onOpen(m.id)}>
            <span className="history-players">{m.players.map((p) => p.name).join(" vs ")}</span>
            <span className="history-result">{result(m)}</span>
            <span className="history-when">{when(m.closedAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MatchDetailView({ id, onBack }: { id: string; onBack(): void }) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<DartView | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/matches/${id}`).catch(() => null);
    if (!res?.ok) return setError("Couldn't load the match");
    setMatch(await res.json());
  }, [id]);

  const open = match !== null && match.closedAt === null;
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [open, load]);

  const correct = async (dartId: string, segment: DartView["segment"]) => {
    const res = await fetch(`/api/admin/matches/${id}/corrections`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dartId, segment }),
    }).catch(() => null);
    if (!res?.ok) return setError("Correction failed");
    setError(null);
    setMatch(await res.json());
  };

  const name = (i: number) => match?.players[i]?.name ?? "?";

  return (
    <div className="match-detail">
      <button type="button" className="ghost back" onClick={onBack}>
        ← Matches
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!match ? (
        <p className="hint">Loading…</p>
      ) : (
        <>
          <h2>{match.players.map((p) => p.name).join(" vs ")}</h2>
          <p className="hint">
            {match.settings.startScore},{" "}
            {legsLabel(match.settings.legsToWin, match.players.length).toLowerCase()}
            {match.station !== null && ` · station ${match.station}`} · {result(match)}
            {match.closedAt && ` · ${when(match.closedAt)}`}
          </p>
          <p className="hint">Tap a dart to correct it.</p>
          {match.state.legs.map((leg, legIndex) => (
            // Only the last leg can be without darts, so the first dart identifies a leg.
            <section key={leg.visits[0]?.darts[0]?.dartId ?? "current-leg"} className="leg">
              <h3>
                Leg {legIndex + 1} · {name(leg.starter)} starts
                {leg.winner !== null && ` · ${name(leg.winner)} won`}
              </h3>
              <ol className="visit-list">
                {[
                  ...leg.visits,
                  ...(legIndex === match.state.legs.length - 1 && match.state.currentVisit
                    ? [match.state.currentVisit]
                    : []),
                ].map((visit, visitIndex) => (
                  <li
                    key={visit.darts[0]?.dartId ?? `visit-${visitIndex}`}
                    className={visit.bust ? "bust" : ""}
                  >
                    <span className="visit-player">{name(visit.player)}</span>
                    <span className="visit-darts">
                      {visit.darts.map((dart) => {
                        const original = match.originals[dart.dartId];
                        return (
                          <button
                            type="button"
                            key={dart.dartId}
                            className={dart.ignored ? "ignored" : ""}
                            onClick={() => setCorrecting(dart)}
                            aria-label={`Correct ${dartLabel(dart.segment)}`}
                          >
                            {original && <s>{dartLabel(original)}</s>} {dartLabel(dart.segment)}
                          </button>
                        );
                      })}
                    </span>
                    <span className="visit-score">
                      {visit.bust ? "Bust" : visit.darts.reduce((sum, d) => sum + d.score, 0)}
                      {visit.checkout && " ✓"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </>
      )}
      {correcting && (
        <SegmentPicker
          title={`Correct ${dartLabel(correcting.segment)}`}
          onCancel={() => setCorrecting(null)}
          onPick={(segment) => {
            setCorrecting(null);
            void correct(correcting.dartId, segment);
          }}
        />
      )}
    </div>
  );
}
