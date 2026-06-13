"use client";

import Link from "next/link";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, LiveMatch, Result } from "@/lib/types";
import { formatMatchDate } from "@/lib/helpers";

export default function ResultsPage() {
  const { data: results, loading } = useRealtimeTable<Result>("results", {
    orderBy: "created_at",
    ascending: false,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures");
  const { data: liveMatches } = useRealtimeTable<LiveMatch>("live_matches");

  return (
    <>
      <div className="page-header">
        <div className="page-h1">Results</div>
        <div className="page-h1-sub">Completed matches</div>
      </div>
      <div className="content" style={{ paddingTop: "14px" }}>
        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading results…</div>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <div className="empty-text" style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
              No results yet
            </div>
            <div className="empty-text">Match results will appear here once games are completed.</div>
          </div>
        )}

        {results.map((r) => {
          const fixture = fixtures.find((f) => f.id === r.fixture_id);
          const archived = liveMatches.find((m) => m.fixture_id === r.fixture_id);
          const teamA = fixture?.team_a || "Team A";
          const teamB = fixture?.team_b || "Team B";

          const card = (
            <div className="match-card" key={r.id}>
              <div className="match-header">
                <span className="match-badge badge-completed">Completed</span>
                <span className="match-round">{fixture?.round || "Match"}</span>
              </div>
              <div className="match-body">
                <div className="match-teams">
                  <div className="match-team">
                    <div className="team-name">{teamA}</div>
                    {r.score_a && <div className="team-score">{r.score_a}</div>}
                  </div>
                  <div className="match-vs">
                    <div>VS</div>
                  </div>
                  <div className="match-team right">
                    <div className="team-name">{teamB}</div>
                    {r.score_b && <div className="team-score">{r.score_b}</div>}
                  </div>
                </div>
                {r.summary && <div className="match-result">🏆 {r.summary}</div>}
                <div className="match-date">
                  📅 {fixture ? formatMatchDate(fixture.match_date) : formatMatchDate(r.created_at)}
                  {fixture?.venue ? ` · ${fixture.venue}` : ""}
                </div>
                {archived && (
                  <div style={{ marginTop: "10px", color: "var(--green)", fontSize: "13px", fontWeight: 600 }}>
                    View full scorecard →
                  </div>
                )}
              </div>
            </div>
          );

          if (archived) {
            return (
              <Link href={`/live/${archived.id}`} key={r.id} className="match-link">
                {card}
              </Link>
            );
          }
          return card;
        })}
      </div>
    </>
  );
}
