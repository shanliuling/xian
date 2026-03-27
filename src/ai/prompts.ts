/**
 * AI 生成 Prompt 模板
 * 包含所有内容类型的生成指令
 */

// ─────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────

/**
 * 清理 AI 返回的 JSON 字符串
 * 移除 markdown 代码块标记
 */
export function cleanJsonResponse(response: string): string {
  return response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

// ─────────────────────────────────────────────────────────────
// 功法生成 Prompt
// ─────────────────────────────────────────────────────────────

export function techniquePrompt(realm: string, realmLevel: number): string {
  return `你是码界修仙世界的功法生成器。

当前玩家境界：${realm}（第${realmLevel}层）

请生成一个修仙功法的完整信息，要求：
1. 修仙风格，融入程序员/代码相关的梗
2. 名称要有仙风道骨的感觉，比如"九转灵元诀"、"太初归一功"等
3. 描述要体现功法的特性和效果
4. 效果要用游戏数值表示
5. 稀有度根据境界层级：前3层普通，4-6层稀有，7-9层史诗，10层传奇

请返回以下 JSON 格式：
{
  "name": "功法名称",
  "description": "功法描述（50字以内）",
  "effect": "修炼效果描述，如：提升根基+5",
  "rarity": "common|rare|epic|legendary",
  "cultivationCost": 100
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 怪物生成 Prompt
// ─────────────────────────────────────────────────────────────

export function monsterPrompt(zone: string, realm: string): string {
  return `你是码界修仙世界的怪物生成器。

区域：${zone}
境界要求：${realm}

请生成一个该区域的怪物，要求：
1. 修仙风格，融入程序员/代码/Bug相关的梗
2. 怪物名称要有威慑力，如"逻辑门妖"、"进程恶灵"等
3. 描述怪物的外形和特性
4. 技能要与程序员/代码概念相关
5. 掉落物品要与该区域相关

请返回以下 JSON 格式：
{
  "name": "怪物名称",
  "description": "怪物描述（30字以内）",
  "skills": ["技能1", "技能2"],
  "drops": ["掉落物品1", "掉落物品2"],
  "difficulty": 5,
  "hp": 500,
  "attack": 50,
  "defense": 20
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 道具生成 Prompt
// ─────────────────────────────────────────────────────────────

export function itemPrompt(
  monsterDrop: boolean = false,
  context?: string,
): string {
  const contextInfo = monsterDrop ? `怪物掉落物品：${context}` : `商店刷新物品`

  return `你是码界修仙世界的道具生成器。

${contextInfo}

请生成一个道具/装备，要求：
1. 修仙风格，融入程序员/代码相关的梗
2. 道具名称要有仙风道骨的感觉
3. 类型可以是：weapon(武器)、armor(防具)、consumable(消耗品)、material(材料)
4. 稀有度：common|rare|epic|legendary
5. 效果要具体

请返回以下 JSON 格式：
{
  "name": "道具名称",
  "description": "道具描述（20字以内）",
  "type": "weapon|armor|consumable|material",
  "rarity": "common|rare|epic|legendary",
  "effect": "效果描述，如：攻击力+10",
  "value": 100
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 随机事件生成 Prompt
// ─────────────────────────────────────────────────────────────

export function eventPrompt(playerRealm: string, playerZone: string): string {
  return `你是码界修仙世界的随机事件生成器。

玩家当前境界：${playerRealm}
玩家所在区域：${playerZone}

请生成一个随机事件，要求：
1. 修仙风格，融入程序员/代码相关的梗
2. 事件要有趣且有选择分支
3. 每个选项要有明确的结果和数值影响
4. 可以是奇遇、顿悟、挑战、对话等类型

请返回以下 JSON 格式：
{
  "title": "事件标题",
  "description": "事件描述（60字以内）",
  "options": [
    {
      "text": "选项1文字",
      "result": "选项1结果描述",
      "effects": {
        "cultivation": 10,
        "heart": 5
      }
    },
    {
      "text": "选项2文字",
      "result": "选项2结果描述"
    }
  ]
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// NPC 生成 Prompt
// ─────────────────────────────────────────────────────────────

export function npcPrompt(zone: string, realm: string): string {
  return `你是码界修仙世界的 NPC 生成器。

区域：${zone}
境界要求：${realm}

请生成一个该区域的 NPC，要求：
1. 修仙风格，融入程序员/代码相关的梗
2. NPC 名称要有仙风道骨的感觉
3. 类型可以是：elder(宗门长老)、merchant(商贩)、wanderer(散修)
4. 背景故事要与该区域相关
5. 性格特征要鲜明
6. 对话风格要有特色

请返回以下 JSON 格式：
{
  "name": "NPC名称",
  "type": "elder|merchant|wanderer",
  "background": "背景故事（50字以内）",
  "personality": "性格描述，如：严肃、慈祥、神秘",
  "dialogueStyle": "对话风格，如：文言文、幽默、直言不讳"
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 区域背景生成 Prompt
// ─────────────────────────────────────────────────────────────

export function zoneBackgroundPrompt(zone: string, realm: string): string {
  return `你是码界修仙世界的区域背景生成器。

区域：${zone}
所属境界：${realm}

请生成该区域的背景故事，要求：
1. 修仙风格，融入程序员/代码/技术相关的梗
2. 传说要有神秘感，可以引用一些"古代大能"、"神秘遗迹"等概念
3. 历史要合理，可以包含一些宗门的兴衰
4. 背景描述要让人有代入感

请返回以下 JSON 格式：
{
  "zoneId": "${zone}",
  "legend": "区域传说（80字以内）",
  "history": "区域历史（60字以内）",
  "background": "背景描述（40字以内）"
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 天劫生成 Prompt
// ─────────────────────────────────────────────────────────────

export function tribulationPrompt(
  currentRealm: string,
  targetRealm: string,
): string {
  return `你是码界修仙世界的天劫生成器。

当前境界：${targetRealm}
突破后境界：${targetRealm}

请生成一个对应境界的天劫，要求：
1. 修仙风格，融入程序员/代码/技术面试相关的梗
2. 天劫名称要有威慑力
3. 挑战内容要与程序员的"劫难"相关，如：代码评审大劫、需求变更雷劫、生产事故大劫、面试问心劫等
4. 难度要匹配境界
5. 奖励和惩罚要合理

请返回以下 JSON 格式：
{
  "name": "天劫名称",
  "description": "天劫描述（30字以内）",
  "challenge": "挑战内容描述",
  "difficulty": 7,
  "successReward": {
    "cultivation": 1000,
    "realm": "${targetRealm}"
  },
  "failurePenalty": {
    "heart": 20,
    "cultivation": 100
  }
}

请直接返回 JSON，不要其他内容。`
}

// ─────────────────────────────────────────────────────────────
// 世界事件生成 Prompt
// ─────────────────────────────────────────────────────────────

export function worldEventPrompt(): string {
  return `你是码界修仙世界的世界事件生成器。

请生成一个全局世界事件，要求：
1. 修仙风格，融入程序员/代码/技术圈相关的梗
2. 事件类型：faction_war(阵营战争)、heaven_omen(天地异象)、disaster(灾难)、opportunity(机遇)
3. 事件要有影响力，要能影响游戏世界

请返回以下 JSON 格式：
{
  "title": "事件标题",
  "description": "事件描述（60字以内）",
  "type": "faction_war|heaven_omen|disaster|opportunity",
  "effects": ["影响1", "影响2"]
}

请直接返回 JSON，不要其他内容。`
}
