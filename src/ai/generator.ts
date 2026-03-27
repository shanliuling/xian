/**
 * AI 内容生成器核心
 * 支持多种 Provider：OpenAI / DeepSeek / Ollama
 */

import { getConfig } from '../config/index.js'
import { cleanJsonResponse } from './prompts.js'
import type {
  Technique,
  Monster,
  Item,
  RandomEvent,
  NPC,
  ZoneBackground,
  Tribulation,
  WorldEvent,
  GenerateTechniqueParams,
  GenerateMonsterParams,
  GenerateEventParams,
  GenerateNPCParams,
  GenerateZoneBackgroundParams,
  GenerateTribulationParams,
} from './types.js'
import {
  techniquePrompt,
  monsterPrompt,
  itemPrompt,
  eventPrompt,
  npcPrompt,
  zoneBackgroundPrompt,
  tribulationPrompt,
  worldEventPrompt,
} from './prompts.js'

// ─────────────────────────────────────────────────────────────
// 生成器类
// ─────────────────────────────────────────────────────────────

export class ContentGenerator {
  private cache: Map<string, unknown> = new Map()
  private cooldownMs: number = 60000 // 冷却时间 1 分钟

  /**
   * 调用 AI API
   */
  private async callAI(prompt: string): Promise<string> {
    const config = getConfig()
    const { provider, apiKey, model, baseUrl } = config.ai

    if (!apiKey) {
      throw new Error('AI API Key 未配置，请在 config 中设置')
    }

    const url = baseUrl || this.getProviderUrl(provider)
    const headers = this.getProviderHeaders(provider, apiKey)
    const body = this.getProviderBody(provider, prompt, model)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API 调用失败: ${response.status} - ${error}`)
    }

    return this.parseProviderResponse(provider, response)
  }

  /**
   * 获取 Provider URL
   */
  private getProviderUrl(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions'
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages'
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions'
      case 'custom':
        return 'http://localhost:11434/v1/chat/completions' // Ollama 默认
      default:
        return 'https://api.openai.com/v1/chat/completions'
    }
  }

  /**
   * 获取 Provider 请求头
   */
  private getProviderHeaders(
    provider: string,
    apiKey: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'custom':
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
    }

    return headers
  }

  /**
   * 获取 Provider 请求体
   */
  private getProviderBody(
    provider: string,
    prompt: string,
    model: string,
  ): Record<string, unknown> {
    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'custom':
        return {
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是一个修仙游戏的内容生成器，请严格按照 JSON 格式返回。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }
      case 'anthropic':
        return {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
        }
      default:
        return { model, messages: [{ role: 'user', content: prompt }] }
    }
  }

  /**
   * 解析 Provider 响应
   */
  private async parseProviderResponse(
    provider: string,
    response: Response,
  ): Promise<string> {
    const data = (await response.json()) as Record<string, unknown>

    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'custom': {
        const choices = data.choices as Array<{ message: { content: string } }>
        return choices?.[0]?.message?.content || ''
      }
      case 'anthropic': {
        const content = data.content as Array<{ text: string }>
        return content?.[0]?.text || ''
      }
      default:
        return ''
    }
  }

  /**
   * 生成并缓存
   */
  private async generate<T>(
    cacheKey: string,
    generateFn: () => Promise<T>,
  ): Promise<T> {
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached as T
    }

    // 生成内容
    const result = await generateFn()

    // 存入缓存
    this.cache.set(cacheKey, result)

    return result
  }

  // ─────────────────────────────────────────────────────────────
  // 公开方法
  // ─────────────────────────────────────────────────────────────

  /**
   * 生成功法
   */
  async generateTechnique(params: GenerateTechniqueParams): Promise<Technique> {
    const { realm, realmLevel } = params
    const prompt = techniquePrompt(realm, realmLevel)
    const cacheKey = `technique:${realm}:${realmLevel}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as Technique
    })
  }

  /**
   * 生成怪物
   */
  async generateMonster(params: GenerateMonsterParams): Promise<Monster> {
    const { zone, realm } = params
    const prompt = monsterPrompt(zone, realm)
    const cacheKey = `monster:${zone}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as Monster
    })
  }

  /**
   * 生成道具
   */
  async generateItem(
    monsterDrop: boolean = false,
    context?: string,
  ): Promise<Item> {
    const prompt = itemPrompt(monsterDrop, context)
    const cacheKey = `item:${monsterDrop}:${context || 'shop'}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as Item
    })
  }

  /**
   * 生成随机事件
   */
  async generateEvent(params: GenerateEventParams): Promise<RandomEvent> {
    const { playerRealm, playerZone } = params
    const prompt = eventPrompt(playerRealm, playerZone)
    const cacheKey = `event:${playerRealm}:${playerZone}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as RandomEvent
    })
  }

  /**
   * 生成 NPC
   */
  async generateNPC(params: GenerateNPCParams): Promise<NPC> {
    const { zone, realm } = params
    const prompt = npcPrompt(zone, realm)
    const cacheKey = `npc:${zone}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as NPC
    })
  }

  /**
   * 生成区域背景
   */
  async generateZoneBackground(
    params: GenerateZoneBackgroundParams,
  ): Promise<ZoneBackground> {
    const { zone, realm } = params
    const prompt = zoneBackgroundPrompt(zone, realm)
    const cacheKey = `zonebg:${zone}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as ZoneBackground
    })
  }

  /**
   * 生成天劫
   */
  async generateTribulation(
    params: GenerateTribulationParams,
  ): Promise<Tribulation> {
    const { currentRealm, targetRealm } = params
    const prompt = tribulationPrompt(currentRealm, targetRealm)
    const cacheKey = `tribulation:${currentRealm}:${targetRealm}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as Tribulation
    })
  }

  /**
   * 生成世界事件
   */
  async generateWorldEvent(): Promise<WorldEvent> {
    const prompt = worldEventPrompt()
    const cacheKey = `worldevent:${Date.now()}`

    return this.generate(cacheKey, async () => {
      const response = await this.callAI(prompt)
      const json = cleanJsonResponse(response)
      return JSON.parse(json) as WorldEvent
    })
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ─────────────────────────────────────────────────────────────
// 导出单例
// ─────────────────────────────────────────────────────────────

export const contentGenerator = new ContentGenerator()
