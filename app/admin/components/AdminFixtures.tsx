"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, FixtureStatus, LiveMatch, Team } from "@/lib/types";
import { formatMatchDate } from "@/lib/helpers";

const STATUSES: FixtureStatus[] = ["upcoming", "live", "completed", "cancelled"];

const EMPTY_FORM = {
  team_a: "",
  team_b: "",
  match_date: "",
  venue: "",
  round: "",
  status: "upcoming" as FixtureStatus,
};

export default function AdminFixtures({ showToast }: { showToast: (msg: string) => void }) {
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures", {
    orderBy: "match_date",
    ascending: true,
  });
  const { data: teams } = useRealtimeTable<Team>("teams", {
    orderBy: "name",
    ascending: true,
  });
  const { data: liveMatches } = useRealtimeTable<LiveMatch>("live_matches");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function loadToForm(f: Fixture) {
    setEditingId(f.id);
    setForm({
      team_a: f.team_a,
      team_b: f.team_b,
      match_date: f.match_date ? f.match_date.slice(0, 16) : "",
      venue: f.venue || "",
      round: f.round || "",
      status: f.status,
    });
  }

  async function handleSubmit() {
    if (!form.team_a || !form.team_b) {
      showToast("Select both teams.");
      return;
    }
    setSaving(true);

    const payload = {
      team_a: form.team_a,
      team_b: form.team_b,
      match_date: form.match_date ? new Date(form.match_date).toISOString() : null,
      venue: form.venue.trim() || null,
      round: form.round.trim() || null,
      status: form.status,
    };

    let fixtureId = editingId;

    if (editingId) {
      const { error } = await supabase.from("fixtures").update(payload).eq("id", editingId);
      if (error) {
        showToast(`Error: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast("Fixture updated");
    } else {
      const { data, error } = await supabase.from("fixtures").insert(payload).select().single();
      if (error) {
        showToast(`Error: ${error.message}`);
        setSaving(false);
        return;
      }
      fixtureId = data.id;
      showToast("Fixture created");
    }

    // If the fixture is marked live and no live_matches row exists yet, create one.
    if (form.status === "live" && fixtureId) {
      const exists = liveMatches.some((m) => m.fixture_id === fixtureId);
      if (!exists) {
        await supabase.from("live_matches").insert({
          fixture_id: fixtureId,
          batting_team: form.team_a,
          bowling_team: form.team_b,
          status: "live",
        });
        showToast("Fixture marked live — set up scoring in the Live Scoring tab");
      }
    }

    resetForm();
    setSaving(false);
  }

  async function handleDelete(f: Fixture) {
    setSaving(true);
    const { error } = await supabase.from("fixtures").delete().eq("id", f.id);
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast("Fixture deleted");
      if (editingId === f.id) resetForm();
    }
    setSaving(false);
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">{editingId ? "✏️ Edit Fixture" : "🏏 Create Fixture"}</div>
        <div className="admin-section-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Team A</label>
              <select
                className="form-input"
                value={form.team_a}
                onChange={(e) => setForm({ ...form, team_a: e.target.value })}
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
              <label className="form-label">Team B</label>
              <select
                className="form-input"
                value={form.team_b}
                onChange={(e) => setForm({ ...form, team_b: e.target.value })}
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
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <input
              className="form-input"
              type="datetime-local"
              value={form.match_date}
              onChange={(e) => setForm({ ...form, match_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input
              className="form-input"
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g. H13 Ground"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Round</label>
            <input
              className="form-input"
              type="text"
              value={form.round}
              onChange={(e) => setForm({ ...form, round: e.target.value })}
              placeholder="e.g. Match 1, Quarterfinal 1"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as FixtureStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
              {editingId ? "Save Changes" : "Create Fixture"}
            </button>
            {editingId && (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">📋 All Fixtures ({fixtures.length})</div>
        <div className="admin-section-body">
          {fixtures.length === 0 && <div className="empty-text">No fixtures yet.</div>}
          {fixtures.map((f) => (
            <div className="list-item-manage" key={f.id}>
              <div style={{ minWidth: 0 }}>
                <div className="list-item-info">
                  {f.team_a} vs {f.team_b}
                </div>
                <div className="list-item-sub">
                  {f.round || "Fixture"} · {formatMatchDate(f.match_date)} · {f.status}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => loadToForm(f)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => handleDelete(f)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
