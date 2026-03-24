import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import type { PlayerState } from "../../engine/engine.types.js";
import type { EventLogEntry } from "../../engine/engine.types.js";
import { StatBarPair, CultivationBar } from "../components/StatBar.js";
import { EventLog } from "../components/EventLog.js";
import {
  REALM_LABELS,
  FACTION_LABELS,
  REALM_THRESHOLDS,
  type RealmKey,
} from "../../shared/constants.js";
import { getNextRealm, getNextRealmThreshold } from "../../engine/realm.js";
import { formatMinutes } from "../../shared/utils.js";
import { renderWorldNewsBatch } from "../../narrative/template-engine.js";
import { getConfig } from "../../config/index.js";

// ── Props ─────────────────────────────────────────────────────

interface MainHUDProps {
  state: PlayerState;
  eventLog: EventLogEntry[];
}

// ── 命令帮助 ──────────────────────────────────────────────────

const COMMANDS: Array<{ key: string; desc: string }> = [
  { key: "help", desc: "显示帮助" },
  { key: "status", desc: "角色状态" },
  { key: "q/quit", desc: "退出游戏" },
];

// ── 分隔线 ────────────────────────────────────────────────────

const HRule: React.FC<{ width?: number; char?: string }> = ({
  width = 60,
  char = "─",
}) => (
  <Box>
    <Text color="gray" dimColor>
      {char.repeat(width)}
    </Text>
  </Box>
);

// ── 角色信息头部 ──────────────────────────────────────────────

interface PlayerHeaderProps {
  state: PlayerState;
  columns: number;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ state, columns }) => {
  const realmLabel = REALM_LABELS[state.realm as RealmKey] ?? state.realm;
  const factionLabel = FACTION_LABELS[state.faction] ?? state.faction;

  return (
    <Box flexDirection="row" justifyContent="space-between" width={columns - 4}>
      {/* 左侧：道号 + 宗门 */}
      <Box gap={2}>
        <Text color="cyanBright" bold>
          {"⋆ "}
          {state.name}
        </Text>
        <Text color="gray">{"│"}</Text>
        <Text color="white">{state.sect}</Text>
        <Text color="gray">{"│"}</Text>
        <Text color="yellow">{factionLabel}</Text>
      </Box>

      {/* 右侧：境界 + 声望 */}
      <Box gap={2}>
        <Text color="magentaBright" bold>
          {realmLabel}
        </Text>
        <Text color="gray">{"│"}</Text>
        <Text color="cyan">{"声望 "}</Text>
        <Text color="cyanBright">{state.prestige}</Text>
      </Box>
    </Box>
  );
};

// ── 数值面板 ──────────────────────────────────────────────────

interface StatsPanelProps {
  state: PlayerState;
  columns: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ state, columns }) => {
  const nextRealm = getNextRealm(state.realm as RealmKey);
  const nextThreshold = getNextRealmThreshold(state.realm as RealmKey);
  const currThreshold = REALM_THRESHOLDS[state.realm as RealmKey];

  return (
    <Box flexDirection="column" width={columns - 4} gap={0}>
      {/* 修为进度条（境界内进度） */}
      <CultivationBar
        cultivation={state.cultivation}
        realmMin={currThreshold}
        realmMax={nextThreshold}
        width={Math.max(20, Math.floor((columns - 20) / 2))}
      />

      <Box marginTop={0}>
        {/* 第一行：道心 + 根基 */}
        <StatBarPair
          left={{
            label: "道心",
            value: state.heart,
            max: 100,
            variant: "heart",
            width: 12,
          }}
          right={{
            label: "根基",
            value: state.foundation,
            max: 100,
            variant: "foundation",
            width: 12,
          }}
        />
      </Box>

      <Box>
        {/* 第二行：幻力 + 声望（声望无上限，显示绝对值） */}
        <StatBarPair
          left={{
            label: "幻力",
            value: state.vibe,
            max: 100,
            variant: "vibe",
            width: 12,
          }}
          right={{
            label: "声望",
            value: Math.min(state.prestige, 9999),
            max: 9999,
            variant: "prestige",
            width: 12,
            showPct: false,
          }}
        />
      </Box>

      {/* 道心幻觉警告 */}
      {state.vibeRotLevel >= 1 && (
        <Box marginTop={0}>
          <VibeRotWarning level={state.vibeRotLevel} />
        </Box>
      )}

      {/* 下一境界提示 */}
      {nextRealm && nextThreshold !== null && (
        <Box marginTop={0}>
          <Text color="gray" dimColor>
            {"  → "}
          </Text>
          <Text color="magenta">{REALM_LABELS[nextRealm]}</Text>
          <Text color="gray" dimColor>
            {`  还差 ${Math.max(0, Math.ceil(nextThreshold - state.cultivation))} 修为`}
          </Text>
        </Box>
      )}
    </Box>
  );
};

// ── 道心幻觉警告条 ────────────────────────────────────────────

interface VibeRotWarningProps {
  level: number;
}

const VibeRotWarning: React.FC<VibeRotWarningProps> = ({ level }) => {
  const configs = [
    { color: "yellow", icon: "⚠", text: "轻度幻觉：幻力略超根基，道心波动" },
    {
      color: "redBright",
      icon: "⚠⚠",
      text: "中度幻觉：道心承压，需降低幻力依赖",
    },
    {
      color: "redBright",
      icon: "🚨",
      text: "重度幻觉！幻力失控，根基随时崩塌",
    },
  ];
  const cfg = configs[Math.min(level - 1, 2)];

  return (
    <Box>
      <Text color={cfg.color as Parameters<typeof Text>[0]["color"]} bold>
        {`  ${cfg.icon} ${cfg.text}`}
      </Text>
    </Box>
  );
};

// ── 灵境感应面板 ──────────────────────────────────────────────

interface SensingPanelProps {
  state: PlayerState;
}

const SensingPanel: React.FC<SensingPanelProps> = ({ state }) => {
  const now = Date.now();
  const lastCommit = state.lastCommitAt;
  const elapsedMins =
    lastCommit > 0 ? Math.floor((now - lastCommit) / 60_000) : -1;

  const statusText =
    elapsedMins < 0
      ? "尚未感知到任何 commit"
      : elapsedMins < 60
        ? `上次功德：${formatMinutes(elapsedMins)} 前`
        : `冥想摸鱼中，已 ${formatMinutes(elapsedMins)} 无功德`;

  const statusColor =
    elapsedMins < 0
      ? "gray"
      : elapsedMins < 30
        ? "greenBright"
        : elapsedMins < 60
          ? "green"
          : elapsedMins < 240
            ? "yellow"
            : "redBright";

  return (
    <Box flexDirection="row" gap={2}>
      <Text color="gray">{"灵境感应"}</Text>
      <Text color="gray">{"│"}</Text>
      <Text color={statusColor as Parameters<typeof Text>[0]["color"]}>
        {statusText}
      </Text>
      {elapsedMins >= 60 && (
        <Text color="gray" dimColor>
          {"  道心缓慢恢复中..."}
        </Text>
      )}
    </Box>
  );
};

// ── 世界快报面板 ──────────────────────────────────────────────

interface WorldNewsPanelProps {
  news: string[];
}

const WorldNewsPanel: React.FC<WorldNewsPanelProps> = ({ news }) => {
  return (
    <Box flexDirection="column">
      <Text bold color="white">
        {"码界快报"}
      </Text>
      {news.map((item, idx) => (
        <Box key={idx}>
          <Text color="cyan" dimColor>
            {"  · "}
          </Text>
          <Text color="cyan">{item}</Text>
        </Box>
      ))}
    </Box>
  );
};

// ── 命令行输入 ────────────────────────────────────────────────

interface CommandBarProps {
  input: string;
  commands: typeof COMMANDS;
  message?: string;
}

const CommandBar: React.FC<CommandBarProps> = ({
  input,
  commands,
  message,
}) => {
  return (
    <Box flexDirection="column">
      {/* 快捷命令提示 */}
      <Box gap={3}>
        {commands.map((cmd) => (
          <Text key={cmd.key} color="gray" dimColor>
            {`[${cmd.key}]`}
          </Text>
        ))}
        <Text color="gray" dimColor>
          {"  Ctrl+B: 隐匿术"}
        </Text>
      </Box>

      {/* 命令输入行 */}
      <Box>
        <Text color="cyan">{"> "}</Text>
        <Text color="white">{input}</Text>
        <Text color="cyanBright">{"█"}</Text>
      </Box>

      {/* 命令执行结果 */}
      {message && (
        <Box>
          <Text color="yellowBright">{`  ${message}`}</Text>
        </Box>
      )}
    </Box>
  );
};

// ── 命令解析 ──────────────────────────────────────────────────

function executeCommand(cmd: string, state: PlayerState): string {
  const trimmed = cmd.trim().toLowerCase();

  switch (trimmed) {
    case "help":
      return "可用命令：status · quit · help";

    case "status": {
      const realmLabel = REALM_LABELS[state.realm as RealmKey] ?? state.realm;
      return [
        `道号：${state.name}  境界：${realmLabel}  声望：${state.prestige}`,
        `修为：${Math.floor(state.cultivation)}  根基：${Math.floor(state.foundation)}  幻力：${Math.floor(state.vibe)}  道心：${Math.floor(state.heart)}`,
      ].join("\n");
    }

    case "q":
    case "quit":
    case "exit":
      // 退出由 App 层处理（process.emit SIGINT）
      process.emit("SIGINT");
      return "正在退出...";

    case "":
      return "";

    default:
      return `未知命令：${trimmed}。输入 help 查看帮助。`;
  }
}

// ── MainHUD 主组件 ────────────────────────────────────────────

export const MainHUD: React.FC<MainHUDProps> = ({ state, eventLog }) => {
  const [columns, rows] = useTerminalSize();
  const config = getConfig();

  const [cmdInput, setCmdInput] = useState("");
  const [cmdResult, setCmdResult] = useState("");
  const [news, setNews] = useState<string[]>([]);

  // 启动时生成世界快报（只生成一次）
  useEffect(() => {
    setNews(renderWorldNewsBatch(2));
  }, []);

  // ── 键盘输入处理 ────────────────────────────────────────────
  useInput((input, key) => {
    // Boss Key 由上层 App 处理，这里忽略 Ctrl 组合键
    if (key.ctrl || key.meta) return;

    if (key.return) {
      const result = executeCommand(cmdInput, state);
      setCmdResult(result);
      setCmdInput("");
    } else if (key.backspace || key.delete) {
      setCmdInput((prev) => prev.slice(0, -1));
      if (cmdResult) setCmdResult("");
    } else if (input && input.length === 1) {
      setCmdInput((prev) => prev + input);
      if (cmdResult) setCmdResult("");
    }
  });

  // ── 自动清除命令结果 ─────────────────────────────────────────
  useEffect(() => {
    if (!cmdResult) return;
    const t = setTimeout(() => setCmdResult(""), 4000);
    return () => clearTimeout(t);
  }, [cmdResult]);

  // 计算日志可显示行数
  const reservedLines = 18; // header + stats + sensing + news + cmdbar
  const logLines = Math.max(
    config.ui.logLines,
    Math.min(rows - reservedLines, 12),
  );

  const effectiveWidth = Math.min(columns, 100);

  // ── 渲染 ────────────────────────────────────────────────────
  return (
    <Box
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      width={effectiveWidth}
    >
      {/* ── 角色头部 ── */}
      <Box paddingX={1} paddingY={0}>
        <PlayerHeader state={state} columns={effectiveWidth} />
      </Box>

      <HRule width={effectiveWidth - 2} char="═" />

      {/* ── 数值面板 ── */}
      <Box paddingX={1} paddingY={0} flexDirection="column">
        <StatsPanel state={state} columns={effectiveWidth} />
      </Box>

      <HRule width={effectiveWidth - 2} />

      {/* ── 灵境感应 ── */}
      <Box paddingX={1}>
        <SensingPanel state={state} />
      </Box>

      <HRule width={effectiveWidth - 2} />

      {/* ── 修炼日志 ── */}
      <Box paddingX={1} paddingY={0}>
        <EventLog
          entries={eventLog}
          maxLines={logLines}
          width={effectiveWidth - 4}
          title="修炼日志"
        />
      </Box>

      {/* ── 世界快报 ── */}
      {news.length > 0 && (
        <>
          <HRule width={effectiveWidth - 2} />
          <Box paddingX={1}>
            <WorldNewsPanel news={news} />
          </Box>
        </>
      )}

      <HRule width={effectiveWidth - 2} char="═" />

      {/* ── 命令行 ── */}
      <Box paddingX={1}>
        <CommandBar input={cmdInput} commands={COMMANDS} message={cmdResult} />
      </Box>
    </Box>
  );
};
