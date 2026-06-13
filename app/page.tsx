"use client";

import Link from "next/link";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Announcement, Fixture, LiveMatch, Player, Result } from "@/lib/types";
import { formatMatchDate, timeAgo } from "@/lib/helpers";

export default function HomePage() {
  const { data: players, connected } = useRealtimeTable<Player>("players");
  const { data: announcements } = useRealtimeTable<Announcement>("announcements", {
    orderBy: "created_at",
    ascending: false,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures", {
    orderBy: "match_date",
    ascending: true,
  });
  const { data: liveMatches } = useRealtimeTable<LiveMatch>("live_matches");
  const { data: results } = useRealtimeTable<Result>("results", {
    orderBy: "created_at",
    ascending: false,
  });

  const dobaCount = players.filter((p) => p.category === "DOBA").length;
  const nonDobaCount = players.filter((p) => p.category === "Non-DOBA").length;
  const teamCount = new Set(
    players.map((p) => p.team).filter((t) => t && t !== "Unassigned")
  ).size;

  const pinned =
    announcements.find((a) => a.pinned) || announcements[0] || null;

  const liveNow = liveMatches.find((m) => m.status === "live" || m.status === "innings_break");
  const upcoming = fixtures
    .filter((f) => f.status === "upcoming")
    .sort((a, b) => (a.match_date || "").localeCompare(b.match_date || ""))[0];
  const latestResult = results[0];
  const latestResultFixture = latestResult
    ? fixtures.find((f) => f.id === latestResult.fixture_id)
    : null;

  return (
    <div className="content">
      <div className="hero">
        <div className="hero-tag">🏆 Live Tournament Hub</div>
        <div className="hero-title">DPL</div>
        <div className="hero-sub">DOBA Premier League · BIT Mesra</div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">{players.length}</div>
            <div className="hero-stat-label">Registered Players</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{teamCount}</div>
            <div className="hero-stat-label">Teams</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{dobaCount}</div>
            <div className="hero-stat-label">DOBA Players</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">{nonDobaCount}</div>
            <div className="hero-stat-label">Non-DOBA Players</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
        <span className={`conn-dot ${connected ? "online" : "offline"}`} />
        {connected ? "Live — updates in real time" : "Connecting..."}
      </div>

      <div className="section-header" style={{ marginBottom: "8px" }}>
        <div className="section-title">📢 Latest Announcement</div>
      </div>
      {pinned ? (
        <div className="announcement">
          <div className="announce-title">
            <span className="announce-dot" />
            {pinned.title}
          </div>
          <div className="announce-text">{pinned.content}</div>
          <div className="announce-time">{timeAgo(pinned.created_at)} · by Admin</div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No announcements yet.</div>
        </div>
      )}

      {liveNow && (
        <div style={{ marginTop: "20px" }}>
          <div className="section-header">
            <div className="section-title">📡 Live Now</div>
            <Link href={`/live/${liveNow.id}`} className="section-link">
              Watch →
            </Link>
          </div>
          <Link href={`/live/${liveNow.id}`} className="match-link">
            <div className="match-card">
              <div className="match-header">
                <span className="match-badge badge-live">● Live</span>
                <span className="match-round">{liveNow.batting_team} batting</span>
              </div>
              <div className="match-body">
                <div className="match-teams">
                  <div className="match-team">
                    <div className="team-name">{liveNow.batting_team}</div>
                    <div className="team-score">
                      {liveNow.runs}/{liveNow.wickets}
                    </div>
                    <div className="team-overs">{liveNow.overs.toFixed(1)} overs</div>
                  </div>
                  <div className="match-vs">
                    <div>VS</div>
                  </div>
                  <div className="match-team right">
                    <div className="team-name">{liveNow.bowling_team}</div>
                    <div className="team-overs">bowling</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {!liveNow && upcoming && (
        <div style={{ marginTop: "20px" }}>
          <div className="section-header">
            <div className="section-title">🏏 Upcoming Match</div>
            <Link href="/fixtures" className="section-link">
              All fixtures →
            </Link>
          </div>
          <div className="match-card">
            <div className="match-header">
              <span className="match-badge badge-upcoming">Upcoming</span>
              <span className="match-round">{upcoming.round || "Fixture"}</span>
            </div>
            <div className="match-body">
              <div className="match-teams">
                <div className="match-team">
                  <div className="team-name">{upcoming.team_a}</div>
                </div>
                <div className="match-vs">
                  <div>VS</div>
                </div>
                <div className="match-team right">
                  <div className="team-name">{upcoming.team_b}</div>
                </div>
              </div>
              <div className="match-date">
                📅 {formatMatchDate(upcoming.match_date)}
                {upcoming.venue ? ` · ${upcoming.venue}` : ""}
              </div>
            </div>
          </div>
        </div>
      )}

      {!liveNow && !upcoming && latestResult && latestResultFixture && (
        <div style={{ marginTop: "20px" }}>
          <div className="section-header">
            <div className="section-title">🏏 Latest Result</div>
            <Link href="/results" className="section-link">
              All results →
            </Link>
          </div>
          <div className="match-card">
            <div className="match-header">
              <span className="match-badge badge-completed">Completed</span>
              <span className="match-round">{latestResultFixture.round || "Match"}</span>
            </div>
            <div className="match-body">
              <div className="match-teams">
                <div className="match-team">
                  <div className="team-name">{latestResultFixture.team_a}</div>
                  {latestResult.score_a && (
                    <div className="team-score">{latestResult.score_a}</div>
                  )}
                </div>
                <div className="match-vs">
                  <div>VS</div>
                </div>
                <div className="match-team right">
                  <div className="team-name">{latestResultFixture.team_b}</div>
                  {latestResult.score_b && (
                    <div className="team-score">{latestResult.score_b}</div>
                  )}
                </div>
              </div>
              {latestResult.summary && (
                <div className="match-result">🏆 {latestResult.summary}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
