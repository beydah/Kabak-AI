import { I_Product_Data, I_Error_Log, I_Metric } from '../types/interfaces';

const DB_NAME = 'KabakAI_DB';
const DB_VERSION = 5;
const STORE_PRODUCTS = 'products';
const STORE_LOGS = 'error_logs';
const STORE_METRICS = 'metrics';
const STORE_DRAFTS = 'drafts';
const STORE_SETTINGS = 'settings';

class StorageService {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
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
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
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
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getDraft<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async deleteDraft(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearDrafts(): Promise<void> {
    await this.clear(STORE_DRAFTS);
  }

  async saveStartDefaults(defaults: unknown): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put(defaults, 'new_product_defaults');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStartDefaults<T>(): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('new_product_defaults');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async migrateFromLocalStorage(): Promise<void> {
    const raw_products = localStorage.getItem('kabak_ai_products');
    if (raw_products) {
      try {
        const products: I_Product_Data[] = JSON.parse(raw_products);
        if (Array.isArray(products) && products.length > 0) {
          for (const p of products) {
            await this.saveProduct(p);
          }
          localStorage.removeItem('kabak_ai_products');
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
          localStorage.removeItem('kabak_ai_error_logs');
        }
      } catch (e) {
        console.error('[Migration] Failed to migrate logs:', e);
      }
    }
  }
}

export const DB_Service = new StorageService();
