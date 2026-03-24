import {
  REALM_KEYS,
  REALM_THRESHOLDS,
  REALM_LABELS,
  type RealmKey,
  type FactionKey,
} from '../shared/constants.js';
import type {
  PlayerState,
  TribulationData,
  TribulationChoice,
  StatDelta,
} from './engine.types.js';
import { emptyDelta } from './engine.types.js';

// ── 境界顺序 ──────────────────────────────────────────────────

/** 获取下一个境界，已是最终境界则返回 null */
export function getNextRealm(current: RealmKey): RealmKey | null {
  const idx = REALM_KEYS.indexOf(current);
  if (idx === -1 || idx >= REALM_KEYS.length - 1) return null;
  return REALM_KEYS[idx + 1];
}

/** 获取上一个境界 */
export function getPrevRealm(current: RealmKey): RealmKey | null {
  const idx = REALM_KEYS.indexOf(current);
  if (idx <= 0) return null;
  return REALM_KEYS[idx - 1];
}

// ── 境界进度 ──────────────────────────────────────────────────

/**
 * 当前境界内的进度百分比（0~1）
 * 用于 UI 进度条渲染
 */
export function getRealmProgress(
  cultivation: number,
  realm: RealmKey
): number {
  const current  = REALM_THRESHOLDS[realm];
  const next     = getNextRealmThreshold(realm);

  if (next === null) {
    // 已是最终境界，进度恒为 1
    return 1;
  }

  const span     = next - current;
  const progress = cultivation - current;
  return Math.min(Math.max(progress / span, 0), 1);
}

/** 到达下一境界所需的修为门槛，已是最终境界返回 null */
export function getNextRealmThreshold(realm: RealmKey): number | null {
  const next = getNextRealm(realm);
  if (!next) return null;
  return REALM_THRESHOLDS[next];
}

/** 当前境界的修为门槛 */
export function getCurrentRealmThreshold(realm: RealmKey): number {
  return REALM_THRESHOLDS[realm];
}

// ── 突破检测 ──────────────────────────────────────────────────

/**
 * 检测当前修为是否已达到下一境界的门槛
 * （达到门槛不会自动突破，需要通过天劫）
 */
export function canBreakthrough(state: PlayerState): boolean {
  const next = getNextRealm(state.realm);
  if (!next) return false;
  return state.cultivation >= REALM_THRESHOLDS[next];
}

/**
 * 确定玩家当前修为对应的正确境界
 * 用于数据修复或离线进度计算后的校验
 */
export function resolveRealm(cultivation: number): RealmKey {
  let resolved: RealmKey = 'novice';
  for (const key of REALM_KEYS) {
    if (cultivation >= REALM_THRESHOLDS[key]) {
      resolved = key;
    } else {
      break;
    }
  }
  return resolved;
}

// ── 天劫生成 ──────────────────────────────────────────────────

/** 为每个境界突破生成对应的天劫数据 */
export function generateTribulation(
  targetRealm: RealmKey,
  playerId: string
): TribulationData {
  const templates = TRIBULATION_TEMPLATES[targetRealm];
  // 随机选一个天劫模板
  const tpl = templates[Math.floor(Math.random() * templates.length)];

  return {
    id:          `${playerId}_${targetRealm}_${Date.now()}`,
    type:        tpl.type,
    realm:       targetRealm,
    title:       tpl.title,
    description: tpl.description,
    timeLimit:   tpl.timeLimit,
    choices:     tpl.choices,
  };
}

// ── 天劫模板表 ────────────────────────────────────────────────

interface TribulationTemplate {
  type:        TribulationData['type'];
  title:       string;
  description: string;
  timeLimit:   number;
  choices:     TribulationChoice[];
}

function makeChoice(
  key: string,
  id: string,
  label: string,
  path: FactionKey,
  delta: Partial<StatDelta>,
  resultText: string
): TribulationChoice {
  return {
    key,
    id,
    label,
    path,
    delta: { ...emptyDelta(), ...delta },
    resultText,
  };
}

const TRIBULATION_TEMPLATES: Record<RealmKey, TribulationTemplate[]> = {
  novice: [
    // 炼气 → 筑基
    {
      type:        'code_review',
      title:       '筑基天劫：第一次代码审查',
      description: `你的代码被前辈审阅。
PR 下出现了十七条评论，每一条都在质疑你的设计决策。
道心承压，如何应对？`,
      timeLimit: 60,
      choices: [
        makeChoice('A', 'orthodox_refactor', '[正道] 逐一回应，重构代码，以道理服人',
          'orthodox',
          { foundation: 10, heart: 5, cultivation: 20 },
          '你耐心重构，前辈点头认可。根基深固，筑基成功。'),
        makeChoice('B', 'vibe_ai', '[幻道] 调出 AI，快速生成修改，迅速合并',
          'vibe',
          { vibe: 10, cultivation: 15, heart: -5 },
          'PR 快速合并，但你隐约感到自己并未真正理解每处改动。幻力上涨，道心微损。'),
        makeChoice('C', 'unbound_discuss', '[无宗] 逐条讨论，有理有据地拒绝部分意见',
          'unbound',
          { foundation: 5, vibe: 3, heart: 3, cultivation: 18 },
          '你坚持了自己的判断，也接受了合理建议。无宗之道，均衡前进。'),
      ],
    },
  ],

  foundation: [
    // 筑基 → 金丹
    {
      type:        'requirement_change',
      title:       '金丹天劫：需求变更雷劫',
      description: `上线前三小时，产品经理走来。
"我们需要改一下核心逻辑，客户那边刚确认的。"
你盯着代码，感受到一股寒意。如何应对？`,
      timeLimit: 90,
      choices: [
        makeChoice('A', 'orthodox_refuse', '[正道] 评估风险，据理拒绝，要求排期',
          'orthodox',
          { foundation: 15, heart: 8, prestige: 10 },
          '你的风险评估说服了所有人，需求推到下一迭代。声望大增，金丹凝聚。'),
        makeChoice('B', 'vibe_rush', '[幻道] 开启 AI 加速，三小时强行完成',
          'vibe',
          { vibe: 15, cultivation: 30, heart: -10 },
          '你做到了。代码上线，但你知道有几处角落埋着隐患。幻力暴涨，道心有损。'),
        makeChoice('C', 'unbound_negotiate', '[无宗] 讨价还价，只做最小可行改动',
          'unbound',
          { foundation: 8, vibe: 5, prestige: 5, cultivation: 25 },
          '最小改动上线，后续排期大改。无宗行者，进退有度。'),
      ],
    },
  ],

  core: [
    // 金丹 → 元婴
    {
      type:        'prod_incident',
      title:       '元婴天劫：生产事故大劫',
      description: `凌晨三点，告警响起。
核心服务响应超时，错误率飙升到 40%。
Slack 里老板已经在线。你能做什么？`,
      timeLimit: 120,
      choices: [
        makeChoice('A', 'orthodox_rollback', '[正道] 立即回滚，保证稳定，再排查根因',
          'orthodox',
          { foundation: 20, heart: 10, prestige: 20 },
          '回滚成功，服务恢复。你写下复盘报告，根因清晰，正道声誉大涨。'),
        makeChoice('B', 'vibe_hotfix', '[幻道] 借助 AI 快速定位，热修复直接推生产',
          'vibe',
          { vibe: 20, cultivation: 50, heart: -15, prestige: 10 },
          'Hotfix 成功，老板松了口气。但这次经历让你对系统的掌握感愈发模糊。'),
        makeChoice('C', 'unbound_analyze', '[无宗] 快速定位根因，精准回滚特定变更',
          'unbound',
          { foundation: 12, vibe: 8, heart: 5, prestige: 15, cultivation: 40 },
          '精准处置，既快又稳。无宗之道，临危不乱。'),
      ],
    },
  ],

  nascent: [
    // 元婴 → 化神
    {
      type:        'interview',
      title:       '化神天劫：面试问心劫',
      description: `你坐在白板前。
面试官写下一道题："请设计一个分布式限流系统。"
这是你梦想公司的终面。道心承压至极。如何作答？`,
      timeLimit: 150,
      choices: [
        makeChoice('A', 'orthodox_design', '[正道] 从需求分析开始，一步步严谨推导',
          'orthodox',
          { foundation: 25, heart: 15, prestige: 30, cultivation: 60 },
          '面试官频频点头。你的严谨打动了他。化神之路，以稳为基。'),
        makeChoice('B', 'vibe_pattern', '[幻道] 直接给出业界成熟方案，快速讲清优劣',
          'vibe',
          { vibe: 25, cultivation: 55, prestige: 20, heart: -5 },
          '答案漂亮，但深挖时有一处你说不清楚。幻道修士，知其然而未必知其所以然。'),
        makeChoice('C', 'unbound_creative', '[无宗] 提出一个有创意的方案，坦承权衡取舍',
          'unbound',
          { foundation: 15, vibe: 12, heart: 8, prestige: 25, cultivation: 50 },
          '独特的思路让面试官眼前一亮。无宗行者，自有一番风骨。'),
      ],
    },
  ],

  spirit: [
    // 化神 → 渡劫
    {
      type:        'code_review',
      title:       '渡劫大劫：架构决策之战',
      description: `全组人望着你。
你提出的新架构方案与老架构相悖，将影响未来三年的技术走向。
质疑声不断，这是你职业生涯中最重要的技术决策。`,
      timeLimit: 180,
      choices: [
        makeChoice('A', 'orthodox_prove', '[正道] 用数据和 POC 证明方案可行',
          'orthodox',
          { foundation: 30, heart: 20, prestige: 50, cultivation: 100 },
          '数据说话。你用严密的论证赢得了所有人的认可。正道证道，大道自然。'),
        makeChoice('B', 'vibe_momentum', '[幻道] 展示 AI 辅助原型，以速度和效果震慑全场',
          'vibe',
          { vibe: 30, cultivation: 90, prestige: 40, heart: -10 },
          '原型震撼了所有人。但你知道，真正的技术债已悄然种下。'),
        makeChoice('C', 'unbound_synthesis', '[无宗] 融合新旧方案，提出渐进式迁移路径',
          'unbound',
          { foundation: 20, vibe: 15, heart: 12, prestige: 45, cultivation: 85 },
          '渐进之道，既保障稳定，又打开未来。无宗行者，此乃证道之姿。'),
      ],
    },
  ],

  tribulation: [
    // 已是最终境界，不应被触发
    {
      type:        'code_review',
      title:       '道已圆满',
      description: '你已证道，无需再历天劫。',
      timeLimit:   10,
      choices: [
        makeChoice('A', 'complete', '[完成] 接受圆满',
          'orthodox',
          { prestige: 100 },
          '你已抵达码界之巅。'),
      ],
    },
  ],
};

// ── 导出汇总 ──────────────────────────────────────────────────

export {
  TRIBULATION_TEMPLATES,
};

/** 获取境界的中文名 */
export function getRealmLabel(realm: RealmKey): string {
  return REALM_LABELS[realm];
}

/** 判断是否为最终境界 */
export function isFinalRealm(realm: RealmKey): boolean {
  return realm === REALM_KEYS[REALM_KEYS.length - 1];
}
