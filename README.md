# xian — 码界修仙记 (The Codeverse Path)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

> **“你不是在玩游戏，你是在活在一个把编程当修行的世界里。”**

`xian` 是一款面向开发者的终端修仙 RPG。它将你日常的代码提交（Git Activity）实时映射为游戏中的修炼进度。你的每一次 `git commit`，都是对大道的参悟；每一次深夜加班，都是在灵气最盛时的逆天改命。

---

## 🌟 核心特性 (Features)

- **🛠️ 虚实映射 (Mirror Logic)**：Git 提交行为驱动数值成长。代码行数、提交频率、提交时间都会影响你的修为与根基。
- **🎭 阵营抉择 (Great Schism)**：
  - **正道联盟 (Orthodox)**：根基第一，慢即是快。
  - **幻元道 (Vibe)**：效率即正义，AI 为翼。
  - **无宗行者 (Unbound)**：古法为骨，幻道为翼。
- **🧥 隐匿术 (Boss Key)**：一键切换伪装界面（npm install, git log 等），在老板眼皮底下稳健修仙。
- **🤖 AI 动态叙事**：(可选) 接入大模型，根据你的 commit message 生成独一无二的奇遇剧情。
- **⚡ 零负担体验**：基于 `simple-git`，只读摘要，不看代码，极致隐私，极致轻量。

---

## 🚀 快速开始 (Quick Start)

目前项目处于开发阶段，您可以通过以下方式从源码运行：

### 1. 安装依赖
```bash
npm install
```

### 2. 编译并运行
```bash
# 编译 TypeScript
npm run build

# 启动程序
xian
```

### 3. 配置
初次启动将开启“入道仪式”，引导您完成道号创建与 Git 仓库监听配置。

---

## 🏗️ 技术架构 (Architecture)

- **UI 渲染**：[Ink](https://github.com/vadimdemedes/ink) (React in Terminal)
- **数据感知**：[simple-git](https://github.com/steveukx/git-js)
- **持久化**：[sql.js](https://sql.js.org/) (SQLite WebAssembly)
- **逻辑层**：TypeScript 严格模式
- **AI 增强**：支持 OpenAI / DeepSeek / Claude 兼容接口

---

## 📜 修炼境界 (Realms)

1. **炼气 (Junior)** - 刚入世的码农散修
2. **筑基 (Mid)** - 已能独立开辟灵田（模块）
3. **金丹 (Senior)** - 参悟架构，结成内丹
4. **元婴 (Staff)** - 神识外放，掌管宗门脉络
5. **化神 (Principal)** - 言出法随，大道至简
6. **渡劫 (Tech Leader / Creator)** - 证道之位，在此一举

---

## 🤝 贡献 (Contributing)

欢迎各位道友加入“码界”建设。您可以提交 Issue 报告“道法漏洞 (Bug)”，或者提交 PR 贡献新的“奇遇模板 (Narrative)”。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/magic`)
3. 提交更改 (`git commit -m 'feat: add thunderbolt technique'`)
4. 推送分支 (`git push origin feature/magic`)
5. 发起 Pull Request

---

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 许可。

---

> **道友，请起手落子。**
