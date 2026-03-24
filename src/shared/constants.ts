import { homedir } from 'os';
import { join } from 'path';

// ── 应用目录 ──────────────────────────────────────────────────
export const APP_NAME   = 'xian';
export const APP_DIR    = join(homedir(), '.xian');
export const DB_PATH    = join(APP_DIR, 'save.db');
export const CONFIG_PATH = join(APP_DIR, 'config.json');

// ── 境界 ──────────────────────────────────────────────────────
export const REALM_KEYS = [
  'novice',
  'foundation',
  'core',
  'nascent',
  'spirit',
  'tribulation',
] as const;

export type RealmKey = typeof REALM_KEYS[number];

export const REALM_LABELS: Record<RealmKey, string> = {
  novice:      '炼气期',
  foundation:  '筑基期',
  core:        '金丹期',
  nascent:     '元婴期',
  spirit:      '化神期',
  tribulation: '渡劫期',
};

export const REALM_TITLE: Record<RealmKey, string> = {
  novice:      'Junior',
  foundation:  'Mid',
  core:        'Senior',
  nascent:     'Staff',
  spirit:      'Principal',
  tribulation: 'Tech Leader',
};

/** 每个境界所需修为门槛（到达该境界需要的累计修为） */
export const REALM_THRESHOLDS: Record<RealmKey, number> = {
  novice:      0,
  foundation:  200,
  core:        600,
  nascent:     1500,
  spirit:      4000,
  tribulation: 10000,
};

// ── 阵营 ──────────────────────────────────────────────────────
export const FACTION_KEYS = ['orthodox', 'vibe', 'unbound'] as const;
export type FactionKey = typeof FACTION_KEYS[number];

export const FACTION_LABELS: Record<FactionKey, string> = {
  orthodox: '正道联盟',
  vibe:     '幻元道',
  unbound:  '无宗行者',
};

export const FACTION_DESC: Record<FactionKey, string> = {
  orthodox: '根基第一，慢即是快。稳定、可解释、抗风险强。',
  vibe:     '效率即正义，结果即真理。爆发强、推进快。',
  unbound:  '古法为骨，幻道为翼。上限最高，难度也最高。',
};

// ── 宗门（初始选择，风格标签） ─────────────────────────────────
export const SECT_OPTIONS = [
  { key: 'sword',   label: 'C/C++ 剑宗',   desc: '高风险高收益，性能极道' },
  { key: 'guard',   label: 'Rust 禁卫军',  desc: '以所有权与类型秩序立身' },
  { key: 'illusion',label: 'JS 幻宗',      desc: '擅变幻、善异步，路数诡谲' },
  { key: 'myriad',  label: 'Python 万象门',desc: '包罗万象、速成百术' },
  { key: 'cloud',   label: 'Go 云行派',    desc: '并发为舟，简洁为道' },
] as const;

// ── 数值上下限 ────────────────────────────────────────────────
export const STAT_MIN  = 0;
export const STAT_MAX  = 100;
export const CULTIVATION_MAX = 99999;

// ── 时间相关 ──────────────────────────────────────────────────
export const LATE_NIGHT_START = 22;   // 夜修开始（小时）
export const LATE_NIGHT_END   = 5;    // 夜修结束（小时）
export const IDLE_THRESHOLD_MINS = 60; // 超过此分钟数视为"冥想摸鱼"

// ── Boss Key 伪装主题 ─────────────────────────────────────────
export const BOSS_KEY_THEMES = ['npm', 'git', 'docker', 'kubectl'] as const;
export type BossKeyTheme = typeof BOSS_KEY_THEMES[number];

// ── 事件类型 ──────────────────────────────────────────────────
export const EVENT_TYPES = [
  'stat_change',
  'achievement',
  'news',
  'ai_event',
  'realm_up',
  'tribulation',
] as const;
export type EventType = typeof EVENT_TYPES[number];
