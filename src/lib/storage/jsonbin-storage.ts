import "server-only";
import { Lembrete } from "@/types/lembrete";

const JSONBIN_API = "https://api.jsonbin.io/v3/b";

interface JsonBinResponse<T> {
  record: T;
}

interface LembretesRecord {
  lembretes: Lembrete[];
}

export async function loadFromJsonBin(): Promise<Lembrete[]> {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  const binId = process.env.JSONBIN_BIN_ID;

  if (!masterKey || !binId) {
    throw new Error("JSONBin não configurado corretamente");
  }

  const response = await fetch(`${JSONBIN_API}/${binId}/latest`, {
    headers: {
      "X-Master-Key": masterKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar dados do JSONBin");
  }

  const result: JsonBinResponse<LembretesRecord> = await response.json();

  return result.record?.lembretes ?? [];
}

export async function updateJsonBin(lembretes: Lembrete[]): Promise<void> {
  const masterKey = process.env.JSONBIN_MASTER_KEY;
  const binId = process.env.JSONBIN_BIN_ID;

  if (!masterKey || !binId) {
    throw new Error("JSONBin não configurado corretamente");
  }

  const payload: LembretesRecord = {
    lembretes,
  };

  const response = await fetch(`${JSONBIN_API}/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`JSONBin error (${response.status}): ${errorText}`);
  }
}
