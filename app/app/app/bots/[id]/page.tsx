import { notFound } from "next/navigation";
export default function BotDetail({ params }: { params: { id: string } }) {
  return <div className="p-6"><h1 className="text-2xl font-bold">Bot {params.id}</h1><p className="text-muted">Bot detail view (empty in v1 — no execution engine yet).</p></div>;
}
