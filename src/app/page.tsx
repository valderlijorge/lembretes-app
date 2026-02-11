import { loadFromJsonBin } from "@/lib/storage/jsonbin-storage";
import { Lembrete } from "@/types/lembrete";
import HomeClient from "./HomeClient";

export default async function Home() {
  let lembretes: Lembrete[] = [];
  let error: string | null = null;

  try {
    lembretes = await loadFromJsonBin();
  } catch (err) {
    error = err instanceof Error ? err.message : "Erro ao carregar lembretes";
  }

  return <HomeClient initialLembretes={lembretes} error={error} />;
}
