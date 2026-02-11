"use server";

import { loadFromJsonBin, updateJsonBin } from "@/lib/storage/jsonbin-storage";
import { Lembrete } from "@/types/lembrete";
import { randomUUID } from "crypto";

export async function createLembrete(texto: string) {
  const lembretes = await loadFromJsonBin();

  const novo: Lembrete = {
    id: randomUUID(),
    texto,
    concluido: false,
    criadoEm: new Date(),
  };

  const atualizados = [novo, ...lembretes];

  await updateJsonBin(atualizados);

  return novo;
}

export async function updateLembrete(id: string, data: Partial<Lembrete>) {
  const lembretes = await loadFromJsonBin();

  const atualizados = lembretes.map((l) =>
    l.id === id ? { ...l, ...data } : l
  );

  await updateJsonBin(atualizados);

  return atualizados.find((l) => l.id === id);
}

export async function deleteLembrete(id: string) {
  const lembretes = await loadFromJsonBin();

  const atualizados = lembretes.filter((l) => l.id !== id);

  await updateJsonBin(atualizados);

  return true;
}
