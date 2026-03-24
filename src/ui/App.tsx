import React, { useState, useEffect, useCallback } from "react";
import { Box, Text } from "ink";
import type { GameEngine } from "../engine/index.js";
import type { TribulationData } from "../engine/engine.types.js";
import type { OnboardingData } from "./screens/Onboarding.js";
import { useGameState } from "./hooks/useGameState.js";
import { useBossKey } from "./hooks/useBossKey.js";
import { Onboarding } from "./screens/Onboarding.js";
import { MainHUD } from "./screens/MainHUD.js";
import { Tribulation } from "./screens/Tribulation.js";
import { BossKey } from "./screens/BossKey.js";

// ── 屏幕路由类型 ──────────────────────────────────────────────

type Screen = "loading" | "onboarding" | "main" | "tribulation" | "bosskey";

// ── Props ─────────────────────────────────────────────────────

interface AppProps {
  engine: GameEngine;
}

// ── 加载中组件 ────────────────────────────────────────────────

const LoadingScreen: React.FC = () => (
  <Box paddingX={2} paddingY={1} flexDirection="column">
    <Text color="cyanBright" bold>
      {"xian — 码界修仙记"}
    </Text>
    <Text color="gray">{"正在初始化，请稍候..."}</Text>
  </Box>
);

// ── 根组件 ────────────────────────────────────────────────────

export const App: React.FC<AppProps> = ({ engine }) => {
  const [screen, setScreen] = useState<Screen>("loading");
  const [prevScreen, setPrevScreen] = useState<Screen>("main");
  const [tribulation, setTribulation] = useState<TribulationData | null>(null);

  const { player, eventLog, isReady } = useGameState(engine);

  // ── 初始化：判断是否需要入道仪式 ──────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const hasPlayer = await engine.load();
        setScreen(hasPlayer ? "main" : "onboarding");
      } catch {
        setScreen("onboarding");
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 监听天劫触发 ────────────────────────────────────────────

  useEffect(() => {
    const onTribulation = (data: TribulationData) => {
      setTribulation(data);
      setScreen("tribulation");
    };

    engine.on("tribulation", onTribulation);
    return () => {
      engine.off("tribulation", onTribulation);
    };
  }, [engine]);

  // ── Boss Key：Ctrl+B 切换伪装界面 ──────────────────────────

  useBossKey(
    () => {
      if (screen === "main") {
        setPrevScreen("main");
        setScreen("bosskey");
      }
    },
    () => {
      if (screen === "bosskey") {
        setScreen(prevScreen);
      }
    },
  );

  // ── 入道完成回调 ────────────────────────────────────────────

  const handleOnboardingComplete = useCallback(
    (data: OnboardingData) => {
      engine.createPlayer(data.name, data.sect, data.faction, data.traits);
      setScreen("main");
    },
    [engine],
  );

  // ── 天劫完成回调 ────────────────────────────────────────────

  const handleTribulationComplete = useCallback(
    (choiceId: string | null) => {
      engine.resolveTribulation(choiceId ?? "timeout");
      setTribulation(null);
      setScreen("main");
    },
    [engine],
  );

  // ── 渲染 ────────────────────────────────────────────────────

  switch (screen) {
    case "loading":
      return <LoadingScreen />;

    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;

    case "tribulation":
      if (!tribulation) {
        return <LoadingScreen />;
      }
      return (
        <Tribulation
          data={tribulation}
          onComplete={handleTribulationComplete}
        />
      );

    case "bosskey":
      return <BossKey />;

    case "main":
    default:
      if (!isReady || !player) {
        return <LoadingScreen />;
      }
      return <MainHUD state={player} eventLog={eventLog} />;
  }
};
