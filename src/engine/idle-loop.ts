/**
 * 挂机循环 - 离线放置的核心
 * 不依赖 Git，每隔一段时间自动执行行为树
 */

import { runPlayerBehavior, type ActionResult } from './behavior-tree.js'
import type { PlayerState, StatDelta } from './engine.types.js'
import { emptyDelta } from './engine.types.js'

// ─────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────

export interface IdleLoopConfig {
  /** 每次 tick 的间隔（毫秒），默认 5 秒 */
  tickInterval: number
  /** 是否启用挂机循环 */
  enabled: boolean
}

// ─────────────────────────────────────────────────────────────
// 挂机循环类
// ─────────────────────────────────────────────────────────────

export class IdleLoop {
  private timer: NodeJS.Timeout | null = null
  private config: IdleLoopConfig = {
    tickInterval: 5000, // 5 秒
    enabled: true,
  }
  private onAction:
    | ((result: ActionResult, state: PlayerState) => void)
    | null = null

  /**
   * 启动挂机循环
   */
  start(
    getState: () => PlayerState | null,
    applyDelta: (delta: StatDelta) => void,
    onActionCallback: (result: ActionResult, state: PlayerState) => void,
  ): void {
    if (this.timer) {
      this.stop()
    }

    this.onAction = onActionCallback

    // 立即执行一次
    this.tick(getState, applyDelta)

    // 设置定时器
    this.timer = setInterval(() => {
      this.tick(getState, applyDelta)
    }, this.config.tickInterval)

    console.log('[IdleLoop] 挂机循环已启动')
  }

  /**
   * 停止挂机循环
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('[IdleLoop] 挂机循环已停止')
    }
  }

  /**
   * 暂停/恢复
   */
  pause(): void {
    this.stop()
  }

  resume(
    getState: () => PlayerState | null,
    applyDelta: (delta: StatDelta) => void,
    onActionCallback: (result: ActionResult, state: PlayerState) => void,
  ): void {
    this.start(getState, applyDelta, onActionCallback)
  }

  /**
   * 单次 tick
   */
  private tick(
    getState: () => PlayerState | null,
    applyDelta: (delta: StatDelta) => void,
  ): void {
    const state = getState()
    if (!state) return

    // 跳过如果游戏不在前台（可选优化）

    // 执行行为树
    const result = runPlayerBehavior(state)

    // 应用数值变化
    if (
      result.delta.cultivation ||
      result.delta.foundation ||
      result.delta.heart
    ) {
      const delta: StatDelta = {
        cultivation: result.delta.cultivation || 0,
        foundation: result.delta.foundation || 0,
        vibe: 0, // vibe 变化暂不处理
        heart: result.delta.heart || 0,
        prestige: 0,
      }
      applyDelta(delta)
    }

    // 回调通知
    if (this.onAction) {
      this.onAction(result, state)
    }

    // 下次执行延迟
    if (result.nextDelay > 0 && result.nextDelay !== this.config.tickInterval) {
      this.stop()
      this.timer = setTimeout(() => {
        this.tick(getState, applyDelta)
      }, result.nextDelay)
    }
  }

  /**
   * 配置
   */
  setConfig(config: Partial<IdleLoopConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 是否运行中
   */
  isRunning(): boolean {
    return this.timer !== null
  }
}

// ─────────────────────────────────────────────────────────────
// 导出单例
// ─────────────────────────────────────────────────────────────

export const idleLoop = new IdleLoop()
