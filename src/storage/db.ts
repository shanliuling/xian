import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import { DB_PATH, APP_DIR } from '../shared/constants.js';
import { INIT_SQL } from './migrations/001_init.js';

// ── sql.js WASM 路径处理 ──────────────────────────────────────
// 全局安装（npm install -g xian）时，__dirname 会是 dist/ 下的某个位置，
// 而 sql-wasm.wasm 实际在 node_modules/sql.js/dist/ 里。
// 用 createRequire + resolve 可以在任意安装位置找到它。
const require = createRequire(import.meta.url);

function resolveWasmPath(): string {
  try {
    return require.resolve('sql.js/dist/sql-wasm.wasm');
  } catch {
    // fallback：与 db.js 同目录（打包场景）
    return new URL('../sql-wasm.wasm', import.meta.url).pathname;
  }
}

// ── 单例 ──────────────────────────────────────────────────────
let db: Database | null = null;

/**
 * 初始化数据库
 * - 若 ~/.xian/save.db 存在则从磁盘加载
 * - 否则创建全新内存库
 * - 执行 INIT_SQL（CREATE TABLE IF NOT EXISTS，幂等）
 */
export async function initDb(): Promise<Database> {
  if (db) return db;

  // 确保应用目录存在
  if (!existsSync(APP_DIR)) {
    mkdirSync(APP_DIR, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: () => resolveWasmPath(),
  });

  if (existsSync(DB_PATH)) {
    const data = readFileSync(DB_PATH);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  // 执行建表 migration（IF NOT EXISTS，可重复执行）
  db.run(INIT_SQL);

  return db;
}

/**
 * 获取已初始化的数据库实例
 * 必须先调用 initDb()
 */
export function getDb(): Database {
  if (!db) {
    throw new Error(
      '[xian] Database not initialized. Call initDb() before getDb().'
    );
  }
  return db;
}

/**
 * 将内存中的数据库持久化到磁盘
 * sql.js 在内存中运行，退出前必须手动调用此函数
 */
export function persistDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    // 持久化失败不应崩溃游戏，只记录
    console.error('[xian] Failed to persist database:', err);
  }
}

/**
 * 关闭数据库连接并持久化
 */
export function closeDb(): void {
  persistDb();
  if (db) {
    db.close();
    db = null;
  }
}
