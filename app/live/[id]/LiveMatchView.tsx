"use client";

import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, LiveBatting, LiveBowling, LiveMatch } from "@/lib/types";

function parseLastOver(lastOver: string | null): string[] {
  if (!lastOver) return [];
  return lastOver
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
}

function ballClass(ball: string): string {
  const upper = ball.toUpperCase();
  if (upper === "W" || upper === "WK") return "over-ball wicket";
  if (ball === "4" || ball === "6") return "over-ball boundary";
  return "over-ball";
}

export default function LiveMatchView({ liveMatchId }: { liveMatchId: string }) {
  const { data: liveRows, loading } = useRealtimeTable<LiveMatch>("live_matches", {
    filterColumn: "id",
    filterValue: liveMatchId,
  });
  const { data: batting } = useRealtimeTable<LiveBatting>("live_batting", {
    filterColumn: "live_match_id",
    filterValue: liveMatchId,
    orderBy: "order_no",
    ascending: true,
  });
  const { data: bowling } = useRealtimeTable<LiveBowling>("live_bowling", {
    filterColumn: "live_match_id",
    filterValue: liveMatchId,
    orderBy: "order_no",
    ascending: true,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures");

  const match = liveRows[0];
  const fixture = match ? fixtures.find((f) => f.id === match.fixture_id) : null;

  if (loading) {
    return (
      <div className="content" style={{ paddingTop: "20px" }}>
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-text">Loading live match…</div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="content" style={{ paddingTop: "20px" }}>
        <div className="empty-state">
          <div className="empty-icon">📡</div>
          <div className="empty-text">This match could not be found.</div>
        </div>
      </div>
    );
  }

  const balls = parseLastOver(match.last_over);
  const totalBatting = batting.reduce((sum, b) => sum + b.runs, 0);
  const onStrike = batting.find((b) => b.player_name === match.striker);
  const nonStrike = batting.find((b) => b.player_name === match.non_striker);
  const currentBowler = bowling.find((b) => b.player_name === match.bowler);

  const statusLabel: Record<string, string> = {
    live: "● Live",
    innings_break: "Innings Break",
    completed: "Completed",
    upcoming: "Upcoming",
  };

  return (
    <div className="content" style={{ paddingTop: "16px" }}>
      <div className="page-header" style={{ padding: 0, marginBottom: "12px" }}>
        <div className="page-h1" style={{ fontSize: "20px" }}>
          {fixture ? `${fixture.team_a} vs ${fixture.team_b}` : "Live Match"}
        </div>
        <div className="page-h1-sub">{fixture?.round || "Match"}</div>
      </div>

      <div className="live-score-card">
        <div className="live-pulse-row">
          {match.status === "live" && <span className="live-pulse-dot" />}
          <span className="live-pulse-label">{statusLabel[match.status]}</span>
        </div>
        <div className="live-team-name">{match.batting_team || "Team A"}</div>
        <div className="live-score-main">
          {match.runs}/{match.wickets}
          <span style={{ fontSize: "18px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
            {" "}
            ({match.overs.toFixed(1)})
          </span>
        </div>
        <div className="live-overs">
          vs {match.bowling_team || "Team B"} · Extras {match.extras}
        </div>

        {(onStrike || nonStrike) && (
          <div className="live-batsmen-row">
            {onStrike && (
              <div className="live-batsman">
                <div className="live-batsman-name">{onStrike.player_name}*</div>
                <div className="live-batsman-score">
                  {onStrike.runs} ({onStrike.balls})
                </div>
              </div>
            )}
            {nonStrike && (
              <div className="live-batsman">
                <div className="live-batsman-name">{nonStrike.player_name}</div>
                <div className="live-batsman-score">
                  {nonStrike.runs} ({nonStrike.balls})
                </div>
              </div>
            )}
          </div>
        )}

        {currentBowler && (
          <div className="live-bowler-row">
            <div className="live-bowler-label">Current Bowler</div>
            <div className="live-bowler-name">
              {currentBowler.player_name} — {currentBowler.overs} - {currentBowler.maidens} -{" "}
              {currentBowler.runs} - {currentBowler.wickets}
            </div>
          </div>
        )}

        {balls.length > 0 && (
          <div className="last-over-row">
            {balls.map((b, i) => (
              <div className={ballClass(b)} key={i}>
                {b}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="scorecard">
        <div className="sc-body">
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
            Batting — {match.batting_team}
          </div>
          {batting.length === 0 && (
            <div className="empty-text" style={{ padding: "8px 0", textAlign: "center" }}>
              No batting data yet.
            </div>
          )}
          {batting.length > 0 && (
            <>
              <div className="sc-batting-row header">
                <div>Batsman</div>
                <div className="sc-num">R</div>
                <div className="sc-num">B</div>
                <div className="sc-num">4s</div>
                <div className="sc-num">6s</div>
              </div>
              {batting.map((b) => (
                <div className="sc-batting-row" key={b.id}>
                  <div>
                    <div className="sc-player-name">
                      {b.player_name}
                      {b.player_name === match.striker && b.dismissal === "not out" ? "*" : ""}
                    </div>
                    <div className="sc-dismissal">{b.dismissal}</div>
                  </div>
                  <div className="sc-num highlight">{b.runs}</div>
                  <div className="sc-num">{b.balls}</div>
                  <div className="sc-num">{b.fours}</div>
                  <div className="sc-num">{b.sixes}</div>
                </div>
              ))}
              <div className="sc-total">
                <span className="sc-total-label">Total</span>
                <span className="sc-total-score">
                  {totalBatting + match.extras}/{match.wickets} ({match.overs.toFixed(1)})
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="scorecard">
        <div className="sc-body">
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
            Bowling — {match.bowling_team}
          </div>
          {bowling.length === 0 && (
            <div className="empty-text" style={{ padding: "8px 0", textAlign: "center" }}>
              No bowling data yet.
            </div>
          )}
          {bowling.length > 0 && (
            <>
              <div className="sc-bowling-row header">
                <div>Bowler</div>
                <div className="sc-num">O</div>
                <div className="sc-num">M</div>
                <div className="sc-num">R</div>
                <div className="sc-num">W</div>
              </div>
              {bowling.map((b) => (
                <div className="sc-bowling-row" key={b.id}>
                  <div className="sc-player-name">
                    {b.player_name}
                    {b.player_name === match.bowler ? "*" : ""}
                  </div>
                  <div className="sc-num">{b.overs}</div>
                  <div className="sc-num">{b.maidens}</div>
                  <div className="sc-num">{b.runs}</div>
                  <div className="sc-num highlight">{b.wickets}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
