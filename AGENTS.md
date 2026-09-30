# 🧮 DailyMentalMath — 口算天天练

**100以内加减乘除 · 17题型 · 4模式 · 成就系统 · 数据统计**

Solid.js + Vite 6 + Tauri 2 跨平台桌面心算练习应用。纯前端，数据存 localStorage。

---

## Commands

| 用途 | 命令 |
|------|------|
| 开发服务器（浏览器） | `npm run dev` (port 1422) |
| Tauri 桌面开发 | `npm run tauri dev` |
| 构建桌面应用 | `npm run tauri build` |
| 运行测试 | `npm test` (vitest run) |
| 仅前端构建 | `npm run build` (vite build, singlefile) |
| 预览前端构建 | `npm run preview` |

**Windows MSVC 开发**: 使用 `dev.ps1` (PowerShell) 或 `run-msvc.sh` (Git Bash) 来设置 MSVC 环境后运行 `npm run tauri dev`。

---

## Architecture

```
DailyMentalMath/
├── src/                    # 前端源码 (Solid.js)
│   ├── App.jsx             # 主组件 — 路由/页面切换/成就/图表
│   ├── index.jsx           # 入口 — render(<App />, #root)
│   ├── error-logger.js     # 全局错误日志捕获
│   ├── style.css           # 全局样式 (LightningCSS)
│   ├── styles/tokens.css   # CSS 自定义属性主题系统
│   ├── components/
│   │   ├── PracticePanel   # 练习面板 (出题/作答/反馈)
│   │   ├── StatsPanel      # 单次练习结果统计
│   │   ├── HistoryPanel    # 历史逐题记录
│   │   ├── LeaderboardPanel# 本地排行榜/统计摘要
│   │   ├── ProgressDashboard # 最近10次趋势图表
│   │   ├── Numpad          # 数字键盘组件
│   │   ├── SettingsPanel   # 设置面板 (题型/数量/模式/主题)
│   │   ├── Header          # 顶栏 (主题/语言切换)
│   │   └── Skeleton        # 懒加载骨架屏
│   ├── hooks/
│   │   ├── usePractice.js  # 练习核心状态机 (出题/计时/成绩/成就)
│   │   ├── useTheme.js     # 主题切换 (亮/暗)
│   │   └── useLocale.js    # 语言切换 (zh/en)
│   └── lib/
│       ├── math.js         # 17种题型生成引擎 + utils
│       ├── math.test.js    # 题型测试 (vitest)
│       ├── i18n.js         # 翻译函数 t(lang, key, ...args)
│       └── locales/        # 中/英翻译字典 (zh.js / en.js)
├── src-tauri/              # Tauri v2 Rust 后端
│   └── src/
│       ├── main.rs         # 桌面入口 (调用 lib::run)
│       └── lib.rs          # Tauri Builder + log_error command
└── vite.config.js          # Vite 配置 (solid + singlefile)
```

**页面 / 状态机**: `settings → practice → results → settings`。`App.jsx` 的 `page` signal 控制三页切换。`usePractice` hook 管理四个练习模式（free / timed / daily / error-review）的全部状态。

**数据存储**: 纯 localStorage，keys 以 `dmm-` 为前缀。无后端。

---

## Conventions

- **Solid.js**: 使用 `createSignal` / `createEffect` / `onCleanup` / `Show` / `For` / `Suspense` + `lazy`。不手动订阅；信号通过 getter 函数读取。
- **命名**: 文件 — `PascalCase.jsx`（组件） / `kebab-case.js`（工具）。函数 — camelCase。常量 — UPPER_SNAKE_CASE。CSS class — kebab-case。
- **导入**: `.jsx` / `.js` 后缀显式写出。CSS 文件直接 `import "/src/style.css"`。
- **国际化**: 调用 `t(lang(), "key", ...args)`。翻译字典在 `lib/locales/`。
- **CSS**: LightningCSS（Vite 内置），CSS 自定义属性主题系统定义在 `styles/tokens.css`，全局样式在 `style.css`。类名 kebab-case，使用 `classList` 条件切换。
- **测试**: Vitest。测试文件与源文件并列：`lib/math.test.js` 测试 `lib/math.js`。用 `describe`/`it`/`expect`。
- **数据持久化**: localStorage 辅助函数 `loadJSON(key, fallback)` / `saveJSON(key, val)` 封装了 try/catch。
- **避免**: 不使用 TypeScript。不使用 class 组件。不引入外部 UI 库。所有资源内联（`vite-plugin-singlefile`）。
- **Tauri 2**: Rust 后端极小 — 仅 `tauri_plugin_log` + 一个 `log_error` command。`main.rs` 用 `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` 隐藏 Windows 控制台窗口。

---

## 网页版 / GitHub Pages

本应用同时作为**静态网页**发布：<https://1012905.github.io/DailyMentalMath/>

```
public/                     # 构建时原样拷贝到 dist/ 根目录
├── manifest.webmanifest    # PWA 清单（相对路径，适配 /<repo>/ 子路径）
├── sw.js                   # Service Worker：shell 预缓存 / 导航 network-first / 静态 SWR
├── favicon.svg + *.png     # 图标（含 maskable）
├── og-image.png            # 1200x630 分享图
└── fonts/                  # 自托管字体（Inter + Noto Sans SC 子集），零 CDN 依赖
.github/workflows/deploy-pages.yml   # push main → npm ci → test → build → deploy
scripts/{gen-icons.py,fetch-fonts.py,deploy-pages.sh}
src/pwa.js                  # SW 注册（DEV 下跳过，避免干扰 HMR）
```

**约定 / 注意事项**:

- **`base: "./"`**：项目站点位于 `/<repo>/` 而非域名根目录，所有资源引用必须相对。
  `index.html` 里用 `./fonts/fonts.css`、`./manifest.webmanifest`；`sw.js` 内部也全部用 `./`。
- **PWA 前缀**：localStorage keys 仍是 `dmm-`，但 **i18n/主题的 key 是 `math-lang` / `math-theme` / `math-dark`**（沿用旧命名，勿改，会丢用户设置）。
- **改中文文案后必须重跑 `npm run fonts`**：中文字体是按源码实际字符集做的子集，漏字会回退系统字体（不会出豆腐块，但字重会不一致）。
- **CI 零外部子资源是硬关卡**：workflow 与 `deploy-pages.sh` 都会检查构建产物里没有外部 `src=`/`href=http`，引入 CDN 会直接红。
- **`package-lock.json` 必须入库**：CI 用 `npm ci`，lockfile 缺失会导致流水线失败。

**并行开发注意（本项目历史上踩过）**:

- `npm run build` 会 `emptyOutDir` **清空 `dist/`**。多人/多任务并行时一律用
  `npx vite build --outDir dist-check`（`dist-*/` 已在 `.gitignore` 中），否则会踩到正在预览的人。
- 不要依赖固定的 dev server 端口做验证，端口可能被其它任务占用；自行分配独立端口。

## Notes
