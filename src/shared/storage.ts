// IndexedDB storage manager for FormHelper

import { ClipboardData, SavedRecord, DefaultValue, UserPreferences } from './types';

const DB_NAME = 'FormHelperDB';
const DB_VERSION = 1;

class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Clipboards store
        if (!db.objectStoreNames.contains('clipboards')) {
          const clipboardStore = db.createObjectStore('clipboards', { keyPath: 'id' });
          clipboardStore.createIndex('timestamp', 'timestamp', { unique: false });
          clipboardStore.createIndex('sourceUrl', 'sourceUrl', { unique: false });
        }

        // Saved records store
        if (!db.objectStoreNames.contains('savedRecords')) {
          const recordsStore = db.createObjectStore('savedRecords', { keyPath: 'id' });
          recordsStore.createIndex('identifier', 'identifier', { unique: false });
          recordsStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }

        // Default values store
        if (!db.objectStoreNames.contains('defaultValues')) {
          db.createObjectStore('defaultValues', { keyPath: 'fieldSemanticType' });
        }

        // User preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'userId' });
        }
      };
    });
  }

  async saveClipboard(data: ClipboardData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clipboards'], 'readwrite');
      const store = transaction.objectStore('clipboards');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCurrentClipboard(): Promise<ClipboardData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clipboards'], 'readonly');
      const store = transaction.objectStore('clipboards');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearClipboard(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clipboards'], 'readwrite');
      const store = transaction.objectStore('clipboards');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveRecord(record: SavedRecord): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['savedRecords'], 'readwrite');
      const store = transaction.objectStore('savedRecords');
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async searchRecords(identifier: string): Promise<SavedRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['savedRecords'], 'readonly');
      const store = transaction.objectStore('savedRecords');
      const index = store.index('identifier');
      const request = index.getAll(IDBKeyRange.only(identifier));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDefaultValue(fieldType: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['defaultValues'], 'readonly');
      const store = transaction.objectStore('defaultValues');
      const request = store.get(fieldType);

      request.onsuccess = () => {
        const result = request.result as DefaultValue | undefined;
        resolve(result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setDefaultValue(fieldType: string, value: any, userId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['defaultValues'], 'readwrite');
      const store = transaction.objectStore('defaultValues');
      const defaultValue: DefaultValue = { fieldSemanticType: fieldType, value, userId };
      const request = store.put(defaultValue);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userPreferences'], 'readonly');
      const store = transaction.objectStore('userPreferences');
      const request = store.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userPreferences'], 'readwrite');
      const store = transaction.objectStore('userPreferences');
      const request = store.put({ userId, ...preferences });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageManager = new StorageManager();
