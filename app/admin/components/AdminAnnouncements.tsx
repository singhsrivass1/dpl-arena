"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Announcement } from "@/lib/types";
import { timeAgo } from "@/lib/helpers";

const EMPTY_FORM = { title: "", content: "", pinned: false };

export default function AdminAnnouncements({ showToast }: { showToast: (msg: string) => void }) {
  const { data: announcements } = useRealtimeTable<Announcement>("announcements", {
    orderBy: "created_at",
    ascending: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function loadToForm(a: Announcement) {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, pinned: a.pinned });
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      showToast("Title and content are required.");
      return;
    }
    setSaving(true);

    // Only one announcement can be pinned at a time.
    if (form.pinned) {
      await supabase.from("announcements").update({ pinned: false }).eq("pinned", true);
    }

    if (editingId) {
      const { error } = await supabase.from("announcements").update(form).eq("id", editingId);
      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast("Announcement updated");
        resetForm();
      }
    } else {
      const { error } = await supabase.from("announcements").insert(form);
      if (error) {
        showToast(`Error: ${error.message}`);
      } else {
        showToast("Announcement posted");
        resetForm();
      }
    }
    setSaving(false);
  }

  async function handleDelete(a: Announcement) {
    setSaving(true);
    const { error } = await supabase.from("announcements").delete().eq("id", a.id);
    if (error) {
      showToast(`Error: ${error.message}`);
    } else {
      showToast("Announcement deleted");
      if (editingId === a.id) resetForm();
    }
    setSaving(false);
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">
          {editingId ? "✏️ Edit Announcement" : "📢 Post Announcement"}
        </div>
        <div className="admin-section-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: "vertical" }}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Announcement details…"
            />
          </div>
          <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
            <input
              type="checkbox"
              id="pinned-checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              style={{ width: "16px", height: "16px", accentColor: "var(--green)" }}
            />
            <label htmlFor="pinned-checkbox" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              Pin to home page
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving}>
              {editingId ? "Save Changes" : "Post Announcement"}
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
        <div className="admin-section-header">📋 All Announcements ({announcements.length})</div>
        <div className="admin-section-body">
          {announcements.length === 0 && <div className="empty-text">No announcements yet.</div>}
          {announcements.map((a) => (
            <div className="list-item-manage" key={a.id} style={{ alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div className="list-item-info">
                  {a.pinned ? "📌 " : ""}
                  {a.title}
                </div>
                <div className="list-item-sub" style={{ marginTop: "2px" }}>
                  {a.content.length > 80 ? a.content.slice(0, 80) + "…" : a.content}
                </div>
                <div className="list-item-sub" style={{ marginTop: "2px" }}>
                  {timeAgo(a.created_at)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => loadToForm(a)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: "6px 10px", fontSize: "12px" }}
                  onClick={() => handleDelete(a)}
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
