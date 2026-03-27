import { EventEmitter } from 'events'
import nodeMachineId from 'node-machine-id'
const { machineIdSync } = nodeMachineId as unknown as {
  machineIdSync: (original?: boolean) => string
}
import type { RawSignal } from '../osync/signal.types.js'
import type {
  PlayerState,
  StatDelta,
  TribulationData,
  AchievementKey,
} from './engine.types.js'
import { emptyDelta } from './engine.types.js'
import {
  calcStatDelta,
  applyDeltaToStats,
  calcVibeRotLevel,
  calcOfflineProgress,
  checkConsecutiveBonus,
} from './stat-calculator.js'
import {
  canBreakthrough,
  getNextRealm,
  generateTribulation,
  resolveRealm,
} from './realm.js'
import {
  saveFullPlayerState,
  loadFullPlayerState,
  playerExists,
} from '../storage/repositories/player.repo.js'
import {
  insertEvent,
  getRecentEvents,
  getTodayCommitEvents,
} from '../storage/repositories/event.repo.js'
import { persistDb } from '../storage/index.js'
import { getConfig } from '../config/index.js'
import type { FactionKey, RealmKey } from '../shared/constants.js'
import type { TraitKey } from './engine.types.js'
import { idleLoop } from './idle-loop.js'
import type { ActionResult } from './behavior-tree.js'

// ── 初始状态工厂 ──────────────────────────────────────────────

function createInitialState(
  id: string,
  name: string,
  sect: string,
  faction: FactionKey,
  traits: TraitKey[],
): PlayerState {
  const now = Date.now()
  return {
    // profile
    id,
    name,
    sect,
    faction,
    traits,
    createdAt: now,
    // stats
    realm: 'novice',
    cultivation: 0,
    foundation: 10,
    vibe: 5,
    heart: 80,
    prestige: 0,
    vibeRotLevel: 0,
    activePath: faction,
    lastCommitAt: 0,
    lastSaved: now,
  }
}

// ── GameEngine ────────────────────────────────────────────────

/**
 * GameEngine — 游戏引擎主控
 *
 * 职责：
 *   1. 持有玩家状态（PlayerState）
 *   2. 消费 OSync 发来的 RawSignal，驱动数值变化
 *   3. 检测境界突破、成就、道心幻觉
 *   4. 通过 EventEmitter 向渲染层广播状态变化
 *
 * 事件：
 *   'state:update'  → PlayerState
 *   'event:text'    → { timestamp, content }
 *   'tribulation'   → TribulationData
 *   'achievement'   → AchievementKey
 *   'realm:up'      → { from: RealmKey, to: RealmKey }
 */
export class GameEngine extends EventEmitter {
  private state: PlayerState | null = null
  private pendingTribulation: TribulationData | null = null
  private unlockedAchievements: Set<AchievementKey> = new Set()

  // ── 初始化 ─────────────────────────────────────────────────

  /**
   * 从数据库加载已有玩家状态
   * 若不存在则返回 false（触发 Onboarding）
   */
  async load(): Promise<boolean> {
    const id = machineIdSync(true)
    if (!playerExists(id)) return false

    const state = loadFullPlayerState(id)
    if (!state) return false

    this.state = state
    this._applyOfflineProgress()
    this._broadcastState()
    return true
  }

  /**
   * 首次入道：创建新玩家
   */
  createPlayer(
    name: string,
    sect: string,
    faction: FactionKey,
    traits: TraitKey[],
  ): PlayerState {
    const id = machineIdSync(true)
    const state = createInitialState(id, name, sect, faction, traits)
    this.state = state
    saveFullPlayerState(state)
    persistDb()

    this._logEvent('stat_change', `欢迎入道，${name}！修仙之路，从此刻开始。`)
    this._broadcastState()
    return state
  }

  // ── 信号处理 ───────────────────────────────────────────────

  /**
   * 处理来自 OSync 的 RawSignal
   * 这是游戏主循环的核心入口
   */
  process(signal: RawSignal): void {
    if (!this.state) return

    // 1. 计算数值增量
    const delta = calcStatDelta(signal, this.state)

    // 2. 检测连续提交加成
    if (signal.newCommit) {
      const todayCount = getTodayCommitEvents(this.state.id).length + 1
      const bonusDelta = checkConsecutiveBonus(todayCount, this.state)
      delta.cultivation += bonusDelta.cultivation
      delta.heart += bonusDelta.heart

      if (todayCount >= 3) {
        this._logEvent(
          'stat_change',
          `入定顿悟！今日第 ${todayCount} 次提交，心流涌现，道心 +${bonusDelta.heart.toFixed(1)}`,
        )
      }
    }

    // 3. 应用增量
    this._applyDelta(delta, signal)

    // 4. 检测道心幻觉
    this._checkVibeRot()

    // 5. 检测成就
    this._checkAchievements(signal)

    // 6. 检测境界突破
    this._checkBreakthrough()

    // 7. 广播最新状态
    this._broadcastState()
  }

  // ── 天劫处理 ───────────────────────────────────────────────

  /**
   * 玩家做出天劫选择
   */
  resolveTribulation(choiceId: string): void {
    if (!this.state || !this.pendingTribulation) return

    const data = this.pendingTribulation
    const choice = data.choices.find((c) => c.id === choiceId)

    if (!choice) {
      // 超时或无效选择：判为失败
      this._logEvent('tribulation', `天劫超时！境界突破失败，修为受损`)
      this._applyDeltaDirect({ ...emptyDelta(), cultivation: -30, heart: -10 })
      this.pendingTribulation = null
      this._broadcastState()
      return
    }

    // 应用选择结果
    this._applyDeltaDirect(choice.delta)

    // 执行境界突破
    const nextRealm = getNextRealm(this.state.realm)
    if (nextRealm) {
      const prevRealm = this.state.realm
      this.state = { ...this.state, realm: nextRealm }
      this.emit('realm:up', { from: prevRealm, to: nextRealm })
      this._logEvent(
        'realm_up',
        `🎉 境界突破！${choice.resultText} 你已踏入 ${nextRealm} 境界。`,
      )
    }

    this.pendingTribulation = null
    this._broadcastState()
    this.save()
  }

  // ── 存档 ───────────────────────────────────────────────────

  async save(): Promise<void> {
    if (!this.state) return
    this.state = { ...this.state, lastSaved: Date.now() }
    saveFullPlayerState(this.state)
    persistDb()
  }

  // ── 查询接口 ───────────────────────────────────────────────

  getState(): PlayerState | null {
    return this.state
  }

  isReady(): boolean {
    return this.state !== null
  }

  hasPendingTribulation(): boolean {
    return this.pendingTribulation !== null
  }

  getPendingTribulation(): TribulationData | null {
    return this.pendingTribulation
  }

  getRecentEventLog(limit = 20) {
    if (!this.state) return []
    return getRecentEvents(this.state.id, limit)
  }

  // ── 挂机循环 ───────────────────────────────────────────────

  /**
   * 启动挂机循环（离线放置模式）
   * 不依赖 Git，玩家自动修炼/战斗/探索
   */
  startIdleLoop(): void {
    if (!this.state) return

    idleLoop.start(
      // 获取状态
      () => this.state,
      // 应用数值变化
      (delta) => {
        if (!this.state) return
        const newStats = applyDeltaToStats(this.state, delta)
        this.state = { ...this.state, ...newStats }
        this._broadcastState()
      },
      // 行为回调
      (result, state) => {
        this._logEvent('stat_change', result.text)
      },
    )
  }

  /**
   * 停止挂机循环
   */
  stopIdleLoop(): void {
    idleLoop.stop()
  }

  /**
   * 挂机循环是否运行中
   */
  isIdleLoopRunning(): boolean {
    return idleLoop.isRunning()
  }

  // ── 内部方法 ───────────────────────────────────────────────

  private _applyDelta(delta: StatDelta, signal: RawSignal): void {
    if (!this.state) return

    const newStats = applyDeltaToStats(this.state, delta)
    this.state = { ...this.state, ...newStats }

    if (signal.newCommit) {
      this.state = { ...this.state, lastCommitAt: signal.timestamp }

      const lines = signal.newCommit.insertions + signal.newCommit.deletions
      const cultivStr =
        delta.cultivation > 0 ? `修为 +${delta.cultivation.toFixed(1)}` : ''
      const foundStr =
        delta.foundation > 0 ? `根基 +${delta.foundation.toFixed(1)}` : ''
      const parts = [cultivStr, foundStr].filter(Boolean).join('，')

      this._logEvent(
        'stat_change',
        `功德刻印 [${signal.newCommit.hash}] "${signal.newCommit.message}" (${lines} 行)  ${parts}`,
      )
    }
  }

  private _applyDeltaDirect(delta: StatDelta): void {
    if (!this.state) return
    const newStats = applyDeltaToStats(this.state, delta)
    this.state = { ...this.state, ...newStats }
  }

  private _applyOfflineProgress(): void {
    if (!this.state) return
    const config = getConfig()
    if (!config.gameplay.offlineProgressEnabled) return

    const offlineDelta = calcOfflineProgress(
      this.state.lastSaved,
      config.gameplay.offlineMaxHours,
    )

    if (offlineDelta.cultivation > 0 || offlineDelta.heart > 0) {
      this._applyDeltaDirect(offlineDelta)

      const offlineMins = Math.floor(
        (Date.now() - this.state.lastSaved) / 60_000,
      )
      if (offlineMins > 10) {
        this._logEvent(
          'stat_change',
          `离线 ${offlineMins} 分钟，冥想修炼：修为 +${offlineDelta.cultivation.toFixed(1)}，道心 +${offlineDelta.heart.toFixed(1)}`,
        )
      }
    }
  }

  private _checkVibeRot(): void {
    if (!this.state) return
    const config = getConfig()
    if (!config.gameplay.vibeRotEnabled) return

    const newLevel = calcVibeRotLevel(this.state)
    const oldLevel = this.state.vibeRotLevel

    if (newLevel !== oldLevel) {
      this.state = { ...this.state, vibeRotLevel: newLevel }

      if (newLevel > oldLevel) {
        const warnings: Record<number, string> = {
          1: '⚠ 幻力渐超根基，道心出现轻微波动，请注意平衡',
          2: '⚠⚠ 道心幻觉加深！幻力已超根基 1.5 倍，失控风险上升',
          3: '🚨 重度道心幻觉！幻力失控，负面事件概率大增',
        }
        if (warnings[newLevel]) {
          this._logEvent('stat_change', warnings[newLevel])
        }
      }
    }

    // 重度幻觉：随机触发负面事件
    if (newLevel >= 3 && Math.random() < 0.1) {
      const penalty = { ...emptyDelta(), foundation: -3, heart: -5 }
      this._applyDeltaDirect(penalty)
      this._logEvent('stat_change', '幻道反噬！道心动荡，根基受损 -3')
    }
  }

  private _checkBreakthrough(): void {
    if (!this.state || this.pendingTribulation) return

    if (canBreakthrough(this.state)) {
      const nextRealm = getNextRealm(this.state.realm)
      if (!nextRealm) return

      const data = generateTribulation(nextRealm, this.state.id)
      this.pendingTribulation = data

      this._logEvent(
        'tribulation',
        `⚡ 修为临界！${data.title} 即将降临，做好准备！`,
      )

      // 广播给渲染层，触发天劫界面
      this.emit('tribulation', data)
    }
  }

  private _checkAchievements(signal: RawSignal): void {
    if (!this.state) return

    const tryUnlock = (key: AchievementKey, condition: boolean) => {
      if (condition && !this.unlockedAchievements.has(key)) {
        this.unlockedAchievements.add(key)
        this.emit('achievement', key)
        this._logEvent('achievement', `🏅 成就解锁【${key}】`)
      }
    }

    // first_commit
    tryUnlock('first_commit', signal.newCommit !== null)

    // night_coder：深夜提交
    if (signal.newCommit && (signal.hour >= 22 || signal.hour <= 5)) {
      const nightCommits =
        (this.state as PlayerState & { _nightCommits?: number })
          ._nightCommits ?? 0
      const updated = nightCommits + 1
      ;(this.state as PlayerState & { _nightCommits?: number })._nightCommits =
        updated
      tryUnlock('night_coder', updated >= 5)
    }

    // bulk_master：单次 >500 行
    if (signal.newCommit) {
      const lines = signal.newCommit.insertions + signal.newCommit.deletions
      tryUnlock('bulk_master', lines > 500)
    }

    // heart_crisis：道心跌破 20
    tryUnlock('heart_crisis', this.state.heart < 20)

    // heart_restored：道心从 <20 恢复到 >60
    tryUnlock(
      'heart_restored',
      this.state.heart > 60 && this.unlockedAchievements.has('heart_crisis'),
    )

    // vibe_overflow：幻力超根基 2 倍
    tryUnlock('vibe_overflow', this.state.vibe > this.state.foundation * 2)

    // dual_master：根基与幻力均 >80
    tryUnlock('dual_master', this.state.foundation > 80 && this.state.vibe > 80)
  }

  private _broadcastState(): void {
    if (!this.state) return
    this.emit('state:update', this.state)
  }

  private _logEvent(
    type: 'stat_change' | 'achievement' | 'news' | 'realm_up' | 'tribulation',
    content: string,
  ): void {
    if (!this.state) return

    const entry = {
      playerId: this.state.id,
      timestamp: Date.now(),
      eventType: type as import('../shared/constants.js').EventType,
      content,
    }

    insertEvent(entry)
    this.emit('event:text', entry)
  }
}
