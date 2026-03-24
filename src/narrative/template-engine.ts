import type { FactionKey } from '../shared/constants.js';
import { randomPick, formatDelta } from '../shared/utils.js';
import type { StatDelta } from '../engine/engine.types.js';
import type { CommitInfo } from '../osync/signal.types.js';
import {
  COMMIT_TEMPLATES,
  NIGHT_CODING_TEMPLATES,
  IDLE_TEMPLATES,
  CONSECUTIVE_BONUS_TEMPLATES,
  REALM_APPROACHING_TEMPLATES,
  VIBE_ROT_TEMPLATES,
  WORLD_NEWS_TEMPLATES,
  ACHIEVEMENT_UNLOCK_TEMPLATES,
  pickTemplate,
  type CommitSizeKey,
} from './templates/commit-events.js';
import type { RealmKey } from '../shared/constants.js';

// ── 变量插值 ──────────────────────────────────────────────────

/**
 * 将模板字符串中的 {key} 占位符替换为实际值
 * 例如："{name}，修为 +{cultivation_gain}" → "道友，修为 +20"
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    if (val === undefined) return `{${key}}`;
    return String(val);
  });
}

// ── commit 事件文案 ───────────────────────────────────────────

export interface CommitEventContext {
  playerName:      string;
  faction:         FactionKey;
  commit:          CommitInfo;
  size:            CommitSizeKey;
  delta:           StatDelta;
  isNight:         boolean;
}

/**
 * 生成 commit 事件文案
 * 优先返回带变量的完整渲染结果
 */
export function renderCommitEvent(ctx: CommitEventContext): string {
  const raw = pickTemplate(COMMIT_TEMPLATES[ctx.size], ctx.faction);

  const vars: Record<string, string | number> = {
    name:             ctx.playerName,
    lines:            ctx.commit.insertions + ctx.commit.deletions,
    cultivation_gain: formatDelta(ctx.delta.cultivation),
    foundation_gain:  formatDelta(ctx.delta.foundation),
    vibe_gain:        formatDelta(ctx.delta.vibe),
    heart_gain:       formatDelta(ctx.delta.heart),
    prestige_gain:    formatDelta(ctx.delta.prestige),
    commit_msg:       ctx.commit.message,
  };

  let text = renderTemplate(raw, vars);

  // 追加夜修标记
  if (ctx.isNight) {
    const nightRaw  = pickTemplate(NIGHT_CODING_TEMPLATES, ctx.faction);
    const nightText = renderTemplate(nightRaw, vars);
    text += `\n🌙 ${nightText}`;
  }

  return text;
}

// ── 冥想摸鱼文案 ──────────────────────────────────────────────

export function renderIdleEvent(
  faction:    FactionKey,
  heartGain:  number
): string {
  const raw = pickTemplate(IDLE_TEMPLATES, faction);
  return renderTemplate(raw, { heart_gain: formatDelta(heartGain) });
}

// ── 连续提交"入定顿悟"文案 ─────────────────────────────────

export function renderConsecutiveBonus(
  faction:   FactionKey,
  count:     number,
  delta:     StatDelta
): string {
  const raw = pickTemplate(CONSECUTIVE_BONUS_TEMPLATES, faction);
  return renderTemplate(raw, {
    count,
    heart_gain:       formatDelta(delta.heart),
    cultivation_gain: formatDelta(delta.cultivation),
  });
}

// ── 境界临近预警文案 ──────────────────────────────────────────

export function renderRealmApproaching(
  faction:     FactionKey,
  playerName:  string,
  realm:       RealmKey,
  cultivation: number
): string {
  const raw = pickTemplate(REALM_APPROACHING_TEMPLATES, faction);
  return renderTemplate(raw, {
    name:        playerName,
    realm,
    current:     Math.floor(cultivation),
  });
}

// ── 道心幻觉警告文案 ──────────────────────────────────────────

export function renderVibeRotWarning(
  level:      1 | 2 | 3,
  playerName: string
): string {
  const pool = VIBE_ROT_TEMPLATES[`level${level}` as keyof typeof VIBE_ROT_TEMPLATES];
  const raw  = randomPick(pool);
  return renderTemplate(raw, { name: playerName });
}

// ── 世界快报文案 ──────────────────────────────────────────────

const NPC_NAMES = [
  '云深道友', '铁律宗主', '幻元散人', '无名剑客',
  '代码真人', '架构道长', '测试执事', '运维天师',
];

export function renderWorldNews(): string {
  const raw = randomPick(WORLD_NEWS_TEMPLATES);
  return renderTemplate(raw, {
    npc_name: randomPick(NPC_NAMES),
    version:  `${randomInt(2, 9)}.${randomInt(0, 9)}`,
  });
}

/** 一次生成 N 条不重复的世界快报 */
export function renderWorldNewsBatch(count: number): string[] {
  const shuffled = [...WORLD_NEWS_TEMPLATES]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  return shuffled.map((raw) =>
    renderTemplate(raw, {
      npc_name: randomPick(NPC_NAMES),
      version:  `${randomInt(2, 9)}.${randomInt(0, 9)}`,
    })
  );
}

// ── 成就解锁文案 ──────────────────────────────────────────────

export function renderAchievementUnlock(key: string): string {
  return ACHIEVEMENT_UNLOCK_TEMPLATES[key] ?? `🏅 成就解锁【${key}】`;
}

// ── 工具 ──────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
