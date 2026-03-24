import { getDb } from '../db.js';
import type { EventLogEntry } from '../../engine/engine.types.js';
import type { EventType } from '../../shared/constants.js';

// ── 写入 ──────────────────────────────────────────────────────

export function insertEvent(entry: Omit<EventLogEntry, 'id'>): void {
  const db = getDb();
  db.run(
    `INSERT INTO event_log (player_id, timestamp, event_type, content, params_json)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.playerId,
      entry.timestamp,
      entry.eventType,
      entry.content,
      entry.paramsJson ?? null,
    ]
  );
}

// ── 查询 ──────────────────────────────────────────────────────

/** 获取最近 N 条事件日志（倒序，最新在前） */
export function getRecentEvents(
  playerId: string,
  limit: number = 20
): EventLogEntry[] {
  const db = getDb();
  const result = db.exec(
    `SELECT id, player_id, timestamp, event_type, content, params_json
     FROM event_log
     WHERE player_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`,
    [playerId, limit]
  );

  if (!result.length || !result[0].values.length) return [];

  return result[0].values.map((row) => ({
    id:         row[0] as number,
    playerId:   row[1] as string,
    timestamp:  row[2] as number,
    eventType:  row[3] as EventType,
    content:    row[4] as string,
    paramsJson: row[5] as string | undefined,
  }));
}

/** 获取今日事件数量（用于成就检测等） */
export function getTodayEventCount(playerId: string): number {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = db.exec(
    `SELECT COUNT(*) FROM event_log
     WHERE player_id = ? AND timestamp >= ?`,
    [playerId, startOfDay.getTime()]
  );

  if (!result.length || !result[0].values.length) return 0;
  return result[0].values[0][0] as number;
}

/** 获取今日 commit 类型事件（stat_change 里包含 commit 的条目） */
export function getTodayCommitEvents(playerId: string): EventLogEntry[] {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = db.exec(
    `SELECT id, player_id, timestamp, event_type, content, params_json
     FROM event_log
     WHERE player_id = ? AND event_type = 'stat_change' AND timestamp >= ?
     ORDER BY timestamp DESC`,
    [playerId, startOfDay.getTime()]
  );

  if (!result.length || !result[0].values.length) return [];

  return result[0].values.map((row) => ({
    id:         row[0] as number,
    playerId:   row[1] as string,
    timestamp:  row[2] as number,
    eventType:  row[3] as EventType,
    content:    row[4] as string,
    paramsJson: row[5] as string | undefined,
  }));
}

// ── 统计 ──────────────────────────────────────────────────────

/**
 * 统计最近 N 天内有 commit 事件的天数
 * 用于"连续 N 日修炼"成就检测
 */
export function getActiveDaysInLastN(playerId: string, days: number): number {
  const db  = getDb();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = db.exec(
    `SELECT COUNT(DISTINCT date(timestamp / 1000, 'unixepoch', 'localtime'))
     FROM event_log
     WHERE player_id = ?
       AND event_type = 'stat_change'
       AND timestamp >= ?`,
    [playerId, since]
  );

  if (!result.length || !result[0].values.length) return 0;
  return result[0].values[0][0] as number;
}

// ── 清理 ──────────────────────────────────────────────────────

/** 清理 N 天前的旧日志（保持数据库轻量） */
export function pruneOldEvents(playerId: string, keepDays: number = 30): void {
  const db    = getDb();
  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  db.run(
    `DELETE FROM event_log WHERE player_id = ? AND timestamp < ?`,
    [playerId, cutoff]
  );
}
