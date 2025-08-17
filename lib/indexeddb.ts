"use client";

export interface DocumentRecord {
  id?: number;
  path: string;
  name: string;
  content: string;
  sha: string;
  last_modified: string;
  created_at: string;
}

export interface ConfigRecord {
  id?: number;
  owner: string;
  repo: string;
  token: string;
  path: string;
  is_active: boolean;
  created_at: string;
}

const DB_NAME = "GitHubDocEditor";
const DB_VERSION = 1;
const DOCUMENTS_STORE = "documents";
const CONFIGS_STORE = "configs";

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("IndexedDB 只能在浏览器环境中使用");
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("无法打开 IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建文档存储
        if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
          const documentsStore = db.createObjectStore(DOCUMENTS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          documentsStore.createIndex("path", "path", { unique: true });
          documentsStore.createIndex("name", "name", { unique: false });
          documentsStore.createIndex("last_modified", "last_modified", {
            unique: false,
          });
        }

        // 创建配置存储
        if (!db.objectStoreNames.contains(CONFIGS_STORE)) {
          const configsStore = db.createObjectStore(CONFIGS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          configsStore.createIndex("is_active", "is_active", { unique: false });
          configsStore.createIndex("created_at", "created_at", {
            unique: false,
          });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("数据库未初始化，请先调用 init()");
    }
    return this.db;
  }

  // 文档操作
  async saveDocument(
    doc: Omit<DocumentRecord, "id" | "last_modified" | "created_at">
  ): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE], "readwrite");
      const store = transaction.objectStore(DOCUMENTS_STORE);

      // 先检查是否已存在相同路径的文档
      const index = store.index("path");
      const getRequest = index.get(doc.path);

              getRequest.onsuccess = () => {
          const existingDoc = getRequest.result;
          const docToSave: DocumentRecord = {
            ...doc,
            last_modified: new Date().toISOString(),
            created_at: existingDoc?.created_at || new Date().toISOString(),
          };

          if (existingDoc) {
            // 更新现有文档
            docToSave.id = existingDoc.id;
          }

          const saveRequest = store.put(docToSave);
          saveRequest.onsuccess = () => resolve();
          saveRequest.onerror = () => reject(new Error("保存文档失败"));
        };

      getRequest.onerror = () => reject(new Error("检查文档失败"));
    });
  }

  async getDocument(path: string): Promise<DocumentRecord | undefined> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE], "readonly");
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const index = store.index("path");
      const request = index.get(path);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("获取文档失败"));
    });
  }

  async getAllDocuments(): Promise<DocumentRecord[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE], "readonly");
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const index = store.index("last_modified");
      const request = index.getAll();

      request.onsuccess = () => {
        // 按最后修改时间倒序排列
        const results = request.result.sort(
          (a, b) =>
            new Date(b.last_modified).getTime() -
            new Date(a.last_modified).getTime()
        );
        resolve(results);
      };
      request.onerror = () => reject(new Error("获取文档列表失败"));
    });
  }

  async deleteDocument(path: string): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DOCUMENTS_STORE], "readwrite");
      const store = transaction.objectStore(DOCUMENTS_STORE);
      const index = store.index("path");

      const getRequest = index.get(path);
      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (doc) {
          const deleteRequest = store.delete(doc.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(new Error("删除文档失败"));
        } else {
          resolve(); // 文档不存在，视为删除成功
        }
      };
      getRequest.onerror = () => reject(new Error("查找文档失败"));
    });
  }

  async searchDocuments(query: string): Promise<DocumentRecord[]> {
    const allDocs = await this.getAllDocuments();
    const searchQuery = query.toLowerCase();

    return allDocs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchQuery) ||
        doc.content.toLowerCase().includes(searchQuery)
    );
  }

  // 配置操作
  async saveConfig(
    config: Omit<ConfigRecord, "id" | "created_at">
  ): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONFIGS_STORE], "readwrite");
      const store = transaction.objectStore(CONFIGS_STORE);

      // 先停用所有其他配置
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const allConfigs = getAllRequest.result;
        const updatePromises = allConfigs.map((cfg) => {
          return new Promise<void>((res, rej) => {
            const updateRequest = store.put({ ...cfg, is_active: false });
            updateRequest.onsuccess = () => res();
            updateRequest.onerror = () => rej();
          });
        });

        Promise.all(updatePromises)
          .then(() => {
            // 保存新配置
            const configToSave = {
              ...config,
              is_active: true,
              created_at: new Date().toISOString(),
            };

            const saveRequest = store.add(configToSave);
            saveRequest.onsuccess = () => resolve();
            saveRequest.onerror = () => reject(new Error("保存配置失败"));
          })
          .catch(() => reject(new Error("更新配置状态失败")));
      };
      getAllRequest.onerror = () => reject(new Error("获取配置列表失败"));
    });
  }

  async getActiveConfig(): Promise<ConfigRecord | undefined> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONFIGS_STORE], "readonly");
      const store = transaction.objectStore(CONFIGS_STORE);

      // 获取所有配置然后筛选活跃的
      const request = store.getAll();

      request.onsuccess = () => {
        const allConfigs = request.result;
        const activeConfig = allConfigs.find(
          (config) => config.is_active === true
        );
        resolve(activeConfig);
      };
      request.onerror = () => reject(new Error("获取活跃配置失败"));
    });
  }

  async getAllConfigs(): Promise<ConfigRecord[]> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONFIGS_STORE], "readonly");
      const store = transaction.objectStore(CONFIGS_STORE);
      const index = store.index("created_at");
      const request = index.getAll();

      request.onsuccess = () => {
        // 按创建时间倒序排列
        const results = request.result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        resolve(results);
      };
      request.onerror = () => reject(new Error("获取配置列表失败"));
    });
  }

  async deleteConfig(id: number): Promise<void> {
    const db = this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONFIGS_STORE], "readwrite");
      const store = transaction.objectStore(CONFIGS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("删除配置失败"));
    });
  }
}

// 创建单例实例
const dbManager = new IndexedDBManager();

// 文档操作接口
export const documentDB = {
  init: () => dbManager.init(),
  save: (doc: Omit<DocumentRecord, "id" | "last_modified" | "created_at">) =>
    dbManager.saveDocument(doc),
  get: (path: string) => dbManager.getDocument(path),
  getAll: () => dbManager.getAllDocuments(),
  delete: (path: string) => dbManager.deleteDocument(path),
  search: (query: string) => dbManager.searchDocuments(query),
};

// 配置操作接口
export const configDB = {
  init: () => dbManager.init(),
  save: (config: Omit<ConfigRecord, "id" | "created_at">) =>
    dbManager.saveConfig(config),
  getActive: () => dbManager.getActiveConfig(),
  getAll: () => dbManager.getAllConfigs(),
  delete: (id: number) => dbManager.deleteConfig(id),
};

// 初始化数据库的便捷函数
export const initDB = async (): Promise<void> => {
  if (typeof window === "undefined") {
    console.warn("IndexedDB 只能在浏览器环境中使用");
    return;
  }

  try {
    await dbManager.init();
    console.log("IndexedDB 初始化成功");
  } catch (error) {
    console.error("IndexedDB 初始化失败:", error);
    throw error;
  }
};

export default dbManager;
