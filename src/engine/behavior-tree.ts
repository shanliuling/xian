/**
 * 行为树 - 主角自动行为逻辑
 * 对应白皮书 v5.0 的设计
 */

import type { PlayerState } from './engine.types.js'

// ─────────────────────────────────────────────────────────────
// 行为类型定义
// ─────────────────────────────────────────────────────────────

export type ActionType =
  | 'cultivate' // 修炼
  | 'combat' // 战斗
  | 'explore' // 探索
  | 'trade' // 交易
  | 'rest' // 休息
  | 'tribulation' // 天劫
  | 'breakthrough' // 突破

export interface Action {
  type: ActionType
  priority: number // 优先级，数值越大越优先
  execute: (state: PlayerState) => ActionResult
}

export interface ActionResult {
  type: ActionType
  delta: {
    cultivation?: number
    foundation?: number
    heart?: number
    spirit?: number
  }
  text: string
  // 下次行动延迟（毫秒）
  nextDelay: number
}

// ─────────────────────────────────────────────────────────────
// 行为树实现
// ─────────────────────────────────────────────────────────────

/**
 * 主角行为树
 * 按优先级顺序执行
 */
export function evaluateBehaviorTree(state: PlayerState): ActionResult {
  // 1. 修为达标且可突破？
  if (canBreakthrough(state)) {
    return {
      type: 'breakthrough',
      delta: {},
      text: '境界突破契机！',
      nextDelay: 0,
    }
  }

  // 2. 有一定修为且想购物？（spirit 用 foundation 模拟）
  if (state.foundation > 30 && Math.random() < 0.05) {
    return {
      type: 'trade',
      delta: { foundation: -10 },
      text: '逛逛商店',
      nextDelay: 5000,
    }
  }

  // 3. 有道心（精力）？战斗或修炼
  if (state.heart > 20) {
    const wantToFarm = Math.random() < 0.7 // 70% 概率刷怪
    if (wantToFarm) {
      return {
        type: 'combat',
        delta: {
          cultivation: 10 + Math.floor(Math.random() * 10),
          foundation: 2 + Math.floor(Math.random() * 3),
        },
        text: '战斗中...',
        nextDelay: 3000,
      }
    } else {
      return {
        type: 'cultivate',
        delta: {
          cultivation: 5 + Math.floor(Math.random() * 5),
          foundation: 1 + Math.floor(Math.random() * 2),
        },
        text: '修炼中...',
        nextDelay: 5000,
      }
    }
  }

  // 4. 可以探索新区域？
  if (canExplore(state) && Math.random() < 0.1) {
    return {
      type: 'explore',
      delta: {},
      text: '探索新区域...',
      nextDelay: 10000,
    }
  }

  // 6. 默认：休息恢复
  return {
    type: 'rest',
    delta: { heart: 5 },
    text: '冥想恢复...',
    nextDelay: 10000,
  }
}

// ─────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────

/**
 * 判断是否可以突破
 */
function canBreakthrough(state: PlayerState): boolean {
  const realmThresholds: Record<string, number> = {
    novice: 100,
    炼气: 200,
    筑基: 500,
    金丹: 1000,
    元婴: 2000,
    化神: 5000,
    渡劫: 10000,
    真仙: 20000,
    金仙: 50000,
    大罗金仙: 100000,
    道祖: Infinity,
  }

  const threshold = realmThresholds[state.realm] || 100
  return state.cultivation >= threshold
}

/**
 * 判断是否可以探索
 */
function canExplore(state: PlayerState): boolean {
  // 简单的探索条件：道心高于50且有一定修为
  return state.heart > 50 && state.cultivation > 50
}

// ─────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────

export { evaluateBehaviorTree as runPlayerBehavior }
