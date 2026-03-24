import type { RealmKey, FactionKey, EventType } from '../shared/constants.js';

// ── 玩家状态 ───────────────────────────────────────────────────

export interface PlayerProfile {
  id: string;           // machine-id，设备唯一标识
  name: string;         // 道号
  sect: string;         // 宗门 key
  faction: FactionKey;  // 阵营
  traits: TraitKey[];   // 天赋列表
  createdAt: number;    // 首次创建时间戳
}

export interface PlayerStats {
  realm: RealmKey;
  cultivation: number;  // 修为（总进度）
  foundation: number;   // 根基 0-100
  vibe: number;         // 幻力 0-100
  heart: number;        // 道心 0-100
  prestige: number;     // 声望
  vibeRotLevel: number; // 道心幻觉程度 0-3
  lastCommitAt: number; // 最近一次 commit 的时间戳
  lastSaved: number;    // 最近一次存档时间戳
  activePath: FactionKey;
}

/** 完整玩家状态 = 档案 + 数值 */
export type PlayerState = PlayerProfile & PlayerStats;

// ── 数值增量 ───────────────────────────────────────────────────

export interface StatDelta {
  cultivation: number;
  foundation:  number;
  vibe:        number;
  heart:       number;
  prestige:    number;
}

export function emptyDelta(): StatDelta {
  return { cultivation: 0, foundation: 0, vibe: 0, heart: 0, prestige: 0 };
}

// ── 天赋 ───────────────────────────────────────────────────────

export const TRAIT_KEYS = [
  'night_owl',        // 深夜提交额外 +50% 修为
  'survivor',         // 屎山幸存者：道心下限 +10
  'bulk_coder',       // 大型 commit 修为上限 +20%
  'consistent',       // 连续提交加成更强
  'minimalist',       // 小提交也能获得中提交收益
] as const;

export type TraitKey = typeof TRAIT_KEYS[number];

export const TRAIT_LABELS: Record<TraitKey, string> = {
  night_owl:   '熬夜之魂',
  survivor:    '屎山幸存者',
  bulk_coder:  '巨量刻印',
  consistent:  '滴水穿石',
  minimalist:  '一行入道',
};

export const TRAIT_DESCS: Record<TraitKey, string> = {
  night_owl:   '深夜（22:00-06:00）提交时，修为额外 +50%',
  survivor:    '历经屎山而不倒，道心下限提升 10 点',
  bulk_coder:  '大型提交（>300行）修为上限提高 20%',
  consistent:  '同日第 3 次及以上提交，额外奖励翻倍',
  minimalist:  '小型提交（<50行）按中型提交计算修为',
};

// ── 天劫 ───────────────────────────────────────────────────────

export type TribulationType =
  | 'code_review'      // Code Review 大劫
  | 'prod_incident'    // 生产事故大劫
  | 'requirement_change' // 需求变更雷劫
  | 'interview'        // 面试问心劫

export interface TribulationChoice {
  key: string;         // 单字母，如 'A' 'B' 'C'
  id: string;
  label: string;       // 选项文案
  path: FactionKey;    // 对应路径
  delta: StatDelta;
  resultText: string;
}

export interface TribulationData {
  id: string;
  type: TribulationType;
  realm: RealmKey;
  title: string;
  description: string;
  timeLimit: number;   // 秒
  choices: TribulationChoice[];
}

export type TribulationResult = 'success' | 'partial' | 'failure' | 'timeout';

export interface TribulationLog {
  id?: number;
  playerId: string;
  timestamp: number;
  realm: RealmKey;
  type: TribulationType;
  choice: string | null;
  result: TribulationResult;
  delta: StatDelta;
}

// ── 成就 ───────────────────────────────────────────────────────

export const ACHIEVEMENT_KEYS = [
  'first_commit',      // 第一次 commit
  'first_realm_up',    // 第一次境界突破
  'night_coder',       // 深夜提交 5 次
  'consistent_week',   // 连续 7 天有 commit
  'bulk_master',       // 单次 >500 行
  'heart_crisis',      // 道心跌破 20
  'heart_restored',    // 道心从 <20 恢复到 >60
  'vibe_overflow',     // 幻力超过根基 2 倍
  'dual_master',       // 根基与幻力均 >80
] as const;

export type AchievementKey = typeof ACHIEVEMENT_KEYS[number];

export const ACHIEVEMENT_LABELS: Record<AchievementKey, string> = {
  first_commit:     '初入码界',
  first_realm_up:   '破境而出',
  night_coder:      '子时独修',
  consistent_week:  '七日不辍',
  bulk_master:      '巨量刻印',
  heart_crisis:     '道心将碎',
  heart_restored:   '心劫渡过',
  vibe_overflow:    '幻道失控',
  dual_master:      '双修宗师',
};

export interface AchievementRecord {
  key: AchievementKey;
  unlockedAt: number;
}

// ── 事件日志条目 ──────────────────────────────────────────────

export interface EventLogEntry {
  id?: number;
  playerId: string;
  timestamp: number;
  eventType: EventType;
  content: string;      // 显示文案
  paramsJson?: string;  // 附加参数 JSON
}

// ── 修炼日志条目 ──────────────────────────────────────────────

export interface CultivationLogEntry {
  id?: number;
  playerId: string;
  timestamp: number;
  commitHash?: string;
  linesTotal: number;
  deltaJson: string;    // StatDelta JSON
}

// ── 游戏引擎事件 ──────────────────────────────────────────────

export interface GameEngineEvents {
  'state:update':  [state: PlayerState];
  'event:text':    [entry: EventLogEntry];
  'tribulation':   [data: TribulationData];
  'achievement':   [key: AchievementKey];
  'realm:up':      [from: RealmKey, to: RealmKey];
}

// ── 离线进度配置 ──────────────────────────────────────────────

export interface OfflineConfig {
  enabled: boolean;
  offlineMaxHours: number;
}
