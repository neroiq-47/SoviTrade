import { notFound } from "next/navigation";
import { UNDERLYINGS } from "@/lib/config";
import { AssetDetail } from "@/components/asset-detail";
export default async function AssetPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params; const u = UNDERLYINGS.find((x) => x.ticker.toLowerCase() === ticker.toLowerCase()); if (!u) notFound();
  return <AssetDetail ticker={u.ticker} />;
}
