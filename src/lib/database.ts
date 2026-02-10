import { Lembrete } from '@/types/lembrete';

// In-memory database fallback for browser environments
class InMemoryDatabase {
  private lembretes: Lembrete[] = [];

  create(lembrete: Omit<Lembrete, 'id'> & { id?: string }): Lembrete {
    const id = lembrete.id || crypto.randomUUID();
    const novoLembrete: Lembrete = {
      ...lembrete,
      id,
    };
    
    // Check for duplicates
    const existingIndex = this.lembretes.findIndex(l => l.id === id);
    if (existingIndex >= 0) {
      this.lembretes[existingIndex] = novoLembrete;
    } else {
      this.lembretes.unshift(novoLembrete);
    }
    
    return novoLembrete;
  }

  getAll(): Lembrete[] {
    return [...this.lembretes];
  }

  update(id: string, updates: Partial<Pick<Lembrete, 'texto' | 'concluido' | 'concluidoEm'>>): Lembrete | null {
    const index = this.lembretes.findIndex(l => l.id === id);
    if (index === -1) {
      return null;
    }
    
    this.lembretes[index] = { ...this.lembretes[index], ...updates };
    return this.lembretes[index];
  }

  delete(id: string): boolean {
    const index = this.lembretes.findIndex(l => l.id === id);
    if (index === -1) {
      return false;
    }
    
    this.lembretes.splice(index, 1);
    return true;
  }

  findById(id: string): Lembrete | null {
    return this.lembretes.find(l => l.id === id) || null;
  }

  bulkInsert(items: Lembrete[]): void {
    // Clear existing and insert new items
    this.lembretes = [...items];
  }

  clear(): void {
    this.lembretes = [];
  }
}

let db: InMemoryDatabase | null = null;

export function initializeDatabase(): InMemoryDatabase {
  if (db) {
    return db;
  }

  try {
    // For browser/Netlify environments, use in-memory database
    db = new InMemoryDatabase();
    console.log('In-memory database initialized successfully');
    return db;
  } catch (error) {
    console.warn('Database initialization failed:', error);
    throw error;
  }
}

export function closeDatabase(): void {
  db = null;
}

// CRUD Operations
export function createLembrete(lembrete: Omit<Lembrete, 'id'> & { id?: string }): Lembrete {
  const database = initializeDatabase();
  return database.create(lembrete);
}

export function getAllLembretes(): Lembrete[] {
  const database = initializeDatabase();
  return database.getAll();
}

export function updateLembrete(id: string, updates: Partial<Pick<Lembrete, 'texto' | 'concluido' | 'concluidoEm'>>): Lembrete | null {
  const database = initializeDatabase();
  return database.update(id, updates);
}

export function deleteLembrete(id: string): boolean {
  const database = initializeDatabase();
  return database.delete(id);
}

export function getLembreteById(id: string): Lembrete | null {
  const database = initializeDatabase();
  return database.findById(id);
}

export function bulkInsertLembretes(lembretes: Lembrete[]): void {
  const database = initializeDatabase();
  database.bulkInsert(lembretes);
}

export function isDatabaseAvailable(): boolean {
  try {
    initializeDatabase();
    return true;
  } catch {
    return false;
  }
}