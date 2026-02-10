// JSONBin.io API wrapper - Simple cross-device storage
const JSONBIN_API = 'https://api.jsonbin.io/v3/b';

export interface JsonBinResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface JsonBinResult {
  id: string;
  url: string;
  accessKey: string;
}

// Helper to create or update a bin
export async function saveToJsonBin(data: any): Promise<JsonBinResult | null> {
  try {
    const response = await fetch(JSONBIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': process.env.NEXT_PUBLIC_JSONBIN_KEY || '$2b$10$FQJzSQiQKqBQ2C6VtP5Xm6sqhOaKOj7VVBuW$'
      },
      body: JSON.stringify({
        name: 'lembretes-app',
        data: JSON.stringify(data),
        versioning: false,
        customId: 'lembretes-app-data'
      })
    });

    if (!response.ok) {
      console.warn(`HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    return {
      id: result.metadata.id,
      url: result.metadata.url,
      accessKey: result.metadata.accessKey
    };
  } catch (error) {
    console.error('Error saving to JSONBin:', error);
    return null;
  }
}

// Helper to load from bin
export async function loadFromJsonBin(binId?: string): Promise<any | null> {
  try {
    const savedBinId = binId || localStorage.getItem('jsonBinId') || 'lembretes-app-data';
    
    const response = await fetch(`${JSONBIN_API}/${savedBinId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': process.env.NEXT_PUBLIC_JSONBIN_KEY || '$2b$10$FQJzSQiQKqBQ2C6VtP5Xm6sqhOaKOj7VVBuW$'
      }
    });

    if (!response.ok) {
      console.warn(`HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.warn('JSONBin error:', result.error);
      return null;
    }

    if (!binId && result.record) {
      localStorage.setItem('jsonBinId', savedBinId);
    }

    return result.record?.data || null;
  } catch (error) {
    console.error('Error loading from JSONBin:', error);
    return null;
  }
}

// Check if JSONBin service is available
export function isJsonBinAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_JSONBIN_KEY;
}