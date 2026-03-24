import simpleGit from 'simple-git';
import type { CommitInfo } from './signal.types.js';

/**
 * GitWatcher
 * 轮询指定目录的 Git 活动，检测新 commit
 * 只读取 hash / message / diff stat，不读取代码内容
 */
export class GitWatcher {
  private lastHash: string = '';
  private initialized: boolean = false;

  /**
   * 轮询一次 Git 活动
   * @param cwd 监听的 Git 仓库目录
   * @returns 新的 CommitInfo，若无新 commit 则返回 null
   */
  async poll(cwd: string): Promise<CommitInfo | null> {
    try {
      const git = simpleGit(cwd);

      // 检查是否是 git 仓库
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return null;

      const log = await git.log({ maxCount: 1 });
      const latest = log.latest;

      if (!latest) return null;

      // 首次初始化：记录当前 hash，不触发事件
      if (!this.initialized) {
        this.lastHash = latest.hash;
        this.initialized = true;
        return null;
      }

      // 无新 commit
      if (latest.hash === this.lastHash) return null;

      // 有新 commit：获取 diff stat（只统计行数，不读内容）
      let insertions = 0;
      let deletions = 0;

      try {
        if (this.lastHash) {
          const diff = await git.diffSummary([`${this.lastHash}..HEAD`]);
          insertions = diff.insertions;
          deletions  = diff.deletions;
        }
      } catch {
        // diff 失败时（如首次 commit 无父节点）使用 0
      }

      this.lastHash = latest.hash;

      return {
        hash:       latest.hash.slice(0, 8),
        message:    latest.message,
        insertions,
        deletions,
      };
    } catch {
      // 非 git 仓库或 git 未安装，静默忽略
      return null;
    }
  }

  /** 重置监听状态（切换目录时调用） */
  reset(): void {
    this.lastHash    = '';
    this.initialized = false;
  }
}
