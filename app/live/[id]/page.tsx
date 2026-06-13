import LiveMatchView from "./LiveMatchView";

export default async function LiveMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LiveMatchView liveMatchId={id} />;
}
