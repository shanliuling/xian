import { getDb } from '../db.js';
import type { PlayerProfile, PlayerStats, PlayerState } from '../../engine/engine.types.js';
import type { RealmKey, FactionKey } from '../../shared/constants.js';
import type { TraitKey } from '../../engine/engine.types.js';

// ── 玩家档案 ─────────────────────────────────────────────────

export function savePlayerProfile(profile: PlayerProfile): void {
  const db = getDb();
  db.run(
    `INSERT OR REPLACE INTO player_profile
     (id, name, sect, faction, traits, created_at, last_played)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.name,
      profile.sect,
      profile.faction,
      JSON.stringify(profile.traits),
      profile.createdAt,
      Date.now(),
    ]
  );
}

export function loadPlayerProfile(playerId: string): PlayerProfile | null {
  const db = getDb();
  const result = db.exec(
    `SELECT id, name, sect, faction, traits, created_at, last_played
     FROM player_profile WHERE id = ? LIMIT 1`,
    [playerId]
  );
  if (!result.length || !result[0].values.length) return null;

  const row  = result[0].values[0];
  const cols = result[0].columns;
  const obj  = toObj(cols, row);

  return {
    id:          obj['id'] as string,
    name:        obj['name'] as string,
    sect:        obj['sect'] as string,
    faction:     obj['faction'] as FactionKey,
    traits:      JSON.parse(obj['traits'] as string) as TraitKey[],
    createdAt:   obj['created_at'] as number,
  };
}

export function updateLastPlayed(playerId: string): void {
  const db = getDb();
  db.run(
    `UPDATE player_profile SET last_played = ? WHERE id = ?`,
    [Date.now(), playerId]
  );
}

// ── 玩家数值状态 ──────────────────────────────────────────────

export function savePlayerStats(playerId: string, stats: PlayerStats): void {
  const db = getDb();
  db.run(
    `INSERT OR REPLACE INTO player_state
     (player_id, realm, cultivation, foundation, vibe, heart, prestige,
      vibe_rot, active_path, last_commit_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      playerId,
      stats.realm,
      stats.cultivation,
      stats.foundation,
      stats.vibe,
      stats.heart,
      stats.prestige,
      stats.vibeRotLevel,
      stats.activePath,
      stats.lastCommitAt,
      Date.now(),
    ]
  );
}

export function loadPlayerStats(playerId: string): PlayerStats | null {
  const db = getDb();
  const result = db.exec(
    `SELECT realm, cultivation, foundation, vibe, heart, prestige,
            vibe_rot, active_path, last_commit_at, updated_at
     FROM player_state WHERE player_id = ? LIMIT 1`,
    [playerId]
  );
  if (!result.length || !result[0].values.length) return null;

  const row  = result[0].values[0];
  const cols = result[0].columns;
  const obj  = toObj(cols, row);

  return {
    realm:          obj['realm'] as RealmKey,
    cultivation:    obj['cultivation'] as number,
    foundation:     obj['foundation'] as number,
    vibe:           obj['vibe'] as number,
    heart:          obj['heart'] as number,
    prestige:       obj['prestige'] as number,
    vibeRotLevel:   obj['vibe_rot'] as number,
    activePath:     obj['active_path'] as FactionKey,
    lastCommitAt:   obj['last_commit_at'] as number,
    lastSaved:      obj['updated_at'] as number,
  };
}

// ── 完整玩家状态（档案 + 数值合并） ───────────────────────────

export function loadFullPlayerState(playerId: string): PlayerState | null {
  const profile = loadPlayerProfile(playerId);
  const stats   = loadPlayerStats(playerId);
  if (!profile || !stats) return null;
  return { ...profile, ...stats };
}

export function saveFullPlayerState(state: PlayerState): void {
  savePlayerProfile(state);
  savePlayerStats(state.id, state);
  updateLastPlayed(state.id);
}

// ── 检查玩家是否已存在（首次启动判断） ────────────────────────

export function playerExists(playerId: string): boolean {
  const db = getDb();
  const result = db.exec(
    `SELECT 1 FROM player_profile WHERE id = ? LIMIT 1`,
    [playerId]
  );
  return result.length > 0 && result[0].values.length > 0;
}

// ── 工具：sql.js 结果行转对象 ─────────────────────────────────

function toObj(
  cols: string[],
  row: (string | number | null | Uint8Array)[]
): Record<string, string | number | null | Uint8Array> {
  const obj: Record<string, string | number | null | Uint8Array> = {};
  cols.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}
