import { I_Product_Data, I_Error_Log, I_Metric } from '../types/interfaces';

const DB_NAME = 'KabakAI_DB';
const DB_VERSION = 6;
const STORE_PRODUCTS = 'products';
const STORE_LOGS = 'error_logs';
const STORE_METRICS = 'metrics';
const STORE_DRAFTS = 'drafts';
const STORE_SETTINGS = 'settings';
const STORE_VIDEO_ASSETS = 'video_assets';

const LOCAL_STORAGE_KEYS: Record<string, string> = {
  [STORE_PRODUCTS]: 'kabak_ai_products',
  [STORE_LOGS]: 'kabak_ai_error_logs',
  [STORE_METRICS]: 'kabak_ai_metrics',
  [STORE_DRAFTS]: 'kabak_ai_drafts',
  [STORE_SETTINGS]: 'kabak_ai_settings',
  [STORE_VIDEO_ASSETS]: 'kabak_ai_video_assets'
};

const STORE_KEY_FIELDS: Record<string, string> = {
  [STORE_PRODUCTS]: 'product_id',
  [STORE_LOGS]: 'id',
  [STORE_METRICS]: 'model_id',
  [STORE_VIDEO_ASSETS]: 'product_id'
};

class StorageService {
  private db: IDBDatabase | null = null;
  private useLocalFallback = false;

  private isIndexedDBAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private enableLocalFallback(reason?: unknown) {
    if (!this.useLocalFallback) {
      console.warn('[Storage] IndexedDB unavailable. Falling back to localStorage.', reason);
    }
    this.useLocalFallback = true;
  }

  private getLocalRaw(storeName: string): unknown {
    const key = LOCAL_STORAGE_KEYS[storeName];
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private setLocalRaw(storeName: string, value: unknown) {
    const key = LOCAL_STORAGE_KEYS[storeName];
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  private getLocalArray<T>(storeName: string): T[] {
    const data = this.getLocalRaw(storeName);
    return Array.isArray(data) ? data as T[] : [];
  }

  private setLocalArray<T>(storeName: string, items: T[]) {
    this.setLocalRaw(storeName, items);
  }

  private getLocalMap<T>(storeName: string): Record<string, T> {
    const data = this.getLocalRaw(storeName);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, T>;
    }
    return {};
  }

  private setLocalMap<T>(storeName: string, value: Record<string, T>) {
    this.setLocalRaw(storeName, value);
  }

  private getLocalById<T>(storeName: string, id: string): T | undefined {
    const keyField = STORE_KEY_FIELDS[storeName];
    if (!keyField) return undefined;
    const items = this.getLocalArray<T>(storeName);
    return items.find((item: any) => item && item[keyField] === id);
  }

  private putLocalItem<T>(storeName: string, item: T) {
    const keyField = STORE_KEY_FIELDS[storeName];
    if (!keyField) return;
    const items = this.getLocalArray<any>(storeName);
    const key = (item as any)[keyField];
    if (!key) return;
    const idx = items.findIndex((existing: any) => existing && existing[keyField] === key);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    this.setLocalArray(storeName, items);
  }

  private deleteLocalItem(storeName: string, id: string) {
    const keyField = STORE_KEY_FIELDS[storeName];
    if (!keyField) return;
    const items = this.getLocalArray<any>(storeName);
    const next = items.filter((item: any) => item && item[keyField] !== id);
    this.setLocalArray(storeName, next);
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.useLocalFallback || !this.isIndexedDBAvailable()) {
      this.enableLocalFallback('IndexedDB not supported');
      throw new Error('IndexedDB not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.enableLocalFallback(request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
          db.createObjectStore(STORE_PRODUCTS, { keyPath: 'product_id' });
        }
        if (!db.objectStoreNames.contains(STORE_LOGS)) {
          db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_METRICS)) {
          db.createObjectStore(STORE_METRICS, { keyPath: 'model_id' });
        }
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS);
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_VIDEO_ASSETS)) {
          db.createObjectStore(STORE_VIDEO_ASSETS, { keyPath: 'product_id' });
        }
      };
    });
  }

  async getMetric(model_id: string): Promise<I_Metric | undefined> {
    return this.getById<I_Metric>(STORE_METRICS, model_id);
  }

  async updateMetric(metric: I_Metric): Promise<void> {
    await this.put(STORE_METRICS, metric);
  }

  async getAllMetrics(): Promise<I_Metric[]> {
    return this.getAll(STORE_METRICS);
  }

  async deleteMetric(model_id: string): Promise<void> {
    await this.delete(STORE_METRICS, model_id);
  }

  async clearMetrics(): Promise<void> {
    await this.clear(STORE_METRICS);
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    if (this.useLocalFallback) {
      return this.getLocalArray<T>(storeName);
    }
    try {
      const db = await this.getDB();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      return this.getLocalArray<T>(storeName);
    }
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    if (this.useLocalFallback) {
      return this.getLocalById<T>(storeName, id);
    }
    try {
      const db = await this.getDB();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      return this.getLocalById<T>(storeName, id);
    }
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    if (this.useLocalFallback) {
      this.putLocalItem(storeName, item);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      this.putLocalItem(storeName, item);
    }
  }

  private async delete(storeName: string, id: string): Promise<void> {
    if (this.useLocalFallback) {
      this.deleteLocalItem(storeName, id);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      this.deleteLocalItem(storeName, id);
    }
  }

  private async clear(storeName: string): Promise<void> {
    if (this.useLocalFallback) {
      this.setLocalArray(storeName, []);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      this.setLocalArray(storeName, []);
    }
  }

  async getAllProducts(): Promise<I_Product_Data[]> {
    const items = await this.getAll<I_Product_Data>(STORE_PRODUCTS);
    return items.sort((a, b) => b.created_at - a.created_at);
  }

  async getProduct(id: string): Promise<I_Product_Data | undefined> {
    return this.getById<I_Product_Data>(STORE_PRODUCTS, id);
  }

  async saveProduct(product: Partial<I_Product_Data>): Promise<void> {
    const verifiedProduct = {
      ...product,
      product_id: product.product_id || crypto.randomUUID(),
      update_at: Date.now(),
    } as I_Product_Data;

    if (!verifiedProduct.product_id) {
      throw new Error('Critical: Failed to generate product_id');
    }

    await this.put(STORE_PRODUCTS, verifiedProduct);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.delete(STORE_PRODUCTS, id);
  }

  async saveVideoAsset(product_id: string, video_blob: Blob, source_uri?: string): Promise<void> {
    if (this.useLocalFallback) {
      this.putLocalItem(STORE_VIDEO_ASSETS, {
        product_id,
        source_uri,
        update_at: Date.now()
      });
      return;
    }
    try {
      await this.put(STORE_VIDEO_ASSETS, {
        product_id,
        video_blob,
        source_uri,
        update_at: Date.now()
      });
    } catch (error) {
      this.enableLocalFallback(error);
      this.putLocalItem(STORE_VIDEO_ASSETS, {
        product_id,
        source_uri,
        update_at: Date.now()
      });
    }
  }

  async getVideoAsset(product_id: string): Promise<{ product_id: string; video_blob: Blob; source_uri?: string; update_at: number } | undefined> {
    return this.getById<{ product_id: string; video_blob: Blob; source_uri?: string; update_at: number }>(STORE_VIDEO_ASSETS, product_id);
  }

  async deleteVideoAsset(product_id: string): Promise<void> {
    await this.delete(STORE_VIDEO_ASSETS, product_id);
  }

  async getAllLogs(): Promise<I_Error_Log[]> {
    const items = await this.getAll<I_Error_Log>(STORE_LOGS);
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }

  async addLog(log: I_Error_Log): Promise<void> {
    await this.put(STORE_LOGS, log);
  }

  async removeLog(id: string): Promise<void> {
    await this.delete(STORE_LOGS, id);
  }

  async clearLogs(): Promise<void> {
    await this.clear(STORE_LOGS);
  }

  async saveDraft(key: string, value: unknown): Promise<void> {
    if (this.useLocalFallback) {
      const drafts = this.getLocalMap<unknown>(STORE_DRAFTS);
      drafts[key] = value;
      this.setLocalMap(STORE_DRAFTS, drafts);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      const drafts = this.getLocalMap<unknown>(STORE_DRAFTS);
      drafts[key] = value;
      this.setLocalMap(STORE_DRAFTS, drafts);
    }
  }

  async getDraft<T>(key: string): Promise<T | null> {
    if (this.useLocalFallback) {
      const drafts = this.getLocalMap<T>(STORE_DRAFTS);
      return drafts[key] ?? null;
    }
    try {
      const db = await this.getDB();
      return await new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_DRAFTS, 'readonly');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      const drafts = this.getLocalMap<T>(STORE_DRAFTS);
      return drafts[key] ?? null;
    }
  }

  async deleteDraft(key: string): Promise<void> {
    if (this.useLocalFallback) {
      const drafts = this.getLocalMap<unknown>(STORE_DRAFTS);
      delete drafts[key];
      this.setLocalMap(STORE_DRAFTS, drafts);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      const drafts = this.getLocalMap<unknown>(STORE_DRAFTS);
      delete drafts[key];
      this.setLocalMap(STORE_DRAFTS, drafts);
    }
  }

  async clearDrafts(): Promise<void> {
    if (this.useLocalFallback) {
      this.setLocalMap(STORE_DRAFTS, {});
      return;
    }
    try {
      await this.clear(STORE_DRAFTS);
    } catch (error) {
      this.enableLocalFallback(error);
      this.setLocalMap(STORE_DRAFTS, {});
    }
  }

  async saveStartDefaults(defaults: unknown): Promise<void> {
    if (this.useLocalFallback) {
      const settings = this.getLocalMap<unknown>(STORE_SETTINGS);
      settings['new_product_defaults'] = defaults;
      this.setLocalMap(STORE_SETTINGS, settings);
      return;
    }
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.put(defaults, 'new_product_defaults');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      const settings = this.getLocalMap<unknown>(STORE_SETTINGS);
      settings['new_product_defaults'] = defaults;
      this.setLocalMap(STORE_SETTINGS, settings);
    }
  }

  async getStartDefaults<T>(): Promise<T | null> {
    if (this.useLocalFallback) {
      const settings = this.getLocalMap<T>(STORE_SETTINGS);
      return settings['new_product_defaults'] ?? null;
    }
    try {
      const db = await this.getDB();
      return await new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('new_product_defaults');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (error) {
      this.enableLocalFallback(error);
      const settings = this.getLocalMap<T>(STORE_SETTINGS);
      return settings['new_product_defaults'] ?? null;
    }
  }

  async migrateFromLocalStorage(): Promise<void> {
    if (!this.isIndexedDBAvailable() || this.useLocalFallback) {
      return;
    }
    const raw_products = localStorage.getItem('kabak_ai_products');
    if (raw_products) {
      try {
        const products: I_Product_Data[] = JSON.parse(raw_products);
        if (Array.isArray(products) && products.length > 0) {
          for (const p of products) {
            await this.saveProduct(p);
          }
          if (!this.useLocalFallback) {
            localStorage.removeItem('kabak_ai_products');
          }
        }
      } catch (e) {
        console.error('[Migration] Failed to migrate products:', e);
      }
    }

    const raw_logs = localStorage.getItem('kabak_ai_error_logs');
    if (raw_logs) {
      try {
        const logs: I_Error_Log[] = JSON.parse(raw_logs);
        if (Array.isArray(logs) && logs.length > 0) {
          for (const l of logs) {
            await this.addLog(l);
          }
          if (!this.useLocalFallback) {
            localStorage.removeItem('kabak_ai_error_logs');
          }
        }
      } catch (e) {
        console.error('[Migration] Failed to migrate logs:', e);
      }
    }
  }
}

export const DB_Service = new StorageService();
