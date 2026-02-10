import { getStore } from '@netlify/blobs';

// Initialize Netlify Blobs store with fallback for development
let store: ReturnType<typeof getStore> | null = null;

try {
  store = getStore('lembretes-app');
} catch (error) {
  console.warn('Netlify Blobs not available in development, using fallback');
  store = null;
}

export interface NetlifyStorageResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper functions for Netlify Blobs
export async function saveToNetlify(key: string, data: any): Promise<NetlifyStorageResult> {
  if (!store) {
    return { success: false, error: 'Netlify Blobs not available' };
  }
  
  try {
    await store.set(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error('Error saving to Netlify Blobs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function loadFromNetlify(key: string): Promise<NetlifyStorageResult> {
  if (!store) {
    return { success: false, error: 'Netlify Blobs not available' };
  }
  
  try {
    const result = await store.get(key);
    
    if (result === null) {
      return { success: true, data: null };
    }
    
    // Parse the data - it might already be an object if it was stored as such
    let parsedData = result;
    if (typeof result === 'string') {
      try {
        parsedData = JSON.parse(result);
      } catch (parseError) {
        console.warn('Failed to parse stored data:', parseError);
        return { success: false, error: 'Failed to parse stored data' };
      }
    }
    
    return { success: true, data: parsedData };
  } catch (error) {
    console.error('Error loading from Netlify Blobs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function deleteFromNetlify(key: string): Promise<NetlifyStorageResult> {
  if (!store) {
    return { success: false, error: 'Netlify Blobs not available' };
  }
  
  try {
    await store.delete(key);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Netlify Blobs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function existsInNetlify(key: string): Promise<boolean> {
  if (!store) {
    return false;
  }
  
  try {
    const result = await store.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking existence in Netlify Blobs:', error);
    return false;
  }
}

// Check if Netlify Blobs is available
export function isNetlifyBlobsAvailable(): boolean {
  try {
    // Check if we have store available
    return store !== null;
  } catch {
    return false;
  }
}