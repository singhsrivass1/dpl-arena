"use client";

import Link from "next/link";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, LiveMatch } from "@/lib/types";

export default function LiveListPage() {
  const { data: liveMatches, loading } = useRealtimeTable<LiveMatch>("live_matches", {
    orderBy: "updated_at",
    ascending: false,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures");

  const active = liveMatches.filter((m) => m.status === "live" || m.status === "innings_break");
  const archived = liveMatches.filter((m) => m.status === "completed");

  function fixtureFor(m: LiveMatch) {
    return fixtures.find((f) => f.id === m.fixture_id);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-h1">Live Center</div>
        <div className="page-h1-sub">Ball-by-ball updates, in real time</div>
      </div>
      <div className="content" style={{ paddingTop: "14px" }}>
        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading…</div>
          </div>
        )}

        {!loading && active.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <div className="empty-text" style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
              No live matches right now
            </div>
            <div className="empty-text">
              Check the{" "}
              <Link href="/fixtures" className="section-link">
                fixtures
              </Link>{" "}
              page for upcoming games.
            </div>
          </div>
        )}

        {active.map((m) => {
          const f = fixtureFor(m);
          return (
            <Link href={`/live/${m.id}`} key={m.id} className="match-link">
              <div className="match-card">
                <div className="match-header">
                  <span className="match-badge badge-live">
                    {m.status === "live" ? "● Live" : "Innings Break"}
                  </span>
                  <span className="match-round">{f?.round || "Live Match"}</span>
                </div>
                <div className="match-body">
                  <div className="match-teams">
                    <div className="match-team">
                      <div className="team-name">{m.batting_team}</div>
                      <div className="team-score">
                        {m.runs}/{m.wickets}
                      </div>
                      <div className="team-overs">{m.overs.toFixed(1)} overs</div>
                    </div>
                    <div className="match-vs">
                      <div>VS</div>
                    </div>
                    <div className="match-team right">
                      <div className="team-name">{m.bowling_team}</div>
                      <div className="team-overs">bowling</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {archived.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div className="section-header">
              <div className="section-title">📁 Recently Archived</div>
            </div>
            {archived.slice(0, 5).map((m) => {
              const f = fixtureFor(m);
              return (
                <Link href={`/live/${m.id}`} key={m.id} className="match-link">
                  <div className="match-card">
                    <div className="match-header">
                      <span className="match-badge badge-completed">Completed</span>
                      <span className="match-round">{f?.round || "Match"}</span>
                    </div>
                    <div className="match-body">
                      <div className="match-teams">
                        <div className="match-team">
                          <div className="team-name">{f?.team_a || m.batting_team}</div>
                        </div>
                        <div className="match-vs">
                          <div>VS</div>
                        </div>
                        <div className="match-team right">
                          <div className="team-name">{f?.team_b || m.bowling_team}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
