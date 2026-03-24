import type { RawSignal } from '../osync/signal.types.js';
import type { PlayerState, StatDelta, EventLogEntry } from '../engine/engine.types.js';
import type { FactionKey } from '../shared/constants.js';
import { getCommitSize } from '../osync/signal.types.js';
import { isLateNight } from '../shared/utils.js';
import {
  renderCommitEvent,
  renderIdleEvent,
  renderWorldNews,
  renderAchievementUnlock,
  renderRealmApproaching,
  renderVibeRotWarning,
  renderConsecutiveBonus,
} from './template-engine.js';
import type { RealmKey } from '../shared/constants.js';
import { IDLE_THRESHOLD_MINS } from '../shared/constants.js';

// ── NarrativeEngine ───────────────────────────────────────────

/**
 * NarrativeEngine — 叙事层入口
 *
 * 职责：
 *   1. 将游戏事件转换为有世界观的文案
 *   2. 优先消费 AI 内容池（Phase 2 接入）
 *   3. 降级到静态模板（Phase 1 默认）
 *
 * 使用方式：
 *   const narrative = new NarrativeEngine();
 *   const text = narrative.onCommit(signal, state, delta, todayCount);
 */
export class NarrativeEngine {

  // ── 核心事件文案生成 ──────────────────────────────────────

  /**
   * commit 事件文案
   */
  onCommit(
    signal:      RawSignal,
    state:       PlayerState,
    delta:       StatDelta,
    todayCount:  number,
  ): string {
    if (!signal.newCommit) return '';

    const size    = getCommitSize(signal.newCommit.insertions, signal.newCommit.deletions);
    const isNight = isLateNight(signal.hour);

    const mainText = renderCommitEvent({
      playerName: state.name,
      faction:    state.faction as FactionKey,
      commit:     signal.newCommit,
      size,
      delta,
      isNight,
    });

    // 连续提交加成提示（同日 3 次及以上）
    if (todayCount >= 3) {
      const bonusText = renderConsecutiveBonus(
        state.faction as FactionKey,
        todayCount,
        delta,
      );
      return `${mainText}\n✨ ${bonusText}`;
    }

    return mainText;
  }

  /**
   * 冥想摸鱼（长时间无提交）文案
   */
  onIdle(
    signal: RawSignal,
    state:  PlayerState,
    delta:  StatDelta,
  ): string | null {
    if (signal.minutesSinceLastCommit < IDLE_THRESHOLD_MINS) return null;

    // 每 30 分钟播报一次（避免频繁刷屏）
    const intervalMins = 30;
    const shouldReport =
      Math.floor(signal.minutesSinceLastCommit / intervalMins) >
      Math.floor((signal.minutesSinceLastCommit - 1) / intervalMins);

    if (!shouldReport) return null;

    return renderIdleEvent(state.faction as FactionKey, delta.heart);
  }

  /**
   * 境界即将突破预警文案
   */
  onRealmApproaching(state: PlayerState): string {
    return renderRealmApproaching(
      state.faction as FactionKey,
      state.name,
      state.realm as RealmKey,
      state.cultivation,
    );
  }

  /**
   * 道心幻觉警告文案
   */
  onVibeRot(level: 1 | 2 | 3, state: PlayerState): string {
    return renderVibeRotWarning(level, state.name);
  }

  /**
   * 成就解锁文案
   */
  onAchievement(key: string): string {
    return renderAchievementUnlock(key);
  }

  /**
   * 生成世界快报（每日启动时调用）
   */
  generateDailyNews(count = 2): string[] {
    return Array.from({ length: count }, () => renderWorldNews());
  }

  // ── 事件日志条目构造 ──────────────────────────────────────

  /**
   * 将文案包装为标准事件日志条目
   */
  buildLogEntry(
    playerId:  string,
    eventType: EventLogEntry['eventType'],
    content:   string,
    params?:   Record<string, unknown>,
  ): Omit<EventLogEntry, 'id'> {
    return {
      playerId,
      timestamp:  Date.now(),
      eventType,
      content,
      paramsJson: params ? JSON.stringify(params) : undefined,
    };
  }
}
