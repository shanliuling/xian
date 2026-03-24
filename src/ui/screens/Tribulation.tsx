import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import type {
  TribulationData,
  TribulationChoice,
} from "../../engine/engine.types.js";
import { FACTION_LABELS, type FactionKey } from "../../shared/constants.js";

// ── Props ─────────────────────────────────────────────────────

export interface TribulationProps {
  data: TribulationData;
  onComplete: (choiceId: string | null) => void;
}

// ── 倒计时颜色 ────────────────────────────────────────────────

function getTimerColor(timeLeft: number, total: number): string {
  const pct = timeLeft / total;
  if (pct > 0.5) return "greenBright";
  if (pct > 0.25) return "yellowBright";
  return "redBright";
}

// ── 倒计时进度条 ──────────────────────────────────────────────

function buildTimerBar(timeLeft: number, total: number, width: number): string {
  const pct = Math.min(Math.max(timeLeft / total, 0), 1);
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

// ── 路径标签颜色 ──────────────────────────────────────────────

const PATH_COLORS: Record<FactionKey, string> = {
  orthodox: "greenBright",
  vibe: "magentaBright",
  unbound: "yellowBright",
};

const PATH_BADGE: Record<FactionKey, string> = {
  orthodox: "⚖",
  vibe: "✦",
  unbound: "◈",
};

// ── 选项组件 ──────────────────────────────────────────────────

interface ChoiceRowProps {
  choice: TribulationChoice;
  isSelected: boolean;
  isRevealed: boolean; // 选择完成后显示结果
  resultText?: string;
}

const ChoiceRow: React.FC<ChoiceRowProps> = ({
  choice,
  isSelected,
  isRevealed,
  resultText,
}) => {
  const pathColor = PATH_COLORS[choice.path] ?? "white";
  const badge = PATH_BADGE[choice.path] ?? "·";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        {/* 选中指示器 */}
        <Text color={isSelected ? "cyanBright" : "gray"}>
          {isSelected ? "❯ " : "  "}
        </Text>

        {/* 按键提示 */}
        <Box
          borderStyle="round"
          borderColor={isSelected ? "cyanBright" : "gray"}
          paddingX={1}
          marginRight={1}
        >
          <Text color={isSelected ? "cyanBright" : "gray"} bold>
            {choice.key}
          </Text>
        </Box>

        {/* 路径标记 */}
        <Text color={pathColor as Parameters<typeof Text>[0]["color"]}>
          {badge}{" "}
        </Text>
        <Text color={pathColor as Parameters<typeof Text>[0]["color"]} dimColor>
          {`[${FACTION_LABELS[choice.path]}]`}
          {"  "}
        </Text>

        {/* 选项文案 */}
        <Text color={isSelected ? "white" : "gray"} bold={isSelected}>
          {choice.label}
        </Text>
      </Box>

      {/* 结果揭示（选择后显示） */}
      {isRevealed && isSelected && resultText && (
        <Box marginLeft={6} marginTop={0}>
          <Text color="yellowBright" italic>
            {"→ "}
            {resultText}
          </Text>
        </Box>
      )}
    </Box>
  );
};

// ── 主组件 ────────────────────────────────────────────────────

export const Tribulation: React.FC<TribulationProps> = ({
  data,
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState(data.timeLimit);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [columns] = useTerminalSize();
  const width = Math.min(columns - 4, 72);

  // ── 倒计时 ─────────────────────────────────────────────────

  useEffect(() => {
    if (resolved) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // 超时：触发失败
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  // ── 超时处理 ───────────────────────────────────────────────

  const handleTimeout = useCallback(() => {
    if (resolved) return;
    setResolved(true);
    setShowResult(true);

    // 延迟 2 秒后关闭，让玩家看到超时信息
    setTimeout(() => {
      onComplete(null);
    }, 2500);
  }, [resolved, onComplete]);

  // ── 选择处理 ───────────────────────────────────────────────

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (resolved) return;
      setResolved(true);
      setSelectedKey(choiceId);
      setShowResult(true);

      // 延迟 2.5 秒后关闭，让玩家看到结果文案
      setTimeout(() => {
        onComplete(choiceId);
      }, 2500);
    },
    [resolved, onComplete],
  );

  // ── 键盘输入 ───────────────────────────────────────────────

  useInput((input) => {
    if (resolved) return;

    const upper = input.toUpperCase();
    const choice = data.choices.find((c) => c.key === upper);
    if (choice) {
      handleChoice(choice.id);
    }
  });

  // ── 渲染辅助 ───────────────────────────────────────────────

  const timerColor = getTimerColor(timeLeft, data.timeLimit);
  const timerBar = buildTimerBar(timeLeft, data.timeLimit, 24);
  const isTimeout = resolved && selectedKey === null;
  const selectedChoice = data.choices.find((c) => c.id === selectedKey);

  // ── 渲染 ───────────────────────────────────────────────────

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} width={columns}>
      {/* ── 顶部标题带 ── */}
      <Box marginBottom={1} flexDirection="column">
        <Box>
          <Text color="redBright" bold>
            {"⚡ 天劫降临 ⚡"}
          </Text>
          <Text color="gray">{"  —  "}</Text>
          <Text color="white" bold>
            {data.title}
          </Text>
        </Box>
        <Box>
          <Text color="gray" dimColor>
            {"─".repeat(Math.min(width, 60))}
          </Text>
        </Box>
      </Box>

      {/* ── 倒计时 ── */}
      {!resolved && (
        <Box marginBottom={1} flexDirection="row" alignItems="center" gap={2}>
          <Text color="gray">{"剩余时间  "}</Text>
          <Text color={timerColor as Parameters<typeof Text>[0]["color"]} bold>
            {timerBar}
          </Text>
          <Text color={timerColor as Parameters<typeof Text>[0]["color"]} bold>
            {`  ${String(timeLeft).padStart(3)}s`}
          </Text>
        </Box>
      )}

      {/* ── 剧情描述 ── */}
      <Box
        flexDirection="column"
        marginBottom={1}
        paddingX={2}
        paddingY={1}
        borderStyle="single"
        borderColor="yellow"
        width={Math.min(width, 68)}
      >
        {data.description.split("\n").map((line, idx) => (
          <Text key={idx} color={line.trim() === "" ? "gray" : "white"}>
            {line}
          </Text>
        ))}
      </Box>

      {/* ── 选项列表 ── */}
      {!showResult && (
        <Box flexDirection="column" marginTop={1} marginBottom={1}>
          <Box marginBottom={1}>
            <Text color="gray">{"如何应对？按对应字母键选择："}</Text>
          </Box>

          {data.choices.map((choice) => (
            <ChoiceRow
              key={choice.id}
              choice={choice}
              isSelected={false}
              isRevealed={false}
            />
          ))}
        </Box>
      )}

      {/* ── 结果揭示区（选择后） ── */}
      {showResult && !isTimeout && selectedChoice && (
        <Box flexDirection="column" marginTop={1}>
          <Box marginBottom={1}>
            <Text color="cyanBright" bold>
              {"✓ 你的选择："}
            </Text>
            <Text color="white" bold>
              {selectedChoice.label}
            </Text>
          </Box>

          <ChoiceRow
            choice={selectedChoice}
            isSelected={true}
            isRevealed={true}
            resultText={selectedChoice.resultText}
          />

          {/* 数值变化摘要 */}
          <Box marginTop={1} flexDirection="row" gap={3}>
            {selectedChoice.delta.cultivation !== 0 && (
              <Text color="blueBright">
                {`修为 ${selectedChoice.delta.cultivation > 0 ? "+" : ""}${selectedChoice.delta.cultivation.toFixed(0)}`}
              </Text>
            )}
            {selectedChoice.delta.foundation !== 0 && (
              <Text color="greenBright">
                {`根基 ${selectedChoice.delta.foundation > 0 ? "+" : ""}${selectedChoice.delta.foundation.toFixed(0)}`}
              </Text>
            )}
            {selectedChoice.delta.vibe !== 0 && (
              <Text color="magentaBright">
                {`幻力 ${selectedChoice.delta.vibe > 0 ? "+" : ""}${selectedChoice.delta.vibe.toFixed(0)}`}
              </Text>
            )}
            {selectedChoice.delta.heart !== 0 && (
              <Text
                color={
                  selectedChoice.delta.heart > 0 ? "yellowBright" : "redBright"
                }
              >
                {`道心 ${selectedChoice.delta.heart > 0 ? "+" : ""}${selectedChoice.delta.heart.toFixed(0)}`}
              </Text>
            )}
            {selectedChoice.delta.prestige !== 0 && (
              <Text color="cyanBright">
                {`声望 ${selectedChoice.delta.prestige > 0 ? "+" : ""}${selectedChoice.delta.prestige.toFixed(0)}`}
              </Text>
            )}
          </Box>

          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {"即将返回修炼界面..."}
            </Text>
          </Box>
        </Box>
      )}

      {/* ── 超时结果 ── */}
      {isTimeout && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color="redBright" bold>
              {"✗ 天劫超时！境界突破失败。"}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="red">
              {"未能在时限内做出决断，修为受损，道心动摇。"}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="gray" dimColor>
              {"即将返回修炼界面..."}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
