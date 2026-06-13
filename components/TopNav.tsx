"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/live", label: "Live" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <div className="nav-logo">🏏</div>
        <div>
          <div className="nav-title">DPL</div>
          <div className="nav-subtitle">DOBA Premier League</div>
        </div>
      </div>
      <div className="desktop-nav">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`desktop-tab ${pathname === tab.href ? "active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Link href="/admin" className="admin-btn">
        ⚙ Admin
      </Link>
    </nav>
  );
}
