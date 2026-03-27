/**
 * AI 生成内容类型定义
 * 对应白皮书 v5.0 中的 AI 生成内容清单
 */

// ─────────────────────────────────────────────────────────────
// 功法
// ─────────────────────────────────────────────────────────────

export type TechniqueRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Technique {
  id: string
  name: string
  description: string
  effect: string
  rarity: TechniqueRarity
  realm: string // 对应境界：炼气/筑基/金丹...
  cultivationCost: number // 修炼所需灵石
}

// ─────────────────────────────────────────────────────────────
// 怪物
// ─────────────────────────────────────────────────────────────

export interface Monster {
  id: string
  name: string
  description: string
  skills: string[]
  drops: string[]
  realm: string // 所在境界
  difficulty: number // 难度 1-10
  hp: number
  attack: number
  defense: number
}

// ─────────────────────────────────────────────────────────────
// 道具/装备
// ─────────────────────────────────────────────────────────────

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material'

export interface Item {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  effect: string
  value: number // 售价
}

// ─────────────────────────────────────────────────────────────
// 随机事件
// ─────────────────────────────────────────────────────────────

export interface EventOption {
  text: string
  result: string
  effects?: {
    cultivation?: number
    foundation?: number
    heart?: number
    spirit?: number
  }
}

export interface RandomEvent {
  id: string
  title: string
  description: string
  options: EventOption[]
}

// ─────────────────────────────────────────────────────────────
// NPC
// ─────────────────────────────────────────────────────────────

export type NPCType = 'elder' | 'merchant' | 'wanderer' | 'monster'

export interface NPC {
  id: string
  name: string
  type: NPCType
  background: string
  personality: string
  dialogueStyle: string
  zone: string // 所在区域
}

// ─────────────────────────────────────────────────────────────
// 区域背景
// ─────────────────────────────────────────────────────────────

export interface ZoneBackground {
  zoneId: string
  legend: string // 传说
  history: string // 历史
  background: string // 背景描述
}

// ─────────────────────────────────────────────────────────────
// 天劫
// ─────────────────────────────────────────────────────────────

export interface Tribulation {
  id: string
  name: string
  description: string
  challenge: string // 挑战内容
  difficulty: number // 难度 1-10
  successReward: {
    cultivation: number
    realm: string // 突破后的境界
  }
  failurePenalty: {
    heart: number
    cultivation: number
  }
}

// ─────────────────────────────────────────────────────────────
// 世界事件
// ─────────────────────────────────────────────────────────────

export interface WorldEvent {
  id: string
  title: string
  description: string
  type: 'faction_war' | 'heaven_omen' | 'disaster' | 'opportunity'
  effects: string[]
}

// ─────────────────────────────────────────────────────────────
// 生成请求
// ─────────────────────────────────────────────────────────────

export interface GenerateTechniqueParams {
  realm: string // 当前境界
  realmLevel: number // 境界层级 1-10
}

export interface GenerateMonsterParams {
  zone: string // 区域名称
  realm: string // 境界要求
}

export interface GenerateEventParams {
  playerRealm: string
  playerZone: string
}

export interface GenerateNPCParams {
  zone: string
  realm: string
}

export interface GenerateZoneBackgroundParams {
  zone: string
  realm: string
}

export interface GenerateTribulationParams {
  currentRealm: string
  targetRealm: string
}

export interface GenerateWorldEventParams {
  // 可选参数
}
