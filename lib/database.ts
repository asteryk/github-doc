import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// 确保数据目录存在
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "documents.db");

let db: Database.Database;

try {
  db = new Database(dbPath);

  // 创建简化的表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      content TEXT,
      sha TEXT,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner TEXT NOT NULL,
      repo TEXT NOT NULL,
      token TEXT NOT NULL,
      path TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
    CREATE INDEX IF NOT EXISTS idx_configs_active ON configs(is_active);
  `);

  console.log("数据库初始化成功");
} catch (error) {
  console.error("数据库初始化失败:", error);
  throw error;
}

export interface DocumentRecord {
  id?: number;
  path: string;
  name: string;
  content: string;
  sha: string;
  last_modified?: string;
  created_at?: string;
}

export interface ConfigRecord {
  id?: number;
  owner: string;
  repo: string;
  token: string;
  path: string;
  is_active: boolean;
  created_at?: string;
}

// 简化的文档操作
export const documentDB = {
  // 保存或更新文档
  save: (doc: DocumentRecord): void => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO documents (path, name, content, sha, last_modified)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(doc.path, doc.name, doc.content, doc.sha);
  },

  // 获取文档
  get: (path: string): DocumentRecord | undefined => {
    const stmt = db.prepare("SELECT * FROM documents WHERE path = ?");
    return stmt.get(path) as DocumentRecord | undefined;
  },

  // 获取所有文档
  getAll: (): DocumentRecord[] => {
    const stmt = db.prepare(
      "SELECT * FROM documents ORDER BY last_modified DESC"
    );
    return stmt.all() as DocumentRecord[];
  },

  // 删除文档
  delete: (path: string): void => {
    const stmt = db.prepare("DELETE FROM documents WHERE path = ?");
    stmt.run(path);
  },

  // 搜索文档
  search: (query: string): DocumentRecord[] => {
    const stmt = db.prepare(`
      SELECT * FROM documents
      WHERE name LIKE ? OR content LIKE ?
      ORDER BY last_modified DESC
    `);
    const searchQuery = `%${query}%`;
    return stmt.all(searchQuery, searchQuery) as DocumentRecord[];
  },
};

// 配置相关操作
export const configDB = {
  // 保存配置
  save: (config: ConfigRecord): void => {
    // 先停用所有其他配置
    const deactivateStmt = db.prepare("UPDATE configs SET is_active = 0");
    deactivateStmt.run();

    // 保存新配置
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO configs (owner, repo, token, path, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    stmt.run(config.owner, config.repo, config.token, config.path);
  },

  // 获取当前活跃配置
  getActive: (): ConfigRecord | undefined => {
    const stmt = db.prepare(
      "SELECT * FROM configs WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
    );
    return stmt.get() as ConfigRecord | undefined;
  },

  // 获取所有配置
  getAll: (): ConfigRecord[] => {
    const stmt = db.prepare("SELECT * FROM configs ORDER BY created_at DESC");
    return stmt.all() as ConfigRecord[];
  },

  // 删除配置
  delete: (id: number): void => {
    const stmt = db.prepare("DELETE FROM configs WHERE id = ?");
    stmt.run(id);
  },
};

export default db;
