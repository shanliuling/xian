import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { APP_DIR, CONFIG_PATH } from '../shared/constants.js';
import type { XianConfig } from './config.types.js';
import { getDefaultConfig } from './defaults.js';

let _config: XianConfig | null = null;

// ── 读取配置 ──────────────────────────────────────────────────

export function loadConfig(): XianConfig {
  if (_config) return _config;

  if (!existsSync(APP_DIR)) {
    mkdirSync(APP_DIR, { recursive: true });
  }

  if (!existsSync(CONFIG_PATH)) {
    _config = getDefaultConfig();
    _persistConfig(_config);
    return _config;
  }

  try {
    const raw  = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<XianConfig>;
    // 深合并：用户配置覆盖默认值，缺失字段自动补全
    _config = deepMerge(getDefaultConfig(), parsed) as XianConfig;
  } catch {
    // 配置文件损坏时回退到默认值
    _config = getDefaultConfig();
  }

  return _config;
}

export function getConfig(): XianConfig {
  return _config ?? loadConfig();
}

// ── 写入配置 ──────────────────────────────────────────────────

export function saveConfig(patch: Partial<XianConfig>): XianConfig {
  const current = getConfig();
  _config = deepMerge(current, patch) as XianConfig;
  _persistConfig(_config);
  return _config;
}

function _persistConfig(config: XianConfig): void {
  if (!existsSync(APP_DIR)) {
    mkdirSync(APP_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ── 重置为默认值 ──────────────────────────────────────────────

export function resetConfig(): XianConfig {
  _config = getDefaultConfig();
  _persistConfig(_config);
  return _config;
}

// ── 工具：深合并（只合并普通对象，不合并数组） ────────────────

function deepMerge(base: unknown, override: unknown): unknown {
  if (
    override === undefined ||
    override === null
  ) {
    return base;
  }
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const overrideVal = (override as Record<string, unknown>)[key];
    const baseVal     = (base    as Record<string, unknown>)[key];
    result[key] = deepMerge(baseVal, overrideVal);
  }
  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
