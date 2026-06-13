import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "DPL – DOBA Premier League",
  description: "Live scores, fixtures, players and results for the DOBA Premier League.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
