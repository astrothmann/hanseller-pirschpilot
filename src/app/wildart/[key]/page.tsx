import { getSpecies, getSpeciesByKey } from "@/lib/species";
import { DEFAULT_STATE } from "@/lib/types";
import { WildartDetail } from "./WildartDetail";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getSpecies(DEFAULT_STATE).map((s) => ({ key: s.k }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const s = getSpeciesByKey(DEFAULT_STATE, key);
  if (!s) return { title: "Nicht gefunden" };
  return {
    title: `${s.n} – Hanseller Pirschpilot`,
    description: `Jagdzeit-Status für ${s.n} in ${DEFAULT_STATE}`,
  };
}

export default async function WildartPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const species = getSpeciesByKey(DEFAULT_STATE, key);
  if (!species) notFound();
  return <WildartDetail species={species} />;
}
