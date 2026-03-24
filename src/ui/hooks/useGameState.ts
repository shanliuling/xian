import { useState, useEffect } from 'react';
import type { GameEngine } from '../../engine/index.js';
import type { PlayerState } from '../../engine/engine.types.js';
import type { EventLogEntry } from '../../engine/engine.types.js';

export interface GameStateSnapshot {
  player:    PlayerState | null;
  eventLog:  EventLogEntry[];
  isReady:   boolean;
}

/**
 * useGameState
 * 订阅 GameEngine 的状态更新，返回最新快照
 * 每次引擎广播 'state:update' 时触发 React 重渲染
 */
export function useGameState(engine: GameEngine): GameStateSnapshot {
  const [player, setPlayer]     = useState<PlayerState | null>(engine.getState());
  const [eventLog, setEventLog] = useState<EventLogEntry[]>(() =>
    engine.getRecentEventLog(20)
  );

  useEffect(() => {
    const onStateUpdate = (state: PlayerState) => {
      setPlayer(state);
    };

    const onEventText = (_entry: EventLogEntry) => {
      // 每次有新事件，重新拉取最近日志（简单策略，避免管理局部队列）
      setEventLog(engine.getRecentEventLog(20));
    };

    engine.on('state:update', onStateUpdate);
    engine.on('event:text',   onEventText);

    return () => {
      engine.off('state:update', onStateUpdate);
      engine.off('event:text',   onEventText);
    };
  }, [engine]);

  return {
    player,
    eventLog,
    isReady: player !== null,
  };
}
