// Small shared helpers used across pages to keep components minimal.

export const AVATAR_CLASSES = [
  "av-0",
  "av-1",
  "av-2",
  "av-3",
  "av-4",
  "av-5",
  "av-6",
  "av-7",
];

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function getAvatarClass(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_CLASSES.length;
  return AVATAR_CLASSES[hash];
}

export function formatMatchDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function oversDisplay(overs: number): string {
  // overs stored as a decimal like 8.4 = 8 overs, 4 balls
  return overs.toFixed(1);
}
