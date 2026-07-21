# 🧮 口算天天练 — DailyMentalMath

**100 以内加减乘除 · 四种模式 · 成就系统 · 数据统计**

> 🖥️ 基于 Solid.js + Tauri v2 的跨平台桌面心算练习应用

---

## ✨ 功能一览

### 🏋️ 练习题型（17 种，4 大类）

| 分类 | 题型 |
|------|------|
| **基础** | 两位数加减、凑整百、三位数加减、多数相加、混合加减 |
| **进阶** | 三位数加减、多数相加、混合加减、乘法估算 |
| **乘法** | 两位数 × 一位数、三位数 × 一位数、×11 / ×15 巧算、两位数 × 两位数 |
| **除法** | 三位数 ÷ 一位数/两位数、五位数 ÷ 三位数、三位数 ÷ 四位数 |

### 🎮 四种练习模式

- **🏃 自由练习** — 无限出题，随时结束，无时间压力
- **⏱️ 限时冲刺** — 60 秒倒计时，答错扣 2 秒，挑战极限
- **📅 每日挑战** — 基于日期生成 20 道固定题，天天不同
- **🔁 错题重练** — 从历史错题库随机抽取，针对性巩固

### 🏆 成就系统

8 个成就徽章，涵盖连击、速度、准确率、夜练、完美日赛等维度，实时进度追踪 + 解锁撒花动画。

### 📊 数据统计

- 逐次练习的准确率、平均耗时、连续答对
- 最近 10 次准确率 & 用时趋势柱状图
- 最近练习趋势图表

### 🌐 国际化

- 简体中文 / English 双语切换
- 系统语言自动检测

---

## 🖥️ 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | [Solid.js](https://www.solidjs.com/) + [Vite 6](https://vitejs.dev/) |
| 桌面壳 | [Tauri 2](https://v2.tauri.app/) (Rust) |
| 后端 | 无（纯本地 localStorage） |
| 测试 | [Vitest](https://vitest.dev/) |
| 样式 | LightningCSS + CSS 自定义属性主题系统 |

---

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（浏览器）
npm run dev

# 启动 Tauri 桌面开发模式
npm run tauri dev

# 构建桌面应用
npm run tauri build

# 运行测试
npm test
```

纯本地应用，无需后端服务。所有数据存储在浏览器 localStorage 中。

---

## 🗂️ 项目结构

```
DailyMentalMath/
├── src/                    # 前端源码 (Solid.js)
│   ├── components/         # UI 组件
│   │   ├── PracticePanel   # 练习面板
│   │   ├── StatsPanel      # 结果统计
│   │   ├── HistoryPanel    # 历史记录
│   │   ├── LeaderboardPanel# 排行榜
│   │   ├── ProgressDashboard# 进度仪表盘
│   │   ├── Numpad          # 数字键盘
│   │   └── SettingsPanel   # 设置面板
│   ├── lib/
│   │   ├── math.js         # 17 种题型生成引擎
│   │   ├── math.test.js    # 题型测试
│   │   └── i18n.js         # 国际化
│   ├── hooks/
│   │   ├── usePractice.js  # 练习核心状态
│   │   ├── useTheme.js     # 主题切换
│   │   └── useLocale.js    # 语言切换
│   ├── styles/             # CSS 自定义属性主题
│   └── App.jsx             # 主应用
├── src-tauri/              # Tauri Rust 后端
│   └── src/
│       ├── main.rs         # 桌面入口
│       └── lib.rs          # Tauri 插件注册
└── package.json            # 依赖与脚本
```

---

## 📄 许可证

Copyright © 2025

本程序是自由软件：您可以根据自由软件基金会发布的 **GNU 通用公共许可证**（GPL）第三版或其（凭您选择）任何更新版本的条款，重新分发和/或修改它。

本程序的分发是希望它有用，但**没有任何担保**；甚至没有适销性或特定用途适用性的默示担保。详情请见 GNU 通用公共许可证。

随本程序应附有一份 GNU 通用公共许可证副本。如果没有，请见 <https://www.gnu.org/licenses/>。

```
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
