#!/usr/bin/env node
import { program } from "commander";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, rmSync } from "fs";
import { DB_PATH, CONFIG_PATH, APP_DIR } from "./shared/constants.js";

// ── 读取 package.json 版本号 ──────────────────────────────────
const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let version = "0.1.0";
try {
  // 从编译后的 dist/ 往上找 package.json
  const pkgPath = join(__dirname, "..", "package.json");
  if (existsSync(pkgPath)) {
    const pkg = require(pkgPath) as { version: string };
    version = pkg.version;
  }
} catch {
  // 忽略，使用默认版本号
}

// ── CLI 定义 ──────────────────────────────────────────────────

program
  .name("xian")
  .description("码界修仙记 — A terminal RPG powered by your Git commits")
  .version(version, "-v, --version", "显示版本号");

// ── 默认命令：启动游戏 ────────────────────────────────────────
// 无子命令时直接启动主游戏（main.tsx 处理）
program
  .option("-d, --dir <path>", "指定监听的 Git 仓库目录（覆盖配置文件）")
  .option("--no-color", "禁用颜色输出")
  .action(async (options: { dir?: string; color: boolean }) => {
    // 将选项传递给 main，通过环境变量
    if (options.dir) {
      process.env["XIAN_WATCH_DIR"] = options.dir;
    }
    if (!options.color) {
      process.env["NO_COLOR"] = "1";
    }
    // 动态导入 main.tsx，避免 CLI 解析时触发 Ink 初始化
    const { main } = await import("./main.js");
    await main();
  });

// ── status：快速查看状态（不启动 TUI） ────────────────────────
program
  .command("status")
  .description("快速查看角色当前状态（不启动游戏界面）")
  .action(async () => {
    try {
      const { initDb } = await import("./storage/index.js");
      const { loadConfig } = await import("./config/index.js");
      const nodeMachineId = await import("node-machine-id");
      const { machineIdSync } = (
        nodeMachineId as unknown as {
          default: { machineIdSync: (original?: boolean) => string };
        }
      ).default;
      const { loadFullPlayerState } =
        await import("./storage/repositories/player.repo.js");
      const { REALM_LABELS, FACTION_LABELS } =
        await import("./shared/constants.js");

      loadConfig();
      await initDb();

      const id = machineIdSync(true);
      const state = loadFullPlayerState(id);

      if (!state) {
        console.log("⚠  尚未入道。请运行 xian 开始游戏。");
        process.exit(0);
      }

      const realmLabel = REALM_LABELS[state.realm] ?? state.realm;
      const factionLabel = FACTION_LABELS[state.faction] ?? state.faction;

      console.log("");
      console.log(`  ⋆ ${state.name}  [${factionLabel}]`);
      console.log(`  境界  ${realmLabel}    声望  ${state.prestige}`);
      console.log("");
      console.log(
        `  修为  ${Math.floor(state.cultivation).toString().padStart(6)}`,
      );
      console.log(
        `  根基  ${Math.floor(state.foundation).toString().padStart(6)} / 100`,
      );
      console.log(
        `  幻力  ${Math.floor(state.vibe).toString().padStart(6)} / 100`,
      );
      console.log(
        `  道心  ${Math.floor(state.heart).toString().padStart(6)} / 100`,
      );
      console.log("");

      if (state.lastCommitAt > 0) {
        const mins = Math.floor((Date.now() - state.lastCommitAt) / 60_000);
        const timeStr =
          mins < 60
            ? `${mins} 分钟前`
            : `${Math.floor(mins / 60)} 小时 ${mins % 60} 分钟前`;
        console.log(`  最近 commit：${timeStr}`);
        console.log("");
      }
    } catch (err) {
      console.error("读取状态失败：", err);
      process.exit(1);
    }
  });

// ── reset：重置存档 ───────────────────────────────────────────
program
  .command("reset")
  .description("重置存档（删除角色数据，保留配置文件）")
  .option("-y, --yes", "跳过确认直接重置")
  .action(async (options: { yes?: boolean }) => {
    if (!options.yes) {
      const { createInterface } = await import("readline");
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      await new Promise<void>((resolve) => {
        rl.question(
          "⚠  确认重置存档？所有修炼进度将永久丢失。(y/N) ",
          (answer: string) => {
            rl.close();
            if (answer.trim().toLowerCase() !== "y") {
              console.log("已取消。");
              process.exit(0);
            }
            resolve();
          },
        );
      });
    }

    if (existsSync(DB_PATH)) {
      rmSync(DB_PATH);
      console.log("✓ 存档已删除。");
    } else {
      console.log("没有找到存档文件。");
    }
    console.log("  下次启动 xian 时将重新入道。");
  });

// ── config：打开配置文件 ──────────────────────────────────────
program
  .command("config")
  .description("显示配置文件路径，并用默认编辑器打开")
  .option("--path", "只打印配置文件路径，不打开编辑器")
  .action(async (options: { path?: boolean }) => {
    console.log(`配置文件：${CONFIG_PATH}`);

    if (options.path) {
      process.exit(0);
    }

    // 确保配置文件存在
    const { loadConfig } = await import("./config/index.js");
    loadConfig();

    if (!existsSync(CONFIG_PATH)) {
      console.log("配置文件不存在，请先运行 xian 生成默认配置。");
      process.exit(1);
    }

    // 用系统默认编辑器打开
    const { exec } = await import("child_process");
    const openCmd =
      process.platform === "win32"
        ? `start "" "${CONFIG_PATH}"`
        : process.platform === "darwin"
          ? `open "${CONFIG_PATH}"`
          : `xdg-open "${CONFIG_PATH}" 2>/dev/null || nano "${CONFIG_PATH}"`;

    exec(openCmd, (err) => {
      if (err) {
        console.log("无法自动打开编辑器，请手动编辑：");
        console.log(`  ${CONFIG_PATH}`);
      }
    });
  });

// ── doctor：诊断环境 ──────────────────────────────────────────
program
  .command("doctor")
  .description("检查运行环境（Git、Node 版本、配置文件等）")
  .action(async () => {
    console.log("\n  xian 环境诊断\n");

    // Node 版本
    const nodeVer = process.version;
    const nodeMajor = parseInt(nodeVer.slice(1));
    const nodeOk = nodeMajor >= 18;
    console.log(
      `  Node.js  ${nodeVer}  ${nodeOk ? "✓" : "✗ (需要 >= 18.0.0)"}`,
    );

    // Git 可用性
    const { exec } = await import("child_process");
    await new Promise<void>((resolve) => {
      exec("git --version", (err, stdout) => {
        if (err) {
          console.log("  Git      未找到  ✗ (xian 需要 Git 来感知提交活动)");
        } else {
          const gitVer = stdout.trim().replace("git version ", "");
          console.log(`  Git      ${gitVer}  ✓`);
        }
        resolve();
      });
    });

    // 配置文件
    const cfgExists = existsSync(CONFIG_PATH);
    console.log(
      `  配置     ${CONFIG_PATH}  ${cfgExists ? "✓" : "（将在首次启动时自动创建）"}`,
    );

    // 存档文件
    const dbExists = existsSync(DB_PATH);
    console.log(`  存档     ${DB_PATH}  ${dbExists ? "✓" : "（尚未入道）"}`);

    // 应用目录
    const dirExists = existsSync(APP_DIR);
    console.log(`  数据目录 ${APP_DIR}  ${dirExists ? "✓" : "（将自动创建）"}`);

    console.log("");
  });

// ── 解析参数 ──────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err: unknown) => {
  console.error("启动失败：", err);
  process.exit(1);
});
