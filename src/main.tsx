import React from "react";
import { render } from "ink";
import { loadConfig } from "./config/index.js";
import { initDb, closeDb } from "./storage/index.js";
import { OSync } from "./osync/index.js";
import { GameEngine } from "./engine/index.js";
import { App } from "./ui/App.js";

export async function main(): Promise<void> {
  // ── 1. 加载配置 ──────────────────────────────────────────────
  const config = loadConfig();

  // ── 2. 初始化数据库 ──────────────────────────────────────────
  await initDb();

  // ── 3. 创建引擎与感知层 ──────────────────────────────────────
  const engine = new GameEngine();
  const osync = new OSync(config);

  // ── 4. 连接感知层 → 引擎层 ───────────────────────────────────
  // engine.process() 内部会判断 state 是否存在，
  // Onboarding 未完成时 state 为 null，信号会被静默丢弃
  osync.on("signal", (signal) => {
    engine.process(signal);
  });

  // 启动 OSync（首次入道前信号会被引擎静默忽略，入道后自动生效）
  osync.start();

  // ── 5. 挂载 Ink 应用 ─────────────────────────────────────────
  const { unmount, waitUntilExit } = render(
    React.createElement(App, { engine }),
  );

  // ── 6. 优雅退出处理 ──────────────────────────────────────────
  const shutdown = async () => {
    osync.stop();
    await engine.save();
    closeDb();
    unmount();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });

  // 等待 Ink 应用自然退出（用户执行 quit 命令时）
  try {
    await waitUntilExit();
  } finally {
    osync.stop();
    await engine.save();
    closeDb();
  }
}

// 直接运行（非 CLI 模式）时自动调用
main().catch((err: unknown) => {
  console.error("[xian] Fatal error:", err);
  process.exit(1);
});
