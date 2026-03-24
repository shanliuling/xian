export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isLateNight(hour: number): boolean {
  return hour >= 22 || hour <= 5;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.floor(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export function formatMs(ms: number): string {
  return formatMinutes(ms / 60_000);
}

export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 把一个数字四舍五入到 N 位小数 */
export function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/** 格式化带符号的数值，如 +3.0 / -1.5 */
export function formatDelta(value: number, decimals = 1): string {
  const r = round(value, decimals);
  return r >= 0 ? `+${r}` : `${r}`;
}

/** 进度条字符串，如 ████░░░░  62% */
export function progressBar(value: number, max: number, width = 12): string {
  const pct  = max <= 0 ? 0 : clamp(value / max, 0, 1);
  const filled = Math.round(pct * width);
  const empty  = width - filled;
  const bar    = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar}  ${Math.round(pct * 100)}%`;
}

/** 安全 JSON 解析，失败返回 null */
export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 把毫秒时间戳格式化为 HH:MM */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** 截断字符串，超出部分用 … 替代 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}
