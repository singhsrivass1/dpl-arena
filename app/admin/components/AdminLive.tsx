"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, LiveBatting, LiveBowling, LiveMatch, LiveStatus, Team } from "@/lib/types";
import { BALL_TYPES, BallType, computeBall, incrementBowlerOvers } from "@/lib/scoring";

const LIVE_STATUSES: LiveStatus[] = ["upcoming", "live", "innings_break", "completed"];

interface MatchForm {
  batting_team: string;
  bowling_team: string;
  striker: string;
  non_striker: string;
  bowler: string;
  runs: number;
  wickets: number;
  overs: number;
  extras: number;
  last_over: string;
  status: LiveStatus;
}

const EMPTY_MATCH_FORM: MatchForm = {
  batting_team: "",
  bowling_team: "",
  striker: "",
  non_striker: "",
  bowler: "",
  runs: 0,
  wickets: 0,
  overs: 0,
  extras: 0,
  last_over: "",
  status: "live",
};

const DISMISSAL_OPTIONS = ["not out", "bowled", "caught", "run out", "stumped", "lbw", "hit wicket", "retired"];

export default function AdminLive({ showToast }: { showToast: (msg: string) => void }) {
  const { data: liveMatches } = useRealtimeTable<LiveMatch>("live_matches", {
    orderBy: "updated_at",
    ascending: false,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures", {
    orderBy: "match_date",
    ascending: false,
  });
  const { data: teams } = useRealtimeTable<Team>("teams", { orderBy: "name", ascending: true });

  const [selectedId, setSelectedId] = useState<string>("");
  const [fixtureForNew, setFixtureForNew] = useState<string>("");
  const [matchForm, setMatchForm] = useState<MatchForm>(EMPTY_MATCH_FORM);
  const [saving, setSaving] = useState(false);

  const selectedMatch = liveMatches.find((m) => m.id === selectedId) || null;

  const { data: batting } = useRealtimeTable<LiveBatting>("live_batting", {
    filterColumn: "live_match_id",
    filterValue: selectedId || "none",
    orderBy: "order_no",
    ascending: true,
  });
  const { data: bowling } = useRealtimeTable<LiveBowling>("live_bowling", {
    filterColumn: "live_match_id",
    filterValue: selectedId || "none",
    orderBy: "order_no",
    ascending: true,
  });

  // Load the form whenever a different match is selected (don't fight realtime echoes).
  useEffect(() => {
    if (selectedMatch) {
      setMatchForm({
        batting_team: selectedMatch.batting_team || "",
        bowling_team: selectedMatch.bowling_team || "",
        striker: selectedMatch.striker || "",
        non_striker: selectedMatch.non_striker || "",
        bowler: selectedMatch.bowler || "",
        runs: selectedMatch.runs,
        wickets: selectedMatch.wickets,
        overs: selectedMatch.overs,
        extras: selectedMatch.extras,
        last_over: selectedMatch.last_over || "",
        status: selectedMatch.status,
      });
    } else {
      setMatchForm(EMPTY_MATCH_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function fixtureFor(m: LiveMatch) {
    return fixtures.find((f) => f.id === m.fixture_id);
  }

  function fixtureLabel(f: Fixture) {
    return `${f.team_a} vs ${f.team_b}${f.round ? ` — ${f.round}` : ""}`;
  }

  // Fixtures that don't have a live_matches row yet.
  const availableFixtures = fixtures.filter(
    (f) => !liveMatches.some((m) => m.fixture_id === f.id) && f.status !== "cancelled"
  );

  async function startLiveScoring() {
    if (!fixtureForNew) {
      showToast("Select a fixture first.");
      return;
    }
    const fixture = fixtures.find((f) => f.id === fixtureForNew);
    if (!fixture) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("live_matches")
      .insert({
        fixture_id: fixture.id,
        batting_team: fixture.team_a,
        bowling_team: fixture.team_b,
        status: "live",
      })
      .select()
      .single();

    if (error) {
      showToast(`Error: ${error.message}`);
      setSaving(false);
      return;
    }

    await supabase.from("fixtures").update({ status: "live" }).eq("id", fixture.id);
    setFixtureForNew("");
    setSelectedId(data.id);
    showToast("Live scoring started — set up players below");
    setSaving(false);
  }

  async function saveMatchInfo() {
    if (!selectedMatch) return;
    setSaving(true);
    const { error } = await supabase
      .from("live_matches")
      .update({
        batting_team: matchForm.batting_team,
        bowling_team: matchForm.bowling_team,
        striker: matchForm.striker || null,
        non_striker: matchForm.non_striker || null,
        bowler: matchForm.bowler || null,
        runs: matchForm.runs,
        wickets: matchForm.wickets,
        overs: matchForm.overs,
        extras: matchForm.extras,
        last_over: matchForm.last_over,
        status: matchForm.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedMatch.id);

    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast("Match info updated");
      // Keep the fixture status roughly in sync with the live match status.
      if (selectedMatch.fixture_id) {
        if (matchForm.status === "completed") {
          await supabase.from("fixtures").update({ status: "completed" }).eq("id", selectedMatch.fixture_id);
        } else {
          await supabase.from("fixtures").update({ status: "live" }).eq("id", selectedMatch.fixture_id);
        }
      }
    }
    setSaving(false);
  }

  // ---------------- QUICK SCORING ----------------
  async function recordBall(ballType: BallType) {
    if (!selectedMatch) return;
    setSaving(true);

    const result = computeBall(ballType, {
      runs: selectedMatch.runs,
      wickets: selectedMatch.wickets,
      overs: selectedMatch.overs,
      extras: selectedMatch.extras,
      lastOver: (selectedMatch.last_over || "").split(",").map((s) => s.trim()).filter(Boolean),
    });

    let newStriker = selectedMatch.striker;
    let newNonStriker = selectedMatch.non_striker;
    if (result.swapStrike) {
      newStriker = selectedMatch.non_striker;
      newNonStriker = selectedMatch.striker;
    }

    // 1. Update the live match score.
    const { error: matchErr } = await supabase
      .from("live_matches")
      .update({
        runs: result.runs,
        wickets: result.wickets,
        overs: result.overs,
        extras: result.extras,
        last_over: result.lastOver.join(","),
        striker: newStriker,
        non_striker: newNonStriker,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedMatch.id);

    if (matchErr) {
      showToast(`Error: ${matchErr.message}`);
      setSaving(false);
      return;
    }

    // 2. Update the striker's batting figures (runs scored off the bat only).
    if (selectedMatch.striker) {
      const strikerRow = batting.find((b) => b.player_name === selectedMatch.striker);
      if (strikerRow) {
        const ballFaced = ballType !== "Wd"; // no-balls count as a ball faced
        await supabase
          .from("live_batting")
          .update({
            runs: strikerRow.runs + (result.isExtra ? 0 : result.runValue),
            balls: strikerRow.balls + (ballFaced ? 1 : 0),
            fours: strikerRow.fours + (ballType === "4" ? 1 : 0),
            sixes: strikerRow.sixes + (ballType === "6" ? 1 : 0),
            dismissal: result.isWicket ? "out" : strikerRow.dismissal,
          })
          .eq("id", strikerRow.id);
      }
    }

    // 3. Update the current bowler's figures.
    if (selectedMatch.bowler) {
      const bowlerRow = bowling.find((b) => b.player_name === selectedMatch.bowler);
      if (bowlerRow) {
        const newOvers = result.ballCounts ? incrementBowlerOvers(bowlerRow.overs) : bowlerRow.overs;
        await supabase
          .from("live_bowling")
          .update({
            overs: newOvers,
            runs: bowlerRow.runs + result.runValue,
            wickets: bowlerRow.wickets + (result.isWicket ? 1 : 0),
          })
          .eq("id", bowlerRow.id);
      }
    }

    showToast(`Recorded: ${ballType}`);
    setSaving(false);
  }

  // ---------------- BATTING SCORECARD ----------------
  const [newBatter, setNewBatter] = useState("");
  async function addBatter() {
    if (!selectedMatch || !newBatter.trim()) return;
    setSaving(true);
    const nextOrder = batting.length;
    await supabase.from("live_batting").insert({
      live_match_id: selectedMatch.id,
      player_name: newBatter.trim(),
      order_no: nextOrder,
    });
    setNewBatter("");
    showToast(`${newBatter.trim()} added to batting card`);
    setSaving(false);
  }

  async function updateBattingRow(row: LiveBatting, field: keyof LiveBatting, value: string | number) {
    await supabase.from("live_batting").update({ [field]: value }).eq("id", row.id);
  }

  async function deleteBattingRow(row: LiveBatting) {
    await supabase.from("live_batting").delete().eq("id", row.id);
    showToast(`Removed ${row.player_name} from batting card`);
  }

  // ---------------- BOWLING SCORECARD ----------------
  const [newBowler, setNewBowler] = useState("");
  async function addBowler() {
    if (!selectedMatch || !newBowler.trim()) return;
    setSaving(true);
    const nextOrder = bowling.length;
    await supabase.from("live_bowling").insert({
      live_match_id: selectedMatch.id,
      player_name: newBowler.trim(),
      order_no: nextOrder,
    });
    setNewBowler("");
    showToast(`${newBowler.trim()} added to bowling card`);
    setSaving(false);
  }

  async function updateBowlingRow(row: LiveBowling, field: keyof LiveBowling, value: string | number) {
    await supabase.from("live_bowling").update({ [field]: value }).eq("id", row.id);
  }

  async function deleteBowlingRow(row: LiveBowling) {
    await supabase.from("live_bowling").delete().eq("id", row.id);
    showToast(`Removed ${row.player_name} from bowling card`);
  }

  // ---------------- MATCH COMPLETION ----------------
  const [resultForm, setResultForm] = useState({ winner: "", summary: "", score_a: "", score_b: "" });

  async function completeMatch() {
    if (!selectedMatch || !selectedMatch.fixture_id) return;
    setSaving(true);

    await supabase
      .from("live_matches")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", selectedMatch.id);

    await supabase.from("fixtures").update({ status: "completed" }).eq("id", selectedMatch.fixture_id);

    const { data: existingResult } = await supabase
      .from("results")
      .select("*")
      .eq("fixture_id", selectedMatch.fixture_id)
      .maybeSingle();

    const payload = {
      fixture_id: selectedMatch.fixture_id,
      winner: resultForm.winner.trim() || null,
      summary: resultForm.summary.trim() || null,
      score_a: resultForm.score_a.trim() || `${selectedMatch.runs}/${selectedMatch.wickets} (${selectedMatch.overs.toFixed(1)})`,
      score_b: resultForm.score_b.trim() || null,
    };

    if (existingResult) {
      await supabase.from("results").update(payload).eq("id", existingResult.id);
    } else {
      await supabase.from("results").insert(payload);
    }

    showToast("Match completed and result posted");
    setSaving(false);
  }

  return (
    <>
      {/* START NEW LIVE MATCH */}
      <div className="admin-section">
        <div className="admin-section-header">🟢 Start Live Scoring</div>
        <div className="admin-section-body">
          {availableFixtures.length === 0 ? (
            <div className="empty-text">
              No fixtures available. Create a fixture in the Fixtures tab first.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Fixture</label>
                <select
                  className="form-input"
                  value={fixtureForNew}
                  onChange={(e) => setFixtureForNew(e.target.value)}
                >
                  <option value="">Select fixture</option>
                  {availableFixtures.map((f) => (
                    <option key={f.id} value={f.id}>
                      {fixtureLabel(f)}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary btn-full" onClick={startLiveScoring} disabled={saving}>
                Start Live Scoring
              </button>
            </>
          )}
        </div>
      </div>

      {/* SELECT EXISTING LIVE MATCH */}
      <div className="admin-section">
        <div className="admin-section-header">📡 Manage Live Match</div>
        <div className="admin-section-body">
          {liveMatches.length === 0 ? (
            <div className="empty-text">No live matches yet.</div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Match</label>
              <select className="form-input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">Choose a match…</option>
                {liveMatches.map((m) => {
                  const f = fixtureFor(m);
                  return (
                    <option key={m.id} value={m.id}>
                      {f ? fixtureLabel(f) : "Match"} ({m.status})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <>
          {/* MATCH SETUP */}
          <div className="admin-section">
            <div className="admin-section-header">⚙️ Match Setup</div>
            <div className="admin-section-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Batting Team</label>
                  <select
                    className="form-input"
                    value={matchForm.batting_team}
                    onChange={(e) => setMatchForm({ ...matchForm, batting_team: e.target.value })}
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.emoji} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bowling Team</label>
                  <select
                    className="form-input"
                    value={matchForm.bowling_team}
                    onChange={(e) => setMatchForm({ ...matchForm, bowling_team: e.target.value })}
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.emoji} {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Striker</label>
                  <input
                    className="form-input"
                    type="text"
                    value={matchForm.striker}
                    onChange={(e) => setMatchForm({ ...matchForm, striker: e.target.value })}
                    placeholder="Batsman on strike"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Non-Striker</label>
                  <input
                    className="form-input"
                    type="text"
                    value={matchForm.non_striker}
                    onChange={(e) => setMatchForm({ ...matchForm, non_striker: e.target.value })}
                    placeholder="Batsman at other end"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Current Bowler</label>
                <input
                  className="form-input"
                  type="text"
                  value={matchForm.bowler}
                  onChange={(e) => setMatchForm({ ...matchForm, bowler: e.target.value })}
                  placeholder="Bowler's name"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Runs</label>
                  <input
                    className="form-input"
                    type="number"
                    value={matchForm.runs}
                    onChange={(e) => setMatchForm({ ...matchForm, runs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Wickets</label>
                  <input
                    className="form-input"
                    type="number"
                    value={matchForm.wickets}
                    onChange={(e) => setMatchForm({ ...matchForm, wickets: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Overs</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={matchForm.overs}
                    onChange={(e) => setMatchForm({ ...matchForm, overs: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Extras</label>
                  <input
                    className="form-input"
                    type="number"
                    value={matchForm.extras}
                    onChange={(e) => setMatchForm({ ...matchForm, extras: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Over (comma separated, e.g. 1,4,W,0,2,1)</label>
                <input
                  className="form-input"
                  type="text"
                  value={matchForm.last_over}
                  onChange={(e) => setMatchForm({ ...matchForm, last_over: e.target.value })}
                  placeholder="1,4,W,0,2,1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Match Status</label>
                <select
                  className="form-input"
                  value={matchForm.status}
                  onChange={(e) => setMatchForm({ ...matchForm, status: e.target.value as LiveStatus })}
                >
                  {LIVE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary btn-full" onClick={saveMatchInfo} disabled={saving}>
                Save Match Info
              </button>
            </div>
          </div>

          {/* QUICK SCORING */}
          <div className="admin-section">
            <div className="admin-section-header">⚡ Quick Scoring</div>
            <div className="admin-section-body">
              <div className="empty-text" style={{ marginBottom: "10px" }}>
                Tap a result for the current ball. Updates the score, striker&apos;s figures and current
                bowler&apos;s figures, and rotates the strike automatically.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {BALL_TYPES.map((b) => (
                  <button
                    key={b}
                    className="btn btn-secondary"
                    style={{
                      flex: "1 1 60px",
                      fontWeight: 800,
                      color: b === "W" ? "#DC2626" : b === "4" || b === "6" ? "var(--green)" : undefined,
                    }}
                    onClick={() => recordBall(b)}
                    disabled={saving || !matchForm.striker || !matchForm.bowler}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {(!matchForm.striker || !matchForm.bowler) && (
                <div className="empty-text" style={{ marginTop: "10px" }}>
                  Set a striker and bowler in Match Setup to enable quick scoring.
                </div>
              )}
            </div>
          </div>

          {/* BATTING SCORECARD */}
          <div className="admin-section">
            <div className="admin-section-header">🏏 Batting Scorecard</div>
            <div className="admin-section-body">
              {batting.map((b) => (
                <div className="list-item-manage" key={b.id} style={{ flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 100%", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                    {b.player_name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", flex: "1 1 auto" }}>
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.runs}
                      onBlur={(e) => updateBattingRow(b, "runs", parseInt(e.target.value) || 0)}
                      placeholder="R"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.balls}
                      onBlur={(e) => updateBattingRow(b, "balls", parseInt(e.target.value) || 0)}
                      placeholder="B"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.fours}
                      onBlur={(e) => updateBattingRow(b, "fours", parseInt(e.target.value) || 0)}
                      placeholder="4s"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.sixes}
                      onBlur={(e) => updateBattingRow(b, "sixes", parseInt(e.target.value) || 0)}
                      placeholder="6s"
                    />
                  </div>
                  <div style={{ display: "flex", gap: "6px", flex: "1 1 100%", marginTop: "6px" }}>
                    <select
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px", flex: 1 }}
                      defaultValue={b.dismissal}
                      onChange={(e) => updateBattingRow(b, "dismissal", e.target.value)}
                    >
                      {DISMISSAL_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: "12px" }} onClick={() => deleteBattingRow(b)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  className="form-input"
                  type="text"
                  value={newBatter}
                  onChange={(e) => setNewBatter(e.target.value)}
                  placeholder="Add batsman to scorecard"
                />
                <button className="btn btn-primary" onClick={addBatter} disabled={saving}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* BOWLING SCORECARD */}
          <div className="admin-section">
            <div className="admin-section-header">🎯 Bowling Scorecard</div>
            <div className="admin-section-body">
              {bowling.map((b) => (
                <div className="list-item-manage" key={b.id} style={{ flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 100%", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                    {b.player_name}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", flex: "1 1 auto" }}>
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      step="0.1"
                      defaultValue={b.overs}
                      onBlur={(e) => updateBowlingRow(b, "overs", parseFloat(e.target.value) || 0)}
                      placeholder="O"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.maidens}
                      onBlur={(e) => updateBowlingRow(b, "maidens", parseInt(e.target.value) || 0)}
                      placeholder="M"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.runs}
                      onBlur={(e) => updateBowlingRow(b, "runs", parseInt(e.target.value) || 0)}
                      placeholder="R"
                    />
                    <input
                      className="form-input"
                      style={{ padding: "6px 8px", fontSize: "12px" }}
                      type="number"
                      defaultValue={b.wickets}
                      onBlur={(e) => updateBowlingRow(b, "wickets", parseInt(e.target.value) || 0)}
                      placeholder="W"
                    />
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "6px 10px", fontSize: "12px", marginTop: "6px" }}
                    onClick={() => deleteBowlingRow(b)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <input
                  className="form-input"
                  type="text"
                  value={newBowler}
                  onChange={(e) => setNewBowler(e.target.value)}
                  placeholder="Add bowler to scorecard"
                />
                <button className="btn btn-primary" onClick={addBowler} disabled={saving}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* MATCH COMPLETION */}
          <div className="admin-section">
            <div className="admin-section-header">🏁 Complete Match</div>
            <div className="admin-section-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Score A</label>
                  <input
                    className="form-input"
                    type="text"
                    value={resultForm.score_a}
                    onChange={(e) => setResultForm({ ...resultForm, score_a: e.target.value })}
                    placeholder={`${selectedMatch.runs}/${selectedMatch.wickets} (${selectedMatch.overs.toFixed(1)})`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Score B</label>
                  <input
                    className="form-input"
                    type="text"
                    value={resultForm.score_b}
                    onChange={(e) => setResultForm({ ...resultForm, score_b: e.target.value })}
                    placeholder="e.g. 138/8 (20)"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Winner</label>
                <input
                  className="form-input"
                  type="text"
                  value={resultForm.winner}
                  onChange={(e) => setResultForm({ ...resultForm, winner: e.target.value })}
                  placeholder="e.g. Falcons"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Result Summary</label>
                <input
                  className="form-input"
                  type="text"
                  value={resultForm.summary}
                  onChange={(e) => setResultForm({ ...resultForm, summary: e.target.value })}
                  placeholder="e.g. Falcons won by 4 runs"
                />
              </div>
              <button className="btn btn-danger btn-full" onClick={completeMatch} disabled={saving}>
                Mark Completed &amp; Post Result
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
