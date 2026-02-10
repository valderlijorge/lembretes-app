import { Lembrete } from "@/types/lembrete";
import {
  saveToJsonBin,
  loadFromJsonBin,
  isJsonBinAvailable,
} from "./jsonbin-storage";

export type StorageType = "localStorage" | "jsonbin";

export interface StorageInfo {
  type: StorageType;
  available: boolean;
  itemCount: number;
  lastSync?: Date;
}

class StorageService {
  private storageType: StorageType = "localStorage";
  private migrationCompleted = false;
  private binId: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Verificar se JSONBin está disponível e se estamos no browser
    const jsonBinAvailable = isJsonBinAvailable();
    const isBrowser = typeof window !== "undefined";

    if (jsonBinAvailable && isBrowser) {
      this.storageType = "jsonbin";
      console.log("Using JSONBin cloud storage");

      // Try to load existing bin ID
      this.binId = localStorage.getItem("jsonBinId");
    } else {
      this.storageType = "localStorage";
      console.log("Using localStorage storage");
    }

    // Carregar dados iniciais apenas no browser
    if (isBrowser) {
      await this.loadInitialData();
    }
  }

  private async loadInitialData(): Promise<void> {
    try {
      const lembretes = await this.getLembretes();
      console.log(
        `Loaded ${lembretes.length} lembretes from ${this.storageType}`
      );
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  }

  private getFromLocalStorage(): Lembrete[] {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === "undefined") {
        console.warn("localStorage accessed in server-side context");
        return [];
      }

      const data = localStorage.getItem("lembretes");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(lembretes: Lembrete[]): void {
    try {
      // Check if localStorage is available (client-side only)
      if (typeof window === "undefined") {
        console.warn("localStorage accessed in server-side context");
        return;
      }

      localStorage.setItem("lembretes", JSON.stringify(lembretes));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  async getLembretes(): Promise<Lembrete[]> {
    switch (this.storageType) {
case "jsonbin":
        // Always fetch from API to ensure we have latest data
        const data = await loadFromJsonBin(this.binId || undefined);
        return data || [];
      
      case "localStorage":
        return this.getFromLocalStorage();

      default:
        return this.getFromLocalStorage();
    }
  }

  async createLembrete(lembreteData: Omit<Lembrete, "id">): Promise<Lembrete> {
    const lembrete = {
      ...lembreteData,
      id: crypto.randomUUID(),
    };

    switch (this.storageType) {
      case "jsonbin":
        // Carregar dados atuais
        const current = await this.getLembretes();
        const updated = [lembrete, ...current];

        // Salvar no JSONBin
        const result = await saveToJsonBin(updated);
        if (result) {
          this.binId = result.id;
          localStorage.setItem("jsonBinId", result.id);
          return lembrete;
        } else {
          throw new Error("Failed to save to JSONBin");
        }

      case "localStorage":
        const localCurrent = this.getFromLocalStorage();
        const localUpdated = [lembrete, ...localCurrent];
        this.saveToLocalStorage(localUpdated);
        return lembrete;

      default:
        const fallbackCurrent = this.getFromLocalStorage();
        const fallbackUpdated = [lembrete, ...fallbackCurrent];
        this.saveToLocalStorage(fallbackUpdated);
        return lembrete;
    }
  }

  async updateLembrete(
    id: string,
    updates: Partial<Pick<Lembrete, "texto" | "concluido" | "concluidoEm">>
  ): Promise<Lembrete | null> {
    switch (this.storageType) {
      case "jsonbin":
        // Carregar dados atuais
        const current = await this.getLembretes();
        const index = current.findIndex((l: Lembrete) => l.id === id);

        if (index === -1) {
          return null;
        }

        // Atualizar lembrete
        current[index] = { ...current[index], ...updates };

        // Salvar no JSONBin
        const result = await saveToJsonBin(current);
        if (result) {
          console.log("Updated to JSONBin:", result.id);
          return current[index];
        } else {
          throw new Error("Failed to update JSONBin");
        }

      case "localStorage":
        const localCurrent = this.getFromLocalStorage();
        const localIndex = localCurrent.findIndex((l: Lembrete) => l.id === id);

        if (localIndex === -1) {
          return null;
        }

        localCurrent[localIndex] = { ...localCurrent[localIndex], ...updates };
        this.saveToLocalStorage(localCurrent);
        return localCurrent[localIndex];

      default:
        const fallbackCurrent = this.getFromLocalStorage();
        const fallbackIndex = fallbackCurrent.findIndex(
          (l: Lembrete) => l.id === id
        );

        if (fallbackIndex === -1) {
          return null;
        }

        fallbackCurrent[fallbackIndex] = {
          ...fallbackCurrent[fallbackIndex],
          ...updates,
        };
        this.saveToLocalStorage(fallbackCurrent);
        return fallbackCurrent[fallbackIndex];
    }
  }

  async deleteLembrete(id: string): Promise<boolean> {
    switch (this.storageType) {
      case "jsonbin":
        // Carregar dados atuais
        const current = await this.getLembretes();
        const filtered = current.filter((l: Lembrete) => l.id !== id);
        const wasDeleted = filtered.length < current.length;

        if (wasDeleted) {
          // Salvar no JSONBin
          const result = await saveToJsonBin(filtered);
          if (result) {
            console.log("Deleted from JSONBin:", result.id);
            return true;
          } else {
            throw new Error("Failed to delete from JSONBin");
          }
        }

        return false;

      case "localStorage":
        const localCurrent = this.getFromLocalStorage();
        const localFiltered = localCurrent.filter((l: Lembrete) => l.id !== id);
        const localWasDeleted = localFiltered.length < localCurrent.length;

        if (localWasDeleted) {
          this.saveToLocalStorage(localFiltered);
        }

        return localWasDeleted;

      default:
        const fallbackCurrent = this.getFromLocalStorage();
        const fallbackFiltered = fallbackCurrent.filter(
          (l: Lembrete) => l.id !== id
        );
        const fallbackWasDeleted =
          fallbackFiltered.length < fallbackCurrent.length;

        if (fallbackWasDeleted) {
          this.saveToLocalStorage(fallbackFiltered);
        }

        return fallbackWasDeleted;
    }
  }

  async exportData(): Promise<string> {
    const lembretes = await this.getLembretes();

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      storageType: this.storageType,
      count: lembretes.length,
      data: lembretes,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importData(
    jsonData: string
  ): Promise<{ success: boolean; imported: number; message: string }> {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.data || !Array.isArray(importData.data)) {
        return {
          success: false,
          imported: 0,
          message: "Formato de dados inválido",
        };
      }

      const lembretes = importData.data as Lembrete[];

      // Validar estrutura dos dados
      const validLembretes = lembretes.filter(
        (lembrete) =>
          lembrete.id &&
          typeof lembrete.texto === "string" &&
          typeof lembrete.concluido === "boolean"
      );

      if (validLembretes.length !== lembretes.length) {
        return {
          success: false,
          imported: 0,
          message: `${
            lembretes.length - validLembretes.length
          } lembretes inválidos encontrados`,
        };
      }

      // Importar novos dados
      switch (this.storageType) {
        case "jsonbin":
          const result = await saveToJsonBin(validLembretes);
          if (result) {
            this.binId = result.id;
            localStorage.setItem("jsonBinId", result.id);
            return {
              success: true,
              imported: validLembretes.length,
              message: `${validLembretes.length} lembretes importados com sucesso (JSONBin: ${result.id})`,
            };
          } else {
            return {
              success: false,
              imported: 0,
              message: "Erro ao salvar no JSONBin",
            };
          }

        default:
          this.saveToLocalStorage(validLembretes);
          return {
            success: true,
            imported: validLembretes.length,
            message: `${validLembretes.length} lembretes importados com sucesso (localStorage)`,
          };
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        message: `Erro ao importar dados: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      };
    }
  }

  async clearAllData(): Promise<void> {
    switch (this.storageType) {
      case "jsonbin":
        const result = await saveToJsonBin([]);
        if (result) {
          this.binId = result.id;
          localStorage.setItem("jsonBinId", result.id);
          console.log("Cleared JSONBin:", result.id);
        }
        break;

      case "localStorage":
        this.saveToLocalStorage([]);
        break;

      default:
        this.saveToLocalStorage([]);
        break;
    }
  }

  getStorageInfo(): {
    type: StorageType;
    available: boolean;
    itemCount: number;
  } {
    let itemCount = 0;
    let available = true;

    try {
      if (this.storageType === "jsonbin") {
        available = isJsonBinAvailable();
        if (available) {
          // Use synchronous check to avoid await in non-async
          const data = localStorage.getItem("jsonBinData") || "[]";
          const parsed = JSON.parse(data);
          itemCount = Array.isArray(parsed) ? parsed.length : 0;
        }
      } else {
        itemCount = this.getFromLocalStorage().length;
      }
    } catch {
      available = false;
    }

    return {
      type: this.storageType,
      available,
      itemCount,
    };
  }
}

// Singleton instance
export const storageService = new StorageService();
