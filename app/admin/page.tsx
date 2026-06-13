"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/useToast";
import Toast from "@/components/Toast";
import AdminPlayers from "./components/AdminPlayers";
import AdminTeams from "./components/AdminTeams";
import AdminAnnouncements from "./components/AdminAnnouncements";
import AdminFixtures from "./components/AdminFixtures";
import AdminResults from "./components/AdminResults";
import AdminLive from "./components/AdminLive";

const TABS = [
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "announcements", label: "Announcements" },
  { id: "fixtures", label: "Fixtures" },
  { id: "results", label: "Results" },
  { id: "live", label: "Live Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AUTH_KEY = "dpl_admin_authenticated";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("players");
  const { message, showToast } = useToast();

  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_KEY);
    setAuthenticated(stored === "true");
    setAuthChecked(true);
  }, []);

  function handleUnlock() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE) {
      window.localStorage.setItem(AUTH_KEY, "true");
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect passphrase. Please try again.");
    }
  }

  if (!authChecked) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="content" style={{ paddingTop: "60px", maxWidth: "400px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔒</div>
          <div className="page-h1" style={{ fontSize: "20px", marginBottom: "4px" }}>
            Admin Access
          </div>
          <div className="page-h1-sub" style={{ marginBottom: "16px" }}>
            Enter the admin passphrase to continue
          </div>
          <div className="form-group">
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUnlock();
              }}
              placeholder="Passphrase"
              autoFocus
            />
          </div>
          {authError && (
            <div style={{ color: "#DC2626", fontSize: "13px", marginBottom: "10px" }}>{authError}</div>
          )}
          <button className="btn btn-primary btn-full" onClick={handleUnlock}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-h1">Admin Panel</div>
        <div className="page-h1-sub">Tournament management — changes sync to everyone instantly</div>
      </div>
      <div className="content" style={{ paddingTop: "14px" }}>
        <div className="filter-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "players" && <AdminPlayers showToast={showToast} />}
        {activeTab === "teams" && <AdminTeams showToast={showToast} />}
        {activeTab === "announcements" && <AdminAnnouncements showToast={showToast} />}
        {activeTab === "fixtures" && <AdminFixtures showToast={showToast} />}
        {activeTab === "results" && <AdminResults showToast={showToast} />}
        {activeTab === "live" && <AdminLive showToast={showToast} />}
      </div>
      <Toast message={message} />
    </>
  );
}