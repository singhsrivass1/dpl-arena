"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { useToast } from "@/lib/useToast";
import Toast from "@/components/Toast";
import AdminPlayers from "./components/AdminPlayers";
import AdminAnnouncements from "./components/AdminAnnouncements";
import AdminFixtures from "./components/AdminFixtures";
import AdminResults from "./components/AdminResults";
import AdminLive from "./components/AdminLive";

const TABS = [
  { id: "players", label: "Players" },
  { id: "announcements", label: "Announcements" },
  { id: "fixtures", label: "Fixtures" },
  { id: "results", label: "Results" },
  { id: "live", label: "Live Scoring" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("players");
  const { message, showToast } = useToast();

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
        {activeTab === "announcements" && <AdminAnnouncements showToast={showToast} />}
        {activeTab === "fixtures" && <AdminFixtures showToast={showToast} />}
        {activeTab === "results" && <AdminResults showToast={showToast} />}
        {activeTab === "live" && <AdminLive showToast={showToast} />}
      </div>
      <Toast message={message} />
    </>
  );
}
