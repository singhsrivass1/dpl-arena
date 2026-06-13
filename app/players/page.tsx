"use client";

import { useMemo, useState } from "react";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Player, Role } from "@/lib/types";
import { getAvatarClass, getInitials } from "@/lib/helpers";
import PlayerProfile from "@/components/PlayerProfile";

const ROLE_FILTERS: { label: string; value: Role | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Batsmen", value: "Batsman" },
  { label: "Bowlers", value: "Bowler" },
  { label: "All-rounders", value: "All-rounder" },
  { label: "Keepers", value: "Wicket-keeper" },
];

export default function PlayersPage() {
  const { data: players, loading } = useRealtimeTable<Player>("players", {
    orderBy: "name",
    ascending: true,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [selected, setSelected] = useState<Player | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return players.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || p.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [players, search, roleFilter]);

  return (
    <>
      <div className="page-header">
        <div className="page-h1">Players</div>
        <div className="page-h1-sub">{players.length} registered players</div>
      </div>
      <div className="content" style={{ paddingTop: "14px" }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search players by name, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab ${roleFilter === f.value ? "active" : ""}`}
              onClick={() => setRoleFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Loading players…</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏏</div>
            <div className="empty-text">No matching players found</div>
          </div>
        )}

        {filtered.map((p) => (
          <div className="player-item" key={p.id} onClick={() => setSelected(p)}>
            <div className={`player-avatar ${getAvatarClass(p.name)}`}>
              {getInitials(p.name)}
            </div>
            <div className="player-info">
              <div className="player-name">{p.name}</div>
              <div className="player-role">
                {p.role} · {p.category}
              </div>
              <div className="player-stats-row">
                <span className="player-stat-mini">
                  <strong>{p.matches}</strong> Matches
                </span>
                <span className="player-stat-mini">
                  <strong>{p.runs}</strong> Runs
                </span>
                <span className="player-stat-mini">
                  <strong>{p.wickets}</strong> Wkts
                </span>
              </div>
            </div>
            <div
              className="player-team-badge"
              style={{
                background: p.team !== "Unassigned" ? "#E8F5E9" : "#F3F0EC",
                color: p.team !== "Unassigned" ? "#2E7D32" : "#6B7280",
              }}
            >
              {p.team}
            </div>
          </div>
        ))}
      </div>

      <PlayerProfile player={selected} onClose={() => setSelected(null)} />
    </>
  );
}
