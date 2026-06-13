"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/players", label: "Players", icon: "👤" },
  { href: "/fixtures", label: "Fixtures", icon: "🛡" },
  { href: "/results", label: "Results", icon: "🏏" },
  { href: "/live", label: "Live", icon: "📡" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`nav-tab ${pathname === tab.href ? "active" : ""}`}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
