const DB_NAME = 'transformers-cache-v1';
const STORE_NAME = 'models';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getCachedResponse = async (url: string): Promise<Response | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(url);
      request.onsuccess = () => {
        if (request.result) {
          console.log(`[CustomCache] Hit: ${url}`);
          // Reconstruct Response from stored Blob
          resolve(new Response(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('[CustomCache] Error reading cache', e);
    return null;
  }
};

const cacheResponse = async (url: string, response: Response) => {
  try {
    const db = await openDB();
    const blob = await response.clone().blob(); // Clone so we don't consume the original body
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, url);
    console.log(`[CustomCache] Saved: ${url}`);
  } catch (e) {
    console.warn('[CustomCache] Error saving to cache', e);
  }
};

export const setupCustomCache = () => {
  // Only run in environments with indexedDB (browser)
  if (typeof indexedDB === 'undefined') return;

  const originalFetch = self.fetch;
  self.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    // Only cache Hugging Face model files
    if (url.includes('huggingface.co') && (url.endsWith('.json') || url.endsWith('.onnx') || url.endsWith('.bin'))) {
      const cached = await getCachedResponse(url);
      if (cached) return cached;

      const response = await originalFetch(input, init);
      if (response.ok) {
        // Don't await the cache write, let it happen in background
        cacheResponse(url, response);
      }
      return response;
    }

    return originalFetch(input, init);
  };
};
