// IndexedDB helper for caching data locally
const DB_NAME = 'parkent_market';
const DB_VERSION = 1;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores for different data types
      if (!db.objectStoreNames.contains('listings')) {
        db.createObjectStore('listings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
};

export const cacheSet = async <T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    
    const entry: CacheEntry<T> & { key: string } = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB cache set failed:', error);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry = request.result as (CacheEntry<T> & { key: string }) | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        
        // Check if expired
        if (Date.now() > entry.expiresAt) {
          // Delete expired entry
          const deleteTx = db.transaction('cache', 'readwrite');
          deleteTx.objectStore('cache').delete(key);
          resolve(null);
          return;
        }
        
        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB cache get failed:', error);
    return null;
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.delete(key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB cache delete failed:', error);
  }
};

export const cacheClear = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB cache clear failed:', error);
  }
};

// Bulk operations for listings
export const cacheListings = async (listings: unknown[]): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction('listings', 'readwrite');
    const store = tx.objectStore('listings');
    
    for (const listing of listings) {
      store.put(listing);
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB listings cache failed:', error);
  }
};

export const getCachedListings = async (): Promise<unknown[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction('listings', 'readonly');
    const store = tx.objectStore('listings');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB get listings failed:', error);
    return [];
  }
};

// Categories cache
export const cacheCategories = async (categories: unknown[]): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction('categories', 'readwrite');
    const store = tx.objectStore('categories');
    
    store.clear();
    for (const category of categories) {
      store.put(category);
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('IndexedDB categories cache failed:', error);
  }
};

export const getCachedCategories = async (): Promise<unknown[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction('categories', 'readonly');
    const store = tx.objectStore('categories');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB get categories failed:', error);
    return [];
  }
};
