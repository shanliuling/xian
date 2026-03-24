import type { BossKeyTheme, FactionKey } from '../shared/constants.js';

// ── Boss Key 配置 ─────────────────────────────────────────────
export interface BossKeyConfig {
  /** 触发快捷键，默认 ctrl+b */
  shortcut: string;
  /** 伪装主题 */
  theme: BossKeyTheme;
  /** 自动轮换主题 */
  autoRotateTheme: boolean;
}

// ── OSync 感知层配置 ──────────────────────────────────────────
export interface OSyncConfig {
  /** Git 轮询间隔（毫秒） */
  gitInterval: number;
  /** 监听的 Git 仓库目录 */
  watchDir: string;
}

// ── 游戏数值配置 ──────────────────────────────────────────────
export interface GameplayConfig {
  /** 是否启用离线挂机进度 */
  offlineProgressEnabled: boolean;
  /** 离线进度最大计算时长（小时） */
  offlineMaxHours: number;
  /** 是否启用夜修加成（22:00~06:00） */
  nightCodingBonus: boolean;
  /** 是否启用道心幻觉系统 */
  vibeRotEnabled: boolean;
}

// ── 界面配置 ──────────────────────────────────────────────────
export interface UiConfig {
  /** 颜色主题 */
  theme: 'dark' | 'light';
  /** 是否使用 Unicode 字符（关闭则降级为 ASCII） */
  useUnicode: boolean;
  /** 修炼日志最多显示行数 */
  logLines: number;
  /** 界面刷新率（毫秒） */
  refreshRate: number;
}

// ── AI 叙事引擎配置 ───────────────────────────────────────────
export interface AiConfig {
  /** 是否启用 AI 叙事增强（需配置 apiKey） */
  enabled: boolean;
  /** API 提供商 */
  provider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
  /** API Key（用户自行填写，不上传） */
  apiKey: string;
  /** 使用的模型，默认 gpt-4o-mini（低成本够用） */
  model: string;
  /** 自定义 API 地址（兼容 OpenAI 格式的本地模型或第三方代理） */
  baseUrl: string;
}

// ── 完整配置类型 ──────────────────────────────────────────────
export interface XianConfig {
  bossKey:  BossKeyConfig;
  osync:    OSyncConfig;
  gameplay: GameplayConfig;
  ui:       UiConfig;
  ai:       AiConfig;
}

// ── 玩家档案（首次入道写入，基本不变） ────────────────────────
export interface PlayerProfile {
  /** 设备唯一 ID（node-machine-id） */
  id: string;
  /** 道号（玩家昵称） */
  name: string;
  /** 宗门 key */
  sect: string;
  /** 修炼路径 / 阵营 */
  faction: FactionKey;
  /** 初始天赋 key 列表 */
  traits: string[];
  /** 创建时间戳 */
  createdAt: number;
  /** 最后游玩时间戳 */
  lastPlayed: number;
}
