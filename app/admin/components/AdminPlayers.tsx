"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Category, Player, Role, Team } from "@/lib/types";
import { getAvatarClass, getInitials } from "@/lib/helpers";

const ROLES: Role[] = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"];
const CATEGORIES: Category[] = ["DOBA", "Non-DOBA"];

const EMPTY_FORM = {
  name: "",
  category: "DOBA" as Category,
  role: "Batsman" as Role,
  team: "Unassigned",
  matches: 0,
  runs: 0,
  wickets: 0,
  highest_score: 0,
};

export default function AdminPlayers({ showToast }: { showToast: (msg: string) => void }) {
  const { data: players } = useRealtimeTable<Player>("players", {
    orderBy: "name",
    ascending: true,
  });
  const { data: teams } = useRealtimeTable<Team>("teams", {
    orderBy: "name",
    ascending: true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function loadToForm(p: Player) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      role: p.role,
      team: p.team,
      matches: p.matches,
      runs: p.runs,
      wickets: p.wickets,
      highest_score: p.highest_score,
    });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast("Player name is required.");
      return;
    }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("players").update(form).eq("id", editingId);
      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast(`Updated ${form.name}`);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("players").insert(form);
      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast(`Added ${form.name} to the roster`);
        resetForm();
      }
    }
    setSaving(false);
  }

  async function handleDelete(p: Player) {
    setSaving(true);
    const { error } = await supabase.from("players").delete().eq("id", p.id);
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast(`Removed ${p.name}`);
      if (editingId === p.id) resetForm();
    }
    setSaving(false);
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">
          {editingId ? "✏️ Edit Player" : "➕ Add New Player"}
        </div>
        <div className="admin-section-body">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Team</label>
            <select
              className="form-input"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
            >
              <option value="Unassigned">Unassigned</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.emoji} {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Matches</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.matches}
                onChange={(e) => setForm({ ...form, matches: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Runs</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.runs}
                onChange={(e) => setForm({ ...form, runs: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wickets</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.wickets}
                onChange={(e) => setForm({ ...form, wickets: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">High Score</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={form.highest_score}
                onChange={(e) => setForm({ ...form, highest_score: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
              {editingId ? "Save Changes" : "Add Player"}
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
        <div className="admin-section-header">📋 All Players ({players.length})</div>
        <div className="admin-section-body">
          {players.length === 0 && <div className="empty-text">No players yet.</div>}
          {players.map((p) => (
            <div className="list-item-manage" key={p.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  className={`player-avatar ${getAvatarClass(p.name)}`}
                  style={{ width: "32px", height: "32px", fontSize: "11px", borderRadius: "8px", flexShrink: 0 }}
                >
                  {getInitials(p.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="list-item-info">{p.name}</div>
                  <div className="list-item-sub">
                    {p.role} · {p.category} · {p.team}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => loadToForm(p)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => handleDelete(p)}
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
