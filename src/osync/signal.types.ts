// src/osync/signal.types.ts
// OSync 感知层信号类型定义（Git-only 版本）

// ── Commit 信息 ───────────────────────────────────────────────

export interface CommitInfo {
  /** commit hash（短） */
  hash: string;
  /** commit message */
  message: string;
  /** 新增行数 */
  insertions: number;
  /** 删除行数 */
  deletions: number;
}

// ── 原始信号 ──────────────────────────────────────────────────

/**
 * OSync 每轮轮询产生的归一化信号
 * 只包含 Git 活动信息，不涉及进程/CPU 监控
 */
export interface RawSignal {
  /** 信号产生时间戳（ms） */
  timestamp: number;
  /** 本轮检测到的新 commit，无则为 null */
  newCommit: CommitInfo | null;
  /** 当前小时（0-23），用于夜修加成判断 */
  hour: number;
  /** 距上一次 commit 的分钟数，用于"冥想摸鱼"检测 */
  minutesSinceLastCommit: number;
}

// ── commit 规模分级 ───────────────────────────────────────────

export type CommitSize = 'small' | 'medium' | 'large';

/**
 * 根据改动行数判断 commit 规模
 * small:  < 50 行
 * medium: 50 ~ 300 行
 * large:  > 300 行
 */
export function getCommitSize(insertions: number, deletions: number): CommitSize {
  const total = insertions + deletions;
  if (total < 50)  return 'small';
  if (total < 300) return 'medium';
  return 'large';
}
