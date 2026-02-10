import { Lembrete } from '@/types/lembrete';
import { 
  saveToNetlify, 
  loadFromNetlify, 
  deleteFromNetlify, 
  isNetlifyBlobsAvailable 
} from './netlify-storage';

export type StorageType = 'localStorage' | 'netlify' | 'hybrid';

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
    // Verificar se Netlify Blobs está disponível
    const netlifyAvailable = isNetlifyBlobsAvailable();
    
    if (netlifyAvailable) {
      this.storageType = 'netlify';
      console.log('Using Netlify Blobs storage');
    } else {
      this.storageType = 'localStorage';
      console.log('Using localStorage storage');
    }

    // Tentar migrar dados do localStorage se necessário
    await this.migrateFromLocalStorage();
  }

  private async migrateFromLocalStorage(): Promise<void> {
    if (this.migrationCompleted || this.storageType !== 'netlify') {
      return;
    }

    try {
      const localStorageData = this.getFromLocalStorage();
      
      if (localStorageData.length > 0) {
        console.log(`Migrating ${localStorageData.length} items from localStorage to Netlify Blobs`);
        
        // Salvar no Netlify
        await saveToNetlify('lembretes', localStorageData);
        
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
      case 'netlify':
        const result = await loadFromNetlify('lembretes');
        return result.success ? (result.data || []) : [];
      
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
      case 'netlify':
        // Primeiro carregar dados existentes
        const getCurrentResult = await loadFromNetlify('lembretes');
        const current = getCurrentResult.success ? (getCurrentResult.data || []) : [];
        
        // Adicionar novo lembrete
        const updated = [lembrete, ...current];
        
        // Salvar no Netlify
        await saveToNetlify('lembretes', updated);
        return lembrete;
      
      case 'localStorage':
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

  async updateLembrete(id: string, updates: Partial<Pick<Lembrete, 'texto' | 'concluido' | 'concluidoEm'>>): Promise<Lembrete | null> {
    switch (this.storageType) {
      case 'netlify':
        // Carregar dados atuais
        const getResult = await loadFromNetlify('lembretes');
        if (!getResult.success) {
          return null;
        }
        
        const current = getResult.data || [];
        const index = current.findIndex((l: Lembrete) => l.id === id);
        
        if (index === -1) {
          return null;
        }
        
        // Atualizar lembrete
        current[index] = { ...current[index], ...updates };
        
        // Salvar no Netlify
        await saveToNetlify('lembretes', current);
        return current[index];
      
      case 'localStorage':
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
        const fallbackIndex = fallbackCurrent.findIndex((l: Lembrete) => l.id === id);
        
        if (fallbackIndex === -1) {
          return null;
        }
        
        fallbackCurrent[fallbackIndex] = { ...fallbackCurrent[fallbackIndex], ...updates };
        this.saveToLocalStorage(fallbackCurrent);
        return fallbackCurrent[fallbackIndex];
    }
  }

  async deleteLembrete(id: string): Promise<boolean> {
    switch (this.storageType) {
      case 'netlify':
        // Carregar dados atuais
        const getResult = await loadFromNetlify('lembretes');
        if (!getResult.success) {
          return false;
        }
        
        const current = getResult.data || [];
        const filtered = current.filter((l: Lembrete) => l.id !== id);
        const wasDeleted = filtered.length < current.length;
        
        if (wasDeleted) {
          // Salvar no Netlify
          await saveToNetlify('lembretes', filtered);
        }
        
        return wasDeleted;
      
      case 'localStorage':
        const localCurrent = this.getFromLocalStorage();
        const localFiltered = localCurrent.filter(l => l.id !== id);
        const localWasDeleted = localFiltered.length < localCurrent.length;
        
        if (localWasDeleted) {
          this.saveToLocalStorage(localFiltered);
        }
        
        return localWasDeleted;
      
      default:
        const fallbackCurrent = this.getFromLocalStorage();
        const fallbackFiltered = fallbackCurrent.filter(l => l.id !== id);
        const fallbackWasDeleted = fallbackFiltered.length < fallbackCurrent.length;
        
        if (fallbackWasDeleted) {
          this.saveToLocalStorage(fallbackFiltered);
        }
        
        return fallbackWasDeleted;
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
      if (this.storageType === 'netlify') {
        await saveToNetlify('lembretes', validLembretes);
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
      case 'netlify':
        await deleteFromNetlify('lembretes');
        break;
      
      case 'localStorage':
        localStorage.removeItem('lembretes');
        break;
      
      default:
        localStorage.removeItem('lembretes');
        break;
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    let itemCount = 0;
    let available = true;
    
    try {
      if (this.storageType === 'netlify') {
        available = isNetlifyBlobsAvailable();
        if (available) {
          const result = await loadFromNetlify('lembretes');
          itemCount = result.success && result.data ? result.data.length : 0;
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

  // Método para forçar backup no localStorage (se estiver usando Netlify)
  async createBackup(): Promise<void> {
    if (this.storageType === 'netlify') {
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