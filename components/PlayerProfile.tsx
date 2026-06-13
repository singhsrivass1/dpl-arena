"use client";

import { Player } from "@/lib/types";
import { getAvatarClass, getInitials } from "@/lib/helpers";

export default function PlayerProfile({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  if (!player) return null;

  const average = player.matches ? (player.runs / player.matches).toFixed(1) : "0.0";

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="profile-sheet">
        <div className="sheet-handle" />
        <div className="profile-top">
          <div className={`profile-avatar-lg ${getAvatarClass(player.name)}`}>
            {getInitials(player.name)}
          </div>
          <div>
            <div className="profile-name">{player.name}</div>
            <div className="profile-role">
              {player.role} ·{" "}
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                {player.category}
              </span>
            </div>
            <div className="profile-team" style={{ color: "var(--green-mid)" }}>
              Squad: {player.team}
            </div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-box-num">{player.matches}</div>
            <div className="stat-box-label">Matches</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">{player.runs}</div>
            <div className="stat-box-label">Runs</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">{player.wickets}</div>
            <div className="stat-box-label">Wickets</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">{average}</div>
            <div className="stat-box-label">Avg</div>
          </div>
          <div className="stat-box" style={{ gridColumn: "span 2" }}>
            <div className="stat-box-num">{player.highest_score}</div>
            <div className="stat-box-label">Highest Score</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-full" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
