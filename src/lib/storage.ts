import { Lembrete } from '@/types/lembrete';
import { 
  isDatabaseAvailable, 
  getAllLembretes, 
  createLembrete, 
  updateLembrete, 
  deleteLembrete as deleteLembreteFromDB,
  bulkInsertLembretes 
} from './database';

export type StorageType = 'localStorage' | 'sqlite' | 'hybrid';

export interface StorageInfo {
  type: StorageType;
  available: boolean;
  itemCount: number;
  lastSync?: Date;
}

class StorageService {
  private storageType: StorageType = 'localStorage';
  private syncEnabled = true;
  private migrationCompleted = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Verificar se SQLite está disponível
    const sqliteAvailable = isDatabaseAvailable();
    
    if (sqliteAvailable) {
      this.storageType = 'sqlite';
      console.log('Using SQLite storage');
    } else {
      this.storageType = 'localStorage';
      console.log('Using localStorage storage');
    }

    // Tentar migrar dados do localStorage se necessário
    await this.migrateFromLocalStorage();
  }

  private async migrateFromLocalStorage(): Promise<void> {
    if (this.migrationCompleted || this.storageType !== 'sqlite') {
      return;
    }

    try {
      const localStorageData = this.getFromLocalStorage();
      
      if (localStorageData.length > 0) {
        console.log(`Migrating ${localStorageData.length} items from localStorage to SQLite`);
        bulkInsertLembretes(localStorageData);
        
        // Limpar localStorage após migração bem-sucedida
        localStorage.removeItem('lembretes');
        console.log('Migration completed successfully');
      }
    } catch (error) {
      console.warn('Migration failed, keeping localStorage data:', error);
      this.storageType = 'localStorage';
    }
    
    this.migrationCompleted = true;
  }

  private getFromLocalStorage(): Lembrete[] {
    try {
      const data = localStorage.getItem('lembretes');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(lembretes: Lembrete[]): void {
    try {
      localStorage.setItem('lembretes', JSON.stringify(lembretes));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  async getLembretes(): Promise<Lembrete[]> {
    switch (this.storageType) {
      case 'sqlite':
        return getAllLembretes();
      
      case 'localStorage':
        return this.getFromLocalStorage();
      
      default:
        return this.getFromLocalStorage();
    }
  }

  async createLembrete(lembreteData: Omit<Lembrete, 'id'>): Promise<Lembrete> {
    const lembrete = {
      ...lembreteData,
      id: crypto.randomUUID(),
    };

    switch (this.storageType) {
      case 'sqlite':
        return createLembrete(lembrete);
      
      case 'localStorage':
        const current = this.getFromLocalStorage();
        const updated = [lembrete, ...current];
        this.saveToLocalStorage(updated);
        return lembrete;
      
      default:
        const localCurrent = this.getFromLocalStorage();
        const localUpdated = [lembrete, ...localCurrent];
        this.saveToLocalStorage(localUpdated);
        return lembrete;
    }
  }

  async updateLembrete(id: string, updates: Partial<Pick<Lembrete, 'texto' | 'concluido' | 'concluidoEm'>>): Promise<Lembrete | null> {
    switch (this.storageType) {
      case 'sqlite':
        return updateLembrete(id, updates);
      
      case 'localStorage':
        const current = this.getFromLocalStorage();
        const index = current.findIndex(l => l.id === id);
        
        if (index === -1) {
          return null;
        }
        
        current[index] = { ...current[index], ...updates };
        this.saveToLocalStorage(current);
        return current[index];
      
      default:
        const localCurrent = this.getFromLocalStorage();
        const localIndex = localCurrent.findIndex(l => l.id === id);
        
        if (localIndex === -1) {
          return null;
        }
        
        localCurrent[localIndex] = { ...localCurrent[localIndex], ...updates };
        this.saveToLocalStorage(localCurrent);
        return localCurrent[localIndex];
    }
  }

  async deleteLembrete(id: string): Promise<boolean> {
    switch (this.storageType) {
      case 'sqlite':
        return deleteLembreteFromDB(id);
      
      case 'localStorage':
        const current = this.getFromLocalStorage();
        const filtered = current.filter(l => l.id !== id);
        const wasDeleted = filtered.length < current.length;
        
        if (wasDeleted) {
          this.saveToLocalStorage(filtered);
        }
        
        return wasDeleted;
      
      default:
        const localCurrent = this.getFromLocalStorage();
        const localFiltered = localCurrent.filter(l => l.id !== id);
        const localWasDeleted = localFiltered.length < localCurrent.length;
        
        if (localWasDeleted) {
          this.saveToLocalStorage(localFiltered);
        }
        
        return localWasDeleted;
    }
  }

  async exportData(): Promise<string> {
    const lembretes = await this.getLembretes();
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      storageType: this.storageType,
      count: lembretes.length,
      data: lembretes,
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<{ success: boolean; imported: number; message: string }> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.data || !Array.isArray(importData.data)) {
        return { success: false, imported: 0, message: 'Formato de dados inválido' };
      }
      
      const lembretes = importData.data as Lembrete[];
      
      // Validar estrutura dos dados
      const validLembretes = lembretes.filter(lembrete => 
        lembrete.id && 
        typeof lembrete.texto === 'string' && 
        typeof lembrete.concluido === 'boolean'
      );
      
      if (validLembretes.length !== lembretes.length) {
        return { 
          success: false, 
          imported: 0, 
          message: `${lembretes.length - validLembretes.length} lembretes inválidos encontrados` 
        };
      }
      
      // Limpar dados atuais
      await this.clearAllData();
      
      // Importar novos dados
      if (this.storageType === 'sqlite') {
        bulkInsertLembretes(validLembretes);
      } else {
        this.saveToLocalStorage(validLembretes);
      }
      
      return { 
        success: true, 
        imported: validLembretes.length, 
        message: `${validLembretes.length} lembretes importados com sucesso` 
      };
    } catch (error) {
      return { 
        success: false, 
        imported: 0, 
        message: `Erro ao importar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }

  async clearAllData(): Promise<void> {
    switch (this.storageType) {
      case 'sqlite':
        // SQLite não tem TRUNCATE, então precisamos deletar um por um
        const allLembretes = getAllLembretes();
        for (const lembrete of allLembretes) {
          await this.deleteLembrete(lembrete.id);
        }
        break;
      
      case 'localStorage':
        localStorage.removeItem('lembretes');
        break;
      
      default:
        localStorage.removeItem('lembretes');
        break;
    }
  }

  getStorageInfo(): StorageInfo {
    let itemCount = 0;
    let available = true;
    
    try {
      if (this.storageType === 'sqlite') {
        itemCount = getAllLembretes().length;
        available = isDatabaseAvailable();
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

  // Método para forçar backup no localStorage (se estiver usando SQLite)
  async createBackup(): Promise<void> {
    if (this.storageType === 'sqlite') {
      try {
        const lembretes = await this.getLembretes();
        this.saveToLocalStorage(lembretes);
        console.log('Backup created in localStorage');
      } catch (error) {
        console.warn('Failed to create backup:', error);
      }
    }
  }
}

// Singleton instance
export const storageService = new StorageService();