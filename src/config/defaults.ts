import { XianConfig } from './config.types.js'

export function getDefaultConfig(): XianConfig {
  return {
    bossKey: {
      shortcut: 'ctrl+b',
      theme: 'npm',
      autoRotateTheme: false,
    },
    osync: {
      gitInterval: 10_000,
      watchDir: process.cwd(),
    },
    gameplay: {
      offlineProgressEnabled: true,
      offlineMaxHours: 8,
      nightCodingBonus: true,
      vibeRotEnabled: true,
    },
    ui: {
      theme: 'dark',
      useUnicode: true,
      logLines: 10,
      refreshRate: 1000,
    },
    ai: {
      enabled: true, // AI 内容生成是必须的
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o-mini',
      baseUrl: '',
    },
  }
}
