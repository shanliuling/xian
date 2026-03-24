import React from 'react';
import { Box, Text } from 'ink';
import type { EventLogEntry } from '../../engine/engine.types.js';
import { formatTime, truncate } from '../../shared/utils.js';
import type { EventType } from '../../shared/constants.js';

// ── 事件类型样式映射 ───────────────────────────────────────────

const EVENT_COLORS: Record<EventType, string> = {
  stat_change:  'green',
  achievement:  'yellow',
  news:         'cyan',
  ai_event:     'magentaBright',
  realm_up:     'yellowBright',
  tribulation:  'redBright',
};

const EVENT_PREFIX: Record<EventType, string> = {
  stat_change:  '·',
  achievement:  '★',
  news:         '»',
  ai_event:     '✦',
  realm_up:     '▲',
  tribulation:  '⚡',
};

// ── Props ─────────────────────────────────────────────────────

interface EventLogProps {
  entries:   EventLogEntry[];
  maxLines?: number;
  width?:    number;
  title?:    string;
}

// ── 组件 ──────────────────────────────────────────────────────

export const EventLog: React.FC<EventLogProps> = ({
  entries,
  maxLines = 8,
  width    = 60,
  title    = '修炼日志',
}) => {
  // 取最新的 maxLines 条，倒序展示（最新在上）
  const visible = entries.slice(0, maxLines);

  return (
    <Box flexDirection="column" width={width}>
      {/* 标题行 */}
      <Box marginBottom={0}>
        <Text bold color="white">
          {title}
        </Text>
      </Box>

      {/* 日志列表 */}
      {visible.length === 0 ? (
        <Box>
          <Text color="gray" dimColor>
            {'  暂无记录，等待第一次 commit...'}
          </Text>
        </Box>
      ) : (
        visible.map((entry, idx) => (
          <EventLogRow
            key={entry.id ?? idx}
            entry={entry}
            maxWidth={width - 2}
          />
        ))
      )}
    </Box>
  );
};

// ── 单行组件 ──────────────────────────────────────────────────

interface EventLogRowProps {
  entry:    EventLogEntry;
  maxWidth: number;
}

const EventLogRow: React.FC<EventLogRowProps> = ({ entry, maxWidth }) => {
  const eventType = entry.eventType as EventType;
  const color     = EVENT_COLORS[eventType] ?? 'white';
  const prefix    = EVENT_PREFIX[eventType] ?? '·';
  const timeStr   = formatTime(entry.timestamp);

  // 时间戳 + 前缀固定占 10 字符，剩余给内容
  const contentWidth = Math.max(maxWidth - 10, 20);
  const content      = truncate(entry.content, contentWidth);

  return (
    <Box>
      {/* 时间 */}
      <Text color="gray" dimColor>
        {'  '}
        {timeStr}
        {'  '}
      </Text>

      {/* 事件前缀 */}
      <Text color={color as Parameters<typeof Text>[0]['color']}>
        {prefix}
        {'  '}
      </Text>

      {/* 内容 */}
      <Text color={color as Parameters<typeof Text>[0]['color']}>
        {content}
      </Text>
    </Box>
  );
};
