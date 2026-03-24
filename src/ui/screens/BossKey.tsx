import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { getConfig } from "../../config/index.js";
import type { BossKeyTheme } from "../../shared/constants.js";

// ── 日志行生成器 ──────────────────────────────────────────────

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

function randomVersion(): string {
  return `${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`;
}

function randomPkg(): string {
  const pkgs = [
    "lodash",
    "react",
    "typescript",
    "express",
    "axios",
    "webpack",
    "babel-core",
    "eslint",
    "prettier",
    "jest",
    "vite",
    "rollup",
    "esbuild",
    "@types/node",
    "zod",
    "prisma",
    "drizzle-orm",
    "tailwindcss",
    "next",
    "nuxt",
    "vue",
    "solid-js",
    "svelte",
    "astro",
    "remix",
    "fastify",
    "hono",
    "trpc",
    "graphql",
    "mongoose",
  ];
  return pkgs[Math.floor(Math.random() * pkgs.length)];
}

function randomMs(): string {
  return `${Math.floor(Math.random() * 5000)}ms`;
}

// ── npm install 日志生成器 ─────────────────────────────────────

const NPM_PHASES = [
  () =>
    `npm warn deprecated ${randomPkg()}@${randomVersion()}: This package is no longer supported.`,
  () =>
    `npm warn deprecated ${randomPkg()}@${randomVersion()}: Please use a newer version.`,
  () => `added ${Math.floor(Math.random() * 50 + 1)} packages in ${randomMs()}`,
  () =>
    `npm http fetch GET 200 https://registry.npmjs.org/${randomPkg()}/-/${randomPkg()}-${randomVersion()}.tgz`,
  () =>
    `npm timing idealTree:node_modules/${randomPkg()} Completed in ${randomMs()}`,
  () =>
    `WARN notsup SKIPPING OPTIONAL DEPENDENCY: ${randomPkg()}@${randomVersion()}`,
  () =>
    `npm timing reifyNode:node_modules/${randomPkg()} Completed in ${randomMs()}`,
  () =>
    `postinstall ${randomPkg()}@${randomVersion()} node scripts/postinstall.js`,
  () =>
    `gyp info ${["it worked if it ends with ok", "spawn", "build", "ok"][Math.floor(Math.random() * 4)]}`,
  () => `${Math.floor(Math.random() * 1000)} packages are looking for funding`,
  () => `  run \`npm fund\` for details`,
  () =>
    `found ${Math.floor(Math.random() * 10)} ${Math.random() > 0.5 ? "low" : "moderate"} severity vulnerabilities`,
  () =>
    `up to date, audited ${Math.floor(Math.random() * 500 + 100)} packages in ${randomMs()}`,
];

function generateNpmLog(): string {
  const gen = NPM_PHASES[Math.floor(Math.random() * NPM_PHASES.length)];
  return gen();
}

// ── git log 日志生成器 ────────────────────────────────────────

const GIT_SUBJECTS = [
  "fix: resolve null pointer exception in auth middleware",
  "feat: add pagination support to user list endpoint",
  "refactor: extract validation logic into shared module",
  "chore: update dependencies to latest versions",
  "docs: improve README setup instructions",
  "fix: correct date formatting in report generator",
  "feat: implement rate limiting for API endpoints",
  "test: add unit tests for payment service",
  "style: fix linting errors across codebase",
  "perf: optimize database query for dashboard metrics",
  "fix: handle edge case in CSV parser",
  "feat: add dark mode support",
  "refactor: migrate from callbacks to async/await",
  "chore: clean up unused imports",
  "fix: prevent XSS in user input fields",
  "feat: integrate Stripe payment gateway",
  "docs: add API documentation for v2 endpoints",
  "build: configure CI/CD pipeline for staging",
  "fix: resolve race condition in cache invalidation",
  "feat: implement websocket notifications",
];

const GIT_AUTHORS = [
  "Alice Chen",
  "Bob Zhang",
  "Carol Li",
  "David Wang",
  "Emma Liu",
  "Frank Wu",
  "Grace Xu",
  "Henry Ma",
  "Iris Tang",
  "Jack Zhao",
  "Kate Sun",
  "Leo Qian",
];

function generateGitLog(): string {
  const hash = randomHex(7);
  const author = GIT_AUTHORS[Math.floor(Math.random() * GIT_AUTHORS.length)];
  const days = Math.floor(Math.random() * 30);
  const subject = GIT_SUBJECTS[Math.floor(Math.random() * GIT_SUBJECTS.length)];
  const daysStr =
    days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;

  const formats = [
    () => `${hash}  ${subject}`,
    () => `${hash} (HEAD -> main) ${subject}`,
    () => `${hash} (origin/main) ${subject}`,
    () => `commit ${randomHex(40)}`,
    () =>
      `Author: ${author} <${author.toLowerCase().replace(" ", ".")}@example.com>`,
    () => `Date:   ${daysStr}`,
    () => `    ${subject}`,
    () => ``,
  ];

  const fmt = formats[Math.floor(Math.random() * formats.length)];
  return fmt();
}

// ── docker build 日志生成器 ───────────────────────────────────

let _dockerStep = 0;
const DOCKER_TOTAL = Math.floor(Math.random() * 8 + 8);

const DOCKER_LINES = [
  () => {
    _dockerStep = Math.min(_dockerStep + 1, DOCKER_TOTAL);
    return `Step ${_dockerStep}/${DOCKER_TOTAL} : RUN apt-get update && apt-get install -y curl`;
  },
  () => ` ---> Running in ${randomHex(12)}`,
  () => `Get:1 http://deb.debian.org/debian bullseye InRelease [116 kB]`,
  () =>
    `Get:2 http://security.debian.org/debian-security bullseye-security InRelease [48.4 kB]`,
  () =>
    `Fetched ${Math.floor(Math.random() * 50 + 5)} MB in ${Math.floor(Math.random() * 10 + 1)}s (${Math.floor(Math.random() * 5 + 1)} MB/s)`,
  () => `Reading package lists...`,
  () => `Building dependency tree...`,
  () => `The following NEW packages will be installed: ${randomPkg()}`,
  () => `0 upgraded, ${Math.floor(Math.random() * 10 + 1)} newly installed`,
  () => `Removing intermediate container ${randomHex(12)}`,
  () => ` ---> ${randomHex(12)}`,
  () => `Successfully built ${randomHex(12)}`,
  () => `Successfully tagged myapp:latest`,
  () => `COPY . .`,
  () => `RUN npm ci --only=production`,
  () => `npm warn lockfile missing integrity`,
  () => `EXPOSE 3000`,
  () => `CMD ["node", "dist/main.js"]`,
];

function generateDockerLog(): string {
  const gen = DOCKER_LINES[Math.floor(Math.random() * DOCKER_LINES.length)];
  return gen();
}

// ── kubectl logs 日志生成器 ────────────────────────────────────

const KUBECTL_LOG_LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"];
const KUBECTL_SERVICES = [
  "api-gateway",
  "auth-service",
  "user-service",
  "payment-service",
  "notification-worker",
  "scheduler",
  "analytics-processor",
];
const KUBECTL_MESSAGES = [
  "Request received: GET /api/v1/users",
  "Database connection established",
  "Cache miss for key: user:session:{}",
  "Processing job queue: {} items pending",
  "Health check passed",
  "Request completed in {}ms",
  "Retrying failed request (attempt {}/3)",
  "Config reloaded successfully",
  "Memory usage: {}MB / 512MB",
  "Graceful shutdown initiated",
  "New connection from 10.0.{}.{}",
  "Token validation successful for user:{}",
  "Rate limit applied: {} req/s exceeded",
  "Worker thread {} started",
  "Batch job completed: {} records processed",
];

function generateKubectlLog(): string {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const level =
    KUBECTL_LOG_LEVELS[Math.floor(Math.random() * KUBECTL_LOG_LEVELS.length)];
  const service =
    KUBECTL_SERVICES[Math.floor(Math.random() * KUBECTL_SERVICES.length)];
  const rawMsg =
    KUBECTL_MESSAGES[Math.floor(Math.random() * KUBECTL_MESSAGES.length)];

  const msg = rawMsg
    .replace("{}", String(Math.floor(Math.random() * 1000)))
    .replace("{}", String(Math.floor(Math.random() * 100)))
    .replace("{}", String(Math.floor(Math.random() * 255)));

  const levelColor: Record<string, string> = {
    INFO: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
    DEBUG: "\x1b[90m",
  };

  const reset = "\x1b[0m";
  return `${now}  ${levelColor[level]}${level.padEnd(5)}${reset}  ${service}  ${msg}`;
}

// ── 主题配置表 ────────────────────────────────────────────────

const THEME_CONFIG: Record<
  BossKeyTheme,
  { title: string; generate: () => string; intervalMs: number }
> = {
  npm: {
    title: "npm install",
    generate: generateNpmLog,
    intervalMs: 160,
  },
  git: {
    title: "git log --oneline --graph",
    generate: generateGitLog,
    intervalMs: 220,
  },
  docker: {
    title: "docker build -t myapp .",
    generate: generateDockerLog,
    intervalMs: 300,
  },
  kubectl: {
    title: "kubectl logs -f deployment/api-gateway",
    generate: generateKubectlLog,
    intervalMs: 120,
  },
};

// ── BossKey 组件 ──────────────────────────────────────────────

interface BossKeyProps {
  /** 主题，不传则读取配置文件 */
  theme?: BossKeyTheme;
}

export const BossKey: React.FC<BossKeyProps> = ({ theme: themeProp }) => {
  const config = getConfig();
  const theme = themeProp ?? config.bossKey.theme;
  const themeConf = THEME_CONFIG[theme];

  const [columns] = useTerminalSize();
  const maxLines = 40;

  const [lines, setLines] = useState<string[]>(() => {
    // 初始填充若干行，避免界面空白
    const initial: string[] = [];
    for (let i = 0; i < 10; i++) {
      initial.push(themeConf.generate());
    }
    return initial;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLines((prev) => {
        const newLine = themeConf.generate();
        const next = [...prev, newLine];
        // 保留最近 maxLines 条
        return next.length > maxLines
          ? next.slice(next.length - maxLines)
          : next;
      });
    }, themeConf.intervalMs);

    return () => clearInterval(timer);
  }, [theme, themeConf]);

  return (
    <Box flexDirection="column" width={columns}>
      {/* 标题栏 */}
      <Box marginBottom={0}>
        <Text color="green" bold>
          {"$ "}
        </Text>
        <Text color="white">{themeConf.title}</Text>
      </Box>

      {/* 滚动日志 */}
      {lines.map((line, idx) => (
        <LogLine key={idx} content={line} />
      ))}
    </Box>
  );
};

// ── 单行渲染（处理 ANSI escape codes 直通） ───────────────────

interface LogLineProps {
  content: string;
}

const LogLine: React.FC<LogLineProps> = ({ content }) => {
  // 空行
  if (content === "") {
    return (
      <Box>
        <Text> </Text>
      </Box>
    );
  }

  // warn 行
  if (content.includes("warn") || content.includes("WARN")) {
    return (
      <Box>
        <Text color="yellow">{content}</Text>
      </Box>
    );
  }

  // error / ERROR 行
  if (content.includes("ERROR") || content.includes("error")) {
    return (
      <Box>
        <Text color="red">{content}</Text>
      </Box>
    );
  }

  // success 行（built / tagged / up to date）
  if (
    content.includes("Successfully") ||
    content.includes("up to date") ||
    content.includes("added ")
  ) {
    return (
      <Box>
        <Text color="greenBright">{content}</Text>
      </Box>
    );
  }

  // commit hash 行（git 模式）
  if (/^[0-9a-f]{7,40}/.test(content)) {
    return (
      <Box>
        <Text color="yellowBright">{content.slice(0, 7)}</Text>
        <Text color="white">{content.slice(7)}</Text>
      </Box>
    );
  }

  // 默认灰白
  return (
    <Box>
      <Text color="white">{content}</Text>
    </Box>
  );
};
