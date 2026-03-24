import type { RawSignal } from '../osync/signal.types.js';
import type { PlayerState, StatDelta, TraitKey } from './engine.types.js';
import { emptyDelta } from './engine.types.js';
import { getCommitSize } from '../osync/signal.types.js';
import { clamp, isLateNight } from '../shared/utils.js';
import {
  STAT_MIN,
  STAT_MAX,
  CULTIVATION_MAX,
  IDLE_THRESHOLD_MINS,
} from '../shared/constants.js';

// ── 基础数值表 ────────────────────────────────────────────────

const BASE_COMMIT_REWARDS = {
  small: {
    cultivation: 5,
    foundation:  0,
    vibe:        0,
    heart:       1,
    prestige:    1,
  },
  medium: {
    cultivation: 20,
    foundation:  2,
    vibe:        0,
    heart:       0,
    prestige:    3,
  },
  large: {
    cultivation: 50,
    foundation:  3,
    vibe:        0,
    heart:       0,
    prestige:    10,
  },
} as const;

const FACTION_BONUSES = {
  orthodox: { foundation: 3, heart: 1,  vibe: 0,  cultivation: 0  },
  vibe:     { foundation: 0, heart: 0,  vibe: 5,  cultivation: 5  },
  unbound:  { foundation: 2, heart: 0,  vibe: 2,  cultivation: 0  },
} as const;

const NIGHT_MULTIPLIER  = 1.15;
const IDLE_HEART_RATE   = 0.5;   // 道心恢复/分钟（摸鱼状态）

// ── 主计算函数 ────────────────────────────────────────────────

/**
 * 根据当前信号和玩家状态计算本轮数值增量
 * 调用方负责将 delta 应用到 PlayerState（通过 state-machine）
 */
export function calcStatDelta(
  signal: RawSignal,
  state:  PlayerState
): StatDelta {
  const delta = emptyDelta();

  if (signal.newCommit) {
    applyCommitReward(delta, signal, state);
  }

  applyIdleRecovery(delta, signal);

  // 最终 clamp，防止数值越界
  clampDelta(delta);

  return delta;
}

// ── commit 奖励 ───────────────────────────────────────────────

function applyCommitReward(
  delta:  StatDelta,
  signal: RawSignal,
  state:  PlayerState
): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const commit = signal.newCommit!;

  let size = getCommitSize(commit.insertions, commit.deletions);

  // 天赋：minimalist → 小提交按中提交计算
  if (size === 'small' && hasTrait(state, 'minimalist')) {
    size = 'medium';
  }

  // 基础奖励
  const base = BASE_COMMIT_REWARDS[size];
  delta.cultivation += base.cultivation;
  delta.foundation  += base.foundation;
  delta.heart       += base.heart;
  delta.prestige    += base.prestige;

  // 大型 commit 天赋：bulk_coder → cultivation 上限 +20%
  if (size === 'large' && hasTrait(state, 'bulk_coder')) {
    delta.cultivation *= 1.2;
  }

  // 路径加成
  const bonus = FACTION_BONUSES[state.activePath];
  delta.foundation  += bonus.foundation;
  delta.heart       += bonus.heart;
  delta.vibe        += bonus.vibe;
  delta.cultivation += bonus.cultivation;

  // 夜修加成（22:00 ~ 05:00）
  if (signal.hour !== undefined && isLateNight(signal.hour)) {
    delta.foundation  *= NIGHT_MULTIPLIER;
    delta.cultivation *= NIGHT_MULTIPLIER;

    // 天赋：night_owl → 夜间 cultivation 额外 +50%
    if (hasTrait(state, 'night_owl')) {
      delta.cultivation *= 1.5;
    }
  }

  // 声望固定奖励（每次 commit）
  delta.prestige += 5;
}

// ── 冥想摸鱼：长时间无提交，道心缓慢恢复 ────────────────────

function applyIdleRecovery(
  delta:  StatDelta,
  signal: RawSignal
): void {
  if (signal.minutesSinceLastCommit >= IDLE_THRESHOLD_MINS) {
    // 每次轮询恢复一次（轮询间隔 ~10s，乘以比例使得每分钟约 +0.5）
    const pollIntervalMins = 10 / 60; // 10 秒 ≈ 0.167 分钟
    delta.heart += IDLE_HEART_RATE * pollIntervalMins;
  }
}

// ── 连续提交加成检测 ──────────────────────────────────────────

/**
 * 检测是否触发"入定顿悟"（同日 commit 数 >= 3）
 * 返回额外道心奖励，由引擎层决定是否应用
 */
export function checkConsecutiveBonus(
  todayCommitCount: number,
  state:            PlayerState
): StatDelta {
  const delta = emptyDelta();

  if (todayCommitCount >= 3) {
    delta.heart       += 5;
    delta.cultivation += 10;

    // 天赋：consistent → 连续加成翻倍
    if (hasTrait(state, 'consistent')) {
      delta.heart       *= 2;
      delta.cultivation *= 2;
    }
  }

  return delta;
}

// ── 离线进度计算 ──────────────────────────────────────────────

/**
 * 玩家重新打开游戏时，计算离线期间的合理收益
 * - 只有道心恢复，不增长根基/幻力
 * - 修为以极低速率被动积累
 */
export function calcOfflineProgress(
  lastSaved:     number,
  offlineMaxHours: number
): StatDelta {
  const offlineMs   = Date.now() - lastSaved;
  const offlineMins = Math.min(
    offlineMs / 60_000,
    offlineMaxHours * 60
  );

  const delta = emptyDelta();
  delta.cultivation = offlineMins * 0.1;   // 极低速率
  delta.heart       = offlineMins * 0.3;   // 道心缓慢恢复
  // foundation / vibe / prestige 离线不变

  clampDelta(delta);
  return delta;
}

// ── 道心幻觉检测 ──────────────────────────────────────────────

/**
 * 根据当前状态判断道心幻觉等级
 * 0 = 正常  1 = 轻微  2 = 中度  3 = 重度
 */
export function calcVibeRotLevel(state: PlayerState): number {
  const heartFloor = hasTrait(state, 'survivor') ? 10 : 0;
  const effectiveHeart = state.heart - heartFloor;

  if (state.vibe > state.foundation * 2.0 && effectiveHeart < 25) return 3;
  if (state.vibe > state.foundation * 1.5 && effectiveHeart < 40) return 2;
  if (state.vibe > state.foundation * 1.2 && effectiveHeart < 55) return 1;
  return 0;
}

// ── 工具函数 ──────────────────────────────────────────────────

function hasTrait(state: PlayerState, trait: TraitKey): boolean {
  return state.traits.includes(trait);
}

/**
 * 将 delta 各字段做轻微 clamp（增量本身通常不需要 clamp，
 * 但防止极端天赋叠加导致单次增量过大）
 */
function clampDelta(delta: StatDelta): void {
  // 单次最大修为增量上限
  delta.cultivation = clamp(delta.cultivation, -CULTIVATION_MAX, 500);
  delta.foundation  = clamp(delta.foundation,  -STAT_MAX, STAT_MAX);
  delta.vibe        = clamp(delta.vibe,        -STAT_MAX, STAT_MAX);
  delta.heart       = clamp(delta.heart,       -STAT_MAX, STAT_MAX);
  delta.prestige    = clamp(delta.prestige,    -9999,     9999);
}

/**
 * 将 delta 应用到当前 state 数值，返回 clamp 后的新值
 * 由 state-machine 调用
 */
export function applyDeltaToStats(
  state: PlayerState,
  delta: StatDelta
): Partial<PlayerState> {
  return {
    cultivation: clamp(state.cultivation + delta.cultivation, 0, CULTIVATION_MAX),
    foundation:  clamp(state.foundation  + delta.foundation,  STAT_MIN, STAT_MAX),
    vibe:        clamp(state.vibe        + delta.vibe,        STAT_MIN, STAT_MAX),
    heart:       clamp(state.heart       + delta.heart,       STAT_MIN, STAT_MAX),
    prestige:    Math.max(0, state.prestige + delta.prestige),
  };
}
