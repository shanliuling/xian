import { EventEmitter } from 'events';
import { GitWatcher } from './git-watcher.js';
import type { RawSignal } from './signal.types.js';
import type { XianConfig } from '../config/config.types.js';

/**
 * OSync — 感知层主控（Git-only 版本）
 *
 * 职责：
 *   1. 定时轮询 Git 活动（默认每 10s）
 *   2. 将原始信号归一化为 RawSignal
 *   3. 通过 EventEmitter 向引擎层广播
 *
 * 事件：
 *   'signal' → RawSignal
 */
export class OSync extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  private gitWatcher: GitWatcher;
  private lastCommitAt: number = Date.now();

  constructor(private config: XianConfig) {
    super();
    this.gitWatcher = new GitWatcher();
  }

  // ── 启动 / 停止 ────────────────────────────────────────────

  start(): void {
    if (this.timer) return; // 防止重复启动

    // 立即执行一次（初始化 lastHash，不会触发 commit 事件）
    void this.poll();

    this.timer = setInterval(() => {
      void this.poll();
    }, this.config.osync.gitInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 切换监听目录（重置 GitWatcher 状态） */
  setWatchDir(dir: string): void {
    this.config.osync.watchDir = dir;
    this.gitWatcher.reset();
  }

  // ── 内部轮询 ────────────────────────────────────────────────

  private async poll(): Promise<void> {
    try {
      const commit = await this.gitWatcher.poll(this.config.osync.watchDir);

      const now  = Date.now();
      const hour = new Date(now).getHours();
      const minutesSinceLastCommit = Math.floor(
        (now - this.lastCommitAt) / 60_000
      );

      if (commit) {
        this.lastCommitAt = now;
      }

      const signal: RawSignal = {
        timestamp: now,
        newCommit: commit,
        hour,
        minutesSinceLastCommit,
      };

      this.emit('signal', signal);
    } catch {
      // 轮询出错不应崩溃，静默忽略
    }
  }
}
