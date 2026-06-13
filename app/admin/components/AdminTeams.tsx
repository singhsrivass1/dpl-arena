"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Team } from "@/lib/types";

const EMPTY_FORM = { name: "", emoji: "" };

export default function AdminTeams({ showToast }: { showToast: (msg: string) => void }) {
  const { data: teams } = useRealtimeTable<Team>("teams", {
    orderBy: "name",
    ascending: true,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast("Franchise name is required.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("teams").insert({
      name: form.name.trim(),
      emoji: form.emoji.trim() || "🛡️",
    });
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast(`Deployed ${form.name.trim()}`);
      setForm(EMPTY_FORM);
    }
    setSaving(false);
  }

  async function handleDelete(t: Team) {
    setSaving(true);
    const { error } = await supabase.from("teams").delete().eq("id", t.id);
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast(`Removed ${t.name}`);
    }
    setSaving(false);
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">➕ Deploy New Team</div>
        <div className="admin-section-body">
          <div className="form-group">
            <label className="form-label">Franchise Name</label>
            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Falcons"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Visual Emoji Symbol</label>
            <input
              className="form-input"
              type="text"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="e.g. 🦅"
            />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={saving}>
            Deploy Team
          </button>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">📋 All Teams ({teams.length})</div>
        <div className="admin-section-body">
          {teams.length === 0 && <div className="empty-text">No teams yet.</div>}
          {teams.map((t) => (
            <div className="list-item-manage" key={t.id}>
              <div style={{ minWidth: 0 }}>
                <div className="list-item-info">
                  {t.emoji} {t.name}
                </div>
              </div>
              <button
                className="btn btn-danger"
                style={{ padding: "6px 10px", fontSize: "12px" }}
                onClick={() => handleDelete(t)}
                disabled={saving}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}