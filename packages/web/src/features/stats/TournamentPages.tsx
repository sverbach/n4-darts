import type { PastTournament, PastTournamentSummary } from "@n4/server/api";
import { Link } from "wouter";
import { Avatar } from "../../components/Avatar.tsx";
import { Awards } from "../../components/Awards.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { BracketRows, GroupTables, Placings } from "../../components/TournamentResults.tsx";
import { useFetch } from "../../lib/useFetch.ts";
import { date, ROW, ROW_DATE, ROW_MAIN, StatsFrame } from "./frame.tsx";

const SECTION = "flex min-w-0 flex-col gap-3";
const H2 = "label font-normal";

/** /tournaments: every finished tournament, newest first. */
export function TournamentsPage() {
  const { data: list, error } = useFetch<PastTournamentSummary[]>("/api/tournaments");
  return (
    <StatsFrame back={["/players", "Players"]}>
      <h1 className="kiosk:text-[40px]">Tournaments</h1>
      {error ? (
        <p className="error" role="alert">
          Couldn't load the tournaments: {error}
        </p>
      ) : !list ? (
        <p className="hint">Loading…</p>
      ) : list.length === 0 ? (
        <p className="hint">No finished tournaments yet.</p>
      ) : (
        <ul className="m-0 list-none border-0 border-border border-t border-solid p-0">
          {list.map((t) => (
            <li key={t.id}>
              <Link href={`/tournaments/${t.id}`} className={`${ROW} no-underline [--avatar:36px]`}>
                <div className={ROW_MAIN}>
                  <span>{t.name}</span>
                  <span className={ROW_DATE}>{date(t.date)}</span>
                </div>
                {t.champion ? (
                  <span className="flex min-w-0 items-center gap-2.5 font-pixel kiosk:text-[16px] text-[13px] uppercase tracking-[1px]">
                    <PixelIcon name="trophy" label="Champion" />
                    <Avatar player={t.champion} />
                    <span className="max-w-[40vw] overflow-hidden text-ellipsis whitespace-nowrap">
                      {t.champion.name}
                    </span>
                  </span>
                ) : (
                  <span className={ROW_DATE}>Ended early</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StatsFrame>
  );
}

/** /tournaments/:id: how a finished tournament ended, then its knockout and groups. */
export function TournamentPage({ id }: { id: string }) {
  const {
    data: tournament,
    error,
    status,
  } = useFetch<PastTournament>(`/api/tournaments/${encodeURIComponent(id)}`);
  return (
    <StatsFrame back={["/tournaments", "Tournaments"]}>
      {error ? (
        <p className="error" role="alert">
          {status === 404 ? "No such tournament" : `Couldn't load the tournament: ${error}`}
        </p>
      ) : !tournament ? (
        <p className="hint">Loading…</p>
      ) : (
        <Tournament tournament={tournament} />
      )}
    </StatsFrame>
  );
}

function Tournament({ tournament: t }: { tournament: PastTournament }) {
  const awards = t.awards ?? [];
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="wrap-anywhere kiosk:text-[40px]">{t.name}</h1>
        <span className="label">
          {date(t.date)}
          {t.endedEarly && " · Ended early"}
        </span>
      </div>
      {(t.placings || awards.length > 0) && (
        <div className="flex flex-wrap items-start gap-6 [&>*]:flex-[1_1_460px]">
          {t.placings && (
            <section className={SECTION}>
              <h2 className={H2}>Final placings</h2>
              <Placings placings={t.placings} />
            </section>
          )}
          {awards.length > 0 && (
            <section className={SECTION}>
              <h2 className={H2}>Awards</h2>
              <Awards awards={awards} />
            </section>
          )}
        </div>
      )}
      {t.bracket.length > 0 && (
        <section className={SECTION}>
          <h2 className={H2}>Knockout</h2>
          <BracketRows bracket={t.bracket} linkMatches />
        </section>
      )}
      {t.groups.length > 0 && (
        <section className={SECTION}>
          <h2 className={H2}>Groups</h2>
          <GroupTables groups={t.groups} linkMatches />
        </section>
      )}
    </>
  );
}
