import { EventEmitter } from 'events';

/**
 * 全局事件总线
 * 用于各层之间的解耦通信
 *
 * 事件类型：
 *   'signal'        → RawSignal        感知层 → 引擎层
 *   'state:update'  → PlayerState      引擎层 → 渲染层
 *   'event:text'    → EventTextPayload 叙事层 → 渲染层
 *   'tribulation'   → TribulationData  引擎层 → 渲染层
 *   'achievement'   → AchievementKey   引擎层 → 渲染层
 *   'realm:up'      → RealmKey         引擎层 → 渲染层
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    // 避免 MaxListenersExceededWarning
    this.setMaxListeners(30);
  }
}

export const eventBus = new EventBus();
