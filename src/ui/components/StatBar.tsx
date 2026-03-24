import React from 'react';
import { Box, Text } from 'ink';

// ── 类型定义 ──────────────────────────────────────────────────

export type StatBarVariant =
  | 'cultivation'  // 修为 — 蓝色
  | 'foundation'   // 根基 — 绿色
  | 'vibe'         // 幻力 — 紫色
  | 'heart'        // 道心 — 黄色（低时变红）
  | 'prestige';    // 声望 — 青色

export interface StatBarProps {
  label:    string;
  value:    number;
  max:      number;
  variant:  StatBarVariant;
  width?:   number;   // 进度条字符宽度，默认 14
  showPct?: boolean;  // 是否显示百分比，默认 true
  compact?: boolean;  // 紧凑模式（单行，不显示标签换行），默认 false
}

// ── 颜色映射 ──────────────────────────────────────────────────

type InkColor =
  | 'blue' | 'cyan' | 'green' | 'magenta'
  | 'red'  | 'white' | 'yellow' | 'gray'
  | 'blueBright' | 'cyanBright' | 'greenBright'
  | 'magentaBright' | 'redBright' | 'yellowBright';

function getVariantColor(variant: StatBarVariant, pct: number): InkColor {
  switch (variant) {
    case 'cultivation':
      return 'blueBright';
    case 'foundation':
      return pct > 0.5 ? 'greenBright' : 'green';
    case 'vibe':
      return pct > 0.7 ? 'magentaBright' : 'magenta';
    case 'heart':
      // 道心低于 30% 变红，低于 50% 变黄
      if (pct < 0.3) return 'redBright';
      if (pct < 0.5) return 'yellow';
      return 'yellowBright';
    case 'prestige':
      return 'cyanBright';
    default:
      return 'white';
  }
}

function getLabelColor(variant: StatBarVariant): InkColor {
  switch (variant) {
    case 'cultivation': return 'blue';
    case 'foundation':  return 'green';
    case 'vibe':        return 'magenta';
    case 'heart':       return 'yellow';
    case 'prestige':    return 'cyan';
    default:            return 'white';
  }
}

// ── 进度条渲染 ────────────────────────────────────────────────

function buildBar(value: number, max: number, width: number): string {
  const pct    = max <= 0 ? 0 : Math.min(Math.max(value / max, 0), 1);
  const filled = Math.round(pct * width);
  const empty  = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function buildBarAscii(value: number, max: number, width: number): string {
  const pct    = max <= 0 ? 0 : Math.min(Math.max(value / max, 0), 1);
  const filled = Math.round(pct * width);
  const empty  = width - filled;
  return '#'.repeat(filled) + '-'.repeat(empty);
}

// ── 组件 ─────────────────────────────────────────────────────

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  max,
  variant,
  width    = 14,
  showPct  = true,
  compact  = false,
}) => {
  const pct        = max <= 0 ? 0 : Math.min(Math.max(value / max, 0), 1);
  const pctDisplay = `${Math.round(pct * 100)}%`.padStart(4);
  const bar        = buildBar(value, max, width);
  const barColor   = getVariantColor(variant, pct);
  const labelColor = getLabelColor(variant);

  // ── 警告装饰（道心过低） ────────────────────────────────────
  const showWarning = variant === 'heart' && pct < 0.3;

  if (compact) {
    // 单行紧凑模式：[标签] ████░░░░  72%
    return (
      <Box>
        <Text color={labelColor}>{label.padEnd(3)} </Text>
        <Text color={barColor}>{bar}</Text>
        {showPct && (
          <Text color="gray"> {pctDisplay}</Text>
        )}
        {showWarning && (
          <Text color="redBright"> ⚠</Text>
        )}
      </Box>
    );
  }

  // 标准模式：标签 + 进度条 + 数值
  return (
    <Box flexDirection="row" alignItems="center">
      {/* 标签 */}
      <Box width={4}>
        <Text color={labelColor} bold>{label}</Text>
      </Box>

      {/* 进度条 */}
      <Box marginX={1}>
        <Text color={barColor}>{bar}</Text>
      </Box>

      {/* 百分比 */}
      {showPct && (
        <Text color="gray">{pctDisplay}</Text>
      )}

      {/* 道心过低警告 */}
      {showWarning && (
        <Text color="redBright" bold> ⚠ 道心将碎</Text>
      )}
    </Box>
  );
};

// ── 双列布局的一对进度条 ──────────────────────────────────────

export interface StatBarPairProps {
  left:  StatBarProps;
  right: StatBarProps;
  gap?:  number;
}

/**
 * StatBarPair
 * 将两个 StatBar 并排展示（主 HUD 使用）
 * 例如：道心 ████░░░  72%     根基 ██████░  60%
 */
export const StatBarPair: React.FC<StatBarPairProps> = ({ left, right, gap = 4 }) => {
  return (
    <Box flexDirection="row">
      <Box flexGrow={1}>
        <StatBar {...left} compact />
      </Box>
      <Box width={gap} />
      <Box flexGrow={1}>
        <StatBar {...right} compact />
      </Box>
    </Box>
  );
};

// ── 修为进度条（特殊：显示境界内进度，而非 0-100） ────────────

export interface CultivationBarProps {
  cultivation:  number;  // 当前修为
  realmMin:     number;  // 当前境界门槛
  realmMax:     number | null;  // 下一境界门槛（null = 已满级）
  width?:       number;
}

export const CultivationBar: React.FC<CultivationBarProps> = ({
  cultivation,
  realmMin,
  realmMax,
  width = 20,
}) => {
  const isMaxRealm = realmMax === null;
  const pct        = isMaxRealm
    ? 1
    : realmMax! <= realmMin
      ? 1
      : Math.min((cultivation - realmMin) / (realmMax! - realmMin), 1);

  const pctDisplay = isMaxRealm ? '满级' : `${Math.round(pct * 100)}%`;
  const bar        = buildBar(pct, 1, width);

  return (
    <Box flexDirection="row" alignItems="center">
      <Text color="blue">{'修为 '}</Text>
      <Text color="blueBright">{bar}</Text>
      <Text color="gray"> {pctDisplay}</Text>
      {isMaxRealm && (
        <Text color="yellowBright" bold> 证道</Text>
      )}
    </Box>
  );
};
