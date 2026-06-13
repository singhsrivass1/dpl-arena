"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Fixture, Result } from "@/lib/types";

const EMPTY_FORM = {
  fixture_id: "",
  winner: "",
  summary: "",
  score_a: "",
  score_b: "",
};

export default function AdminResults({ showToast }: { showToast: (msg: string) => void }) {
  const { data: results } = useRealtimeTable<Result>("results", {
    orderBy: "created_at",
    ascending: false,
  });
  const { data: fixtures } = useRealtimeTable<Fixture>("fixtures", {
    orderBy: "match_date",
    ascending: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function loadToForm(r: Result) {
    setEditingId(r.id);
    setForm({
      fixture_id: r.fixture_id || "",
      winner: r.winner || "",
      summary: r.summary || "",
      score_a: r.score_a || "",
      score_b: r.score_b || "",
    });
  }

  function fixtureLabel(f: Fixture) {
    return `${f.team_a} vs ${f.team_b}${f.round ? ` — ${f.round}` : ""}`;
  }

  async function handleSubmit() {
    if (!form.fixture_id) {
      showToast("Select a fixture.");
      return;
    }
    setSaving(true);

    const payload = {
      fixture_id: form.fixture_id,
      winner: form.winner.trim() || null,
      summary: form.summary.trim() || null,
      score_a: form.score_a.trim() || null,
      score_b: form.score_b.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase.from("results").update(payload).eq("id", editingId);
      if (error) {
        showToast(`Error: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast("Result updated");
    } else {
      const { error } = await supabase.from("results").insert(payload);
      if (error) {
        showToast(`Error: ${error.message}`);
        setSaving(false);
        return;
      }
      showToast("Result added");
    }

    // Mark the fixture as completed.
    await supabase.from("fixtures").update({ status: "completed" }).eq("id", form.fixture_id);

    resetForm();
    setSaving(false);
  }

  async function handleDelete(r: Result) {
    setSaving(true);
    const { error } = await supabase.from("results").delete().eq("id", r.id);
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast("Result deleted");
      if (editingId === r.id) resetForm();
    }
    setSaving(false);
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">{editingId ? "✏️ Edit Result" : "🏆 Add Match Result"}</div>
        <div className="admin-section-body">
          <div className="form-group">
            <label className="form-label">Fixture</label>
            <select
              className="form-input"
              value={form.fixture_id}
              onChange={(e) => setForm({ ...form, fixture_id: e.target.value })}
            >
              <option value="">Select fixture</option>
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {fixtureLabel(f)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Score A</label>
              <input
                className="form-input"
                type="text"
                value={form.score_a}
                onChange={(e) => setForm({ ...form, score_a: e.target.value })}
                placeholder="e.g. 142/6 (20)"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Score B</label>
              <input
                className="form-input"
                type="text"
                value={form.score_b}
                onChange={(e) => setForm({ ...form, score_b: e.target.value })}
                placeholder="e.g. 138/8 (20)"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Winner</label>
            <input
              className="form-input"
              type="text"
              value={form.winner}
              onChange={(e) => setForm({ ...form, winner: e.target.value })}
              placeholder="e.g. Falcons"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Result Summary</label>
            <input
              className="form-input"
              type="text"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="e.g. Falcons won by 4 runs"
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
              {editingId ? "Save Changes" : "Save Result"}
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
        <div className="admin-section-header">📋 All Results ({results.length})</div>
        <div className="admin-section-body">
          {results.length === 0 && <div className="empty-text">No results yet.</div>}
          {results.map((r) => {
            const f = fixtures.find((x) => x.id === r.fixture_id);
            return (
              <div className="list-item-manage" key={r.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="list-item-info">{f ? fixtureLabel(f) : "Unknown fixture"}</div>
                  <div className="list-item-sub">{r.summary || "No summary"}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                    onClick={() => loadToForm(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                    onClick={() => handleDelete(r)}
                    disabled={saving}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
