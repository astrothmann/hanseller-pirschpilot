import { getAllKeysAcrossStates, getSpeciesByKeyAnyState } from "@/lib/species";
import { WildartDetail } from "./WildartDetail";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllKeysAcrossStates().map((key) => ({ key }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const s = getSpeciesByKeyAnyState(key);
  if (!s) return { title: "Nicht gefunden" };
  return {
    title: `${s.n} – Hanseller Pirschpilot`,
    description: `Jagdzeit-Status für ${s.n}`,
  };
}

export default async function WildartPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const s = getSpeciesByKeyAnyState(key);
  if (!s) notFound();
  return <WildartDetail slug={key} />;
}
