"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, FixtureStatus, LiveMatch } from "@/lib/types";
import { formatMatchDate } from "@/lib/helpers";

const FILTERS: { label: string; value: FixtureStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Live", value: "live" },
  { label: "Completed", value: "completed" },
];

export default function FixturesPage() {
  const { data: fixtures, loading } = useRealtimeTable<Fixture>("fixtures", {
    orderBy: "match_date",
    ascending: true,
  });
  const { data: liveMatches } = useRealtimeTable<LiveMatch>("live_matches");
  const [filter, setFilter] = useState<FixtureStatus | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return fixtures;
    return fixtures.filter((f) => f.status === filter);
  }, [fixtures, filter]);

  function liveMatchFor(fixtureId: string) {
    return liveMatches.find((m) => m.fixture_id === fixtureId);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-h1">Fixtures</div>
        <div className="page-h1-sub">All scheduled and live matches</div>
      </div>
      <div className="content" style={{ paddingTop: "14px" }}>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab ${filter === f.value ? "active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading fixtures…</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text" style={{ fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
              No fixtures found
            </div>
            <div className="empty-text">Fixtures will appear here once scheduled by the admin.</div>
          </div>
        )}

        {filtered.map((f) => {
          const live = f.status === "live" ? liveMatchFor(f.id) : null;
          const card = (
            <div className="match-card" key={f.id}>
              <div className="match-header">
                <span className={`match-badge badge-${f.status}`}>
                  {f.status === "live" ? "● Live" : f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                </span>
                <span className="match-round">{f.round || "Fixture"}</span>
              </div>
              <div className="match-body">
                <div className="match-teams">
                  <div className="match-team">
                    <div className="team-name">{f.team_a}</div>
                    {live && (
                      <>
                        <div className="team-score">
                          {live.runs}/{live.wickets}
                        </div>
                        <div className="team-overs">{live.overs.toFixed(1)} ov</div>
                      </>
                    )}
                  </div>
                  <div className="match-vs">
                    <div>VS</div>
                  </div>
                  <div className="match-team right">
                    <div className="team-name">{f.team_b}</div>
                  </div>
                </div>
                <div className="match-date">
                  📅 {formatMatchDate(f.match_date)}
                  {f.venue ? ` · ${f.venue}` : ""}
                </div>
                {live && (
                  <div className="match-result" style={{ color: "var(--green)" }}>
                    Tap to watch live scorecard →
                  </div>
                )}
              </div>
            </div>
          );

          if (live) {
            return (
              <Link href={`/live/${live.id}`} key={f.id} className="match-link">
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
