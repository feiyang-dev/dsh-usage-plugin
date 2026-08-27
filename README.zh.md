<div align="center">

# DeepSeek Harness 用量与消耗插件（dsh-usage-plugin）

[English](./README.md) | **简体中文**

[GitHub](https://github.com/feiyang-dev/dsh-usage-plugin) · [npm](https://www.npmjs.com/package/@feiyang666/dsh-usage-plugin) · MIT License

**由开发者制作的 DeepSeek Harness 插件** —— 记录每一次模型调用的 token 用量与消耗，支持峰谷计费、余额查询、日历热力图与 CSV / JSON / PNG 导出。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![Platform](https://img.shields.io/badge/platform-web%20%26%20desktop-4d9fff)

</div>

---

> ## 🔔 重要通知（2026-08-16）：npm 包名已更换
>
> 本插件的 **npm 包名已由 `@feiyang666/deepseekharnessdesktop` 更名为 `@feiyang666/dsh-usage-plugin`**（与 GitHub 仓库名 `feiyang-dev/dsh-usage-plugin` 保持一致）。
>
> - 安装 / 升级请使用新包名：`dsh plugin --profile web add @feiyang666/dsh-usage-plugin`
> - 旧包名 `@feiyang666/deepseekharnessdesktop` 仍会保留一段时间，但**不再维护、不会更新**，请尽快迁移
> - 桌面端（[`DeepSeek Harness 桌面版`](https://github.com/feiyang-dev/DeepSeek-Harness-Desktop)）已兼容两种包名，旧包名安装的会自动识别并支持「一键更新」迁移到新包名

---

## 简介

dsh-usage-plugin 是 DeepSeek Harness 生态的**用量与消耗统计插件**（DSH plugin，Host + Client 双面一体包）。装好后在 WebUI 顶部「对话」「轨迹」之后会出现 **「用量与消耗」** 与 **「剩余余额查询」** 两个 tab：

> 支持 **Windows / macOS / Linux**：路径按当前平台处理（`node:path`），目录选择与「打开所在目录」均调用系统原生方式（macOS 用 `osascript` / `open`，Linux 用 `zenity` / `xdg-open`），余额查询与导出不依赖 Windows 专用命令。

- **用量与消耗**：记录每次模型调用的 token 用量与缓存命中（输入·未命中 / 缓存命中 / 缓存写入 / 输出 / 推理 / 结束原因），按 DeepSeek 峰谷/基础价格计算消耗（工作日高峰时段按北京时间 9:00–12:00、14:00–18:00 计价；自 2026-08-23 起周末全天按空闲价计费）。模型名以请求参数为准如实显示（非 DeepSeek 模型不再显示为「未知模型」，无官方价格的模型消耗按 0 统计）。概览含「按模型」表与「按 API 服务商 × 模型」明细表（每个服务商一组，组内列出各模型的调用与高峰/空闲分列消耗），底部有总费用合计。概览还支持**日期筛选**（今天 / 近 7 天 / 近 30 天 / 全部，外加自定义起止区间），可将聚合统计限定到任意一天或日期范围。
- **用量日历**：按月查看每日用量热力图（按消耗或调用数着色），悬停查看详情（含高峰 / 空闲消耗拆分）、点击某天查看当日调用明细与高峰/空闲消耗统计，附本月每日统计表（高峰消耗 / 空闲消耗 / 总消耗分列）与月度汇总。
- **缓存命中列表**：最新记录排在最前，支持 今天 / 近7天 / 近30天 / 全部 快捷筛选与自定义起止日期区间，汇总行与表尾合计区分高峰消耗 / 空闲消耗 / 总费用合计；列表分页渲染（每页 100 条），记录量大也不卡顿。
- **价格表**：**DeepSeek 官方 API 价格表**（覆盖官方模型 `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` / `deepseek-v4-pro`），展示基础价与峰谷价（高峰/空闲）单价表，高峰价与空闲价分列展示，支持在面板内直接编辑价格并持久化（数据目录 `pricing.json`），也可一键恢复默认。
- **剩余余额查询**：用当前配置的 `DEEPSEEK_API_KEY` 查询 DeepSeek 账户余额；并支持 **百炼 Token Plan 配额查询**（复用 `bl auth login --console` 的控制台 OAuth token，无需阿里云 AccessKey，展示本周配额已用百分比与重置时间）。
- **导出**：CSV / JSON / **PNG 长图**（按最新在前展示，最多含最近 2000 条，超出会提示；PNG 报告含高峰 / 空闲消耗分列统计），可导出到任意目录（原生目录选择器），导出后自动打开所在目录。
- **导入**：选择文件（JSON / CSV）合并导入，按时间去重。
- **持久化**：记录实时落盘到**固定专用数据目录**（如 `%LOCALAPPDATA%\dsh-usage-plugin\dsh-usage\usage-records.json`，详见下文「数据目录」），与当前工作区无关，重启自动恢复（上限 100000 条，尽量多存）。
- **界面适配**：面板字号跟随应用「显示大小」设置自动缩放（em 相对字号）；桌面端宽表在容器内横向滑动（max-content + overflow-x），**移动端（≤900px）表格贴合屏宽、不再出现横向滑条**，弹窗与卡片随视口自适应。
- **英文界面（i18n）**：面板语言跟随宿主的「通用设置 → 语言」——在那里切换，插件即时跟随，不再自带切换按钮，也不再用 `localStorage` 覆盖系统语言。双语词典覆盖整个面板（含高峰 / 空闲时段说明、余额查询、PNG 报告）；外部「会话 / 设置」标签页名按渲染时读取，切换语言后实时更新。
- **消息底部 token 弹窗**：一轮输出完成后，助手消息底部操作行新增「本轮 token」按钮，点击弹出 `Token 明细`，分两层统计——**对话累计**（整场会话的 总 token / 总消耗 / 耗时 / 缓存命中率）与**本轮明细**（本次输出 / 本轮 token / 本轮消耗 / 本轮耗时 / 本轮缓存命中率、缓存命中长条图、按模型卡片：每个模型显示 输入·未命中 / 缓存命中 / 输出（+推理）与峰 / 谷成本分列）。时长按「X分Y秒」显示。宿主记录带会话标识（`sessionId`），本轮与整场对话统计各自独立。
- **内部/工具调用单独分组**：内部/占位调用（如 `dsh2shell-*`、模型 `fake`）不混入模型消耗明细，单独收在「消耗明细」下方可折叠的 **「工具调用（内部）」** 分组里（默认收起），成本表只统计真实模型调用。
- **移动端适配**：≤900px 时表格贴合屏宽（不再出现横向滑条）、宽表折叠中间列，弹窗统计卡与按模型卡片随视口自适应。

---

## 界面预览

### 用量与消耗
![用量与消耗](./docs/assets/usage-overview.png)

### 剩余余额查询
![剩余余额查询](./docs/assets/balance-query.png)

## 推荐安装方式

> 两个方法任选其一，效果等价。**推荐使用桌面端**，全程图形化、无需命令行。

### 方式一（推荐）：桌面端一键安装

安装 [DeepSeek Harness 桌面版](https://github.com/feiyang-dev/DeepSeek-Harness-Desktop)，打开后点击 **「安装插件」→ 推荐插件 → 用量与消耗插件 → 一键安装**，完成后点 **「立即重启服务」** 即可生效。

### 方式二：命令行安装

```bash
# 前提：已安装 dsh（npm install -g @deepseek-ai/dsh）
dsh plugin --profile web add @feiyang666/dsh-usage-plugin
```

也可对其它 profile 安装：

```bash
dsh plugin --profile web add @feiyang666/dsh-usage-plugin
dsh plugin --profile headless add @feiyang666/dsh-usage-plugin
```

装完重启 dsh web 服务即可。详细的手动安装 / 接线 / 卸载 / 排障说明见下方。

---

## 这个包是什么

一个 npm 包 = **host 半**（Node 侧 Cordis 插件，负责记录、计费、余额查询、导出，见 `lib/index.js`）+ **client 半**（浏览器侧面板，见 `lib/client.js`，通过 `/usage/api` 与 host 通信）。

包通过两处声明接入 DSH：

| 声明 | 作用 |
| --- | --- |
| `dsh.bundle.patch`（`cordis.patch.yml`） | 让 DSH 把它识别为**标准 bundle 插件包**：`dsh plugin --profile <名> add <包名>` 一条命令即可安装并自动接线，无需手改任何配置文件 |
| `dsh.client` + `exports["./client"]` | 让 web 客户端在 `/plugins/<包名>/client.js` 自动加载浏览器面板 |

所以对使用者来说，**安装就是一条命令**，不用碰 YAML、不用手动复制文件。

---

## 安装（给使用者）

### 0. 前提条件

- 已安装 DeepSeek Harness（`npm install -g @deepseek-ai/dsh` 全局安装，或使用基于它的桌面应用 / `npx @deepseek-ai/dsh web`）。
- 安装方式 A（推荐）需要 **pnpm**：`npm install -g pnpm`（或 `corepack enable`）。
- 确保 `dsh` 命令在 PATH 里（桌面应用自带环境则在其终端中执行）。

### 1. 方法 A（推荐）：一条命令安装

```bash
dsh plugin --profile web add @feiyang666/dsh-usage-plugin
```

这条命令会做三件事（全部自动）：

1. 在 `~/.dsh/profiles/web` 里通过 pnpm 安装本包（首次使用会自动初始化该 profile）；
2. 检测到包的 `dsh.bundle` 声明，自动把包名写进 profile 的 `dsh.profile.bundles` 层列表；
3. 重启后，DSH 启动时会自动读取包内的 `cordis.patch.yml`，把插件行挂进应用树——**不需要**手动编辑任何配置文件。

其它 profile 同理，把 `web` 换成你的 profile 名即可（如 `dsh plugin --profile headless add ...`；`dsh web` 等价于 `dsh --profile web`）。

> 想用本地 tarball 测试：`dsh plugin --profile web add C:\path\to\feiyang666-dsh-usage-plugin-1.9.0.tgz`

### 2. 方法 B：手动安装（不使用 pnpm / 无 `dsh plugin`）

只在没有 pnpm 或需要完全手工控制时才用。请**不要在 `~/.dsh/profiles` 根目录直接 `npm install`**（该目录没有 package.json，npm 会把整个 node_modules 当残留清掉）。

**B1. 用 pnpm 但不用 `dsh plugin`：**

```bash
cd ~/.dsh/profiles/web
pnpm add @feiyang666/dsh-usage-plugin
# 然后手动把插件行加进 web/cordis.patch.yml（见 B3），再重启
```

**B2. 或用 npm：** 在 profile 目录先补一个最小 package.json 再装：

```bash
cd ~/.dsh/profiles/web
# 若该目录还没有 package.json（用 dsh plugin 初始化过才会有）：
# echo '{"name":"dsh-profile-web","private":true,"dependencies":{}}' > package.json
npm install @feiyang666/dsh-usage-plugin
```

**B3. 接线（只需做一次，幂等）：** 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: usage-plugin
      name: '@feiyang666/dsh-usage-plugin'
      inject:
        - fs
        - webServer
        - subprocess
        - credentials
        - sandboxPolicy
        - agents
```

也可以直接跑包内的接线脚本（自动找 profile 并追加，幂等）：

```bash
node node_modules/@feiyang666/dsh-usage-plugin/scripts/wire.js
```

> ⚠️ 行上的 `inject` 列表**不能省略**：它让 Cordis 等到 `fs` / `webServer` / `subprocess` / `credentials` / `sandboxPolicy` / `agents` 服务就绪后再激活插件。缺了它，`/usage/api` 路由不会注册，面板会报 `Unexpected end of JSON input`。

### 3. 方法 C：桌面应用

桌面版（如 [DeepSeek Harness 桌面版](https://github.com/feiyang-dev/DeepSeek-Harness-Desktop)）底层就是同一个 `~/.dsh/profiles`。在任意终端执行方法 A 的命令即可，装完重启应用；应用内启动的是同一个 `dsh web`，插件自动生效。

### 4. 重启并验证

重启 DeepSeek Harness 的 web 应用（命令行：结束旧进程后重新运行 `dsh web`；桌面应用：完全退出后重新打开）。然后：

- 刷新 http://127.0.0.1:3080 ，顶部「对话」「轨迹」之后会出现 **「用量与消耗」** 和 **「剩余余额查询」** 两个 tab；设置里也有对应入口。
- 「用量与消耗」面板内含 **概览 / 用量日历 / 缓存命中列表 / 价格表** 四个子页签。
- 发一条消息后，「用量与消耗」面板应出现本次调用的 token / 消耗记录。

### 5. 配置（余额查询需要）

「剩余余额查询」使用当前配置的 `DEEPSEEK_API_KEY`：在 **设置 → 模型** 中配置 API Key（与跑对话用的同一个 key），然后打开「剩余余额查询」tab 点「查询余额」。

---

## 卸载

```bash
dsh plugin --profile web remove @feiyang666/dsh-usage-plugin
```

（等价于 pnpm remove；`dsh plugin` 会自动把包名从 `dsh.profile.bundles` 层列表里移除。）然后重启应用即可。

手工安装的（方法 B），反向操作：删除 `cordis.patch.yml` 里的 `usage-plugin` 行，再 `pnpm remove` / `npm uninstall` 该包，重启。

> 从 1.0.x 手工接线版升级到 1.1.x 时：先删掉旧 `cordis.patch.yml` 里的 `usage-plugin` 行（或整体按卸载流程走一遍），再按方法 A 重装，避免同一插件被挂载两次。

---

## 如何更新插件

发布在 npm 上，因此更新本质就是把已发布的包拉到最新——你的用量历史**不会丢**（自 v1.9.2 起数据存放在固定的专用目录，不位于任何 profile / 工作区，更新不会清掉它）。

### 桌面端
打开 **「安装插件」** → 找到 **Usage & Cost Tracker** → 点 **更新**（或 **重新安装**）→ **「立即重启服务」**。若没有更新按钮，先卸载再重新安装即可。

### 命令行（方式 A）
重新执行 `add` 是幂等的，会拉取最新版本：

```bash
dsh plugin --profile web add @feiyang666/dsh-usage-plugin
dsh web   # 重启
```

锁定某个版本：

```bash
dsh plugin --profile web add @feiyang666/dsh-usage-plugin@1.9.3
```

### 手动安装（方式 B）
在 profile 目录下：

```bash
cd ~/.dsh/profiles/web
pnpm update @feiyang666/dsh-usage-plugin   # 或：npm update @feiyang666/dsh-usage-plugin
```

### 查看已装版本
```bash
npm ls @feiyang666/dsh-usage-plugin --prefix ~/.dsh/profiles/web
```

> ⚠️ **不要手动修改 `~/.dsh/profiles/web/node_modules/@feiyang666/dsh-usage-plugin/` 下的文件**（如 `lib/index.js` / `lib/client.js`）。每次更新都会从 npm 重新解包并覆盖这些文件，本地改动会被静默丢弃。如需改行为，请 fork 仓库自行发布版本或向上游提贡献。

---

## 数据与位置

> **自 v1.9.2 起**，记录存储在**固定专用数据目录**中（修复 [#4](https://github.com/feiyang-dev/dsh-usage-plugin/issues/4)）。路径不再跟随会话工作区 / `~/.dsh` / 桌面端安装目录漂移，因此切换工作区时历史数据不会再"消失"（被统计为 0），且 UI 中显示的路径与真实落盘路径始终一致。

- 数据文件：`<数据根>/dsh-usage/usage-records.json`
  - **数据根**的解析顺序（数据始终落在该顺序里**第一个可写**的目录，**不会放进工作区**，除非以下全部不可写）：
    1. 环境变量 `DSH_USAGE_DATA_DIR`（若已设置）——优先级最高，覆盖其它；
    2. Windows：`%LOCALAPPDATA%\dsh-usage-plugin`（若 `LOCALAPPDATA` 未设置则回退到 `%APPDATA%`）；
    3. 用户主目录：`~/dsh-usage-data`（Windows 为 `%USERPROFILE%\dsh-usage-data`，macOS/Linux 为 `~/dsh-usage-data`）；
    4. **兜底（极少见）**：当前工作区 `<工作区>/dsh-usage` —— 仅当上述系统/用户目录都不可写时才使用，并会在面板顶部提示「持久化未启用」。
  - **写入不经过模型沙箱**：持久化由插件宿主进程自身的文件系统直接完成，不受 `workspace-write` 沙箱约束，因此固定目录一定能正常写入，数据也不因工作区切换而丢失。
  - Windows 下默认位置：`%LOCALAPPDATA%\dsh-usage-plugin\dsh-usage\usage-records.json`
- 旧数据自动合并：首次启动时，落在 `%USERPROFILE%\dsh-usage`、`~/.dsh/dsh-usage` 以及各工作区 `dsh-usage`（或 `.dsh-usage-records.json`）下的旧记录会按 `time` 去重合并进固定数据根，无需手动迁移。
- 价格配置（面板内编辑后保存）：`<数据根>/dsh-usage/pricing.json`
- 导出目录（默认）：`<数据根>/dsh-usage/{csv,json,images}/`
- 自定义导出目录：在面板「导出目标目录」里填写或点「选择目录…」
- 启动诊断日志（若插件激活失败）：数据根旁的 `dsh-usage-boot.log`

---

## 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 面板报 `Unexpected end of JSON input` | 插件行缺少 `inject` 列表，路由未注册。按方法 B3 补上 inject 后重启 |
| 面板一直空白 / 顶部无 tab | 插件未激活。看会话工作区 `dsh-usage-boot.log`；确认 `cordis.patch.yml` 里的行存在且 `name` 正确 |
| 余额查询失败「未配置 DEEPSEEK_API_KEY」 | 在 设置 → 模型 里配置 API Key |
| 余额查询失败网络错误 | 确认能访问 `api.deepseek.com`（国内网络请配置代理） |
| `dsh plugin` 报 pnpm not found | 安装 pnpm：`npm install -g pnpm` |
| 安装时连不上 npm 官方源 | 配置镜像：`npm config set registry https://registry.npmmirror.com`（或对 pnpm 设 `pnpm config set registry ...`）后再执行安装命令 |
| 卸载后仍报 `Cannot find package '@feiyang666/...'` | profile 里残留了包引用。删掉 `cordis.patch.yml` 中对应行与 `dsh.profile.bundles` 里的包名，重启 |

---

## 相关项目

| 项目 | 说明 | 安装方式 |
| --- | --- | --- |
| [DeepSeek Harness 桌面版](https://github.com/feiyang-dev/DeepSeek-Harness-Desktop) | Windows 桌面控制台：一键安装/启动/停止/重启 dsh web 服务，内置插件管理，**推荐插件区一键安装本插件** | 下载桌面版，点几下即可 |
| [数据保险箱（dsh-vault）](https://github.com/feiyang-dev/dsh-vault) | 自动备份 / 清空检测 / 一键恢复，保护聊天记录与工作区数据 | 桌面端一键安装，或 `dsh plugin add @feiyang666/dsh-vault` |
| [DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness) | 官方 CLI / Web 服务 | 见下方「运行 DeepSeek Harness」 |

### 运行 DeepSeek Harness

**快速安装（通过 npm）**

安装 Node.js，然后运行：

```bash
npx @deepseek-ai/dsh web
```

该命令会启动 Web UI，默认地址为 http://127.0.0.1:3080。详见 [Web UI 指南](https://github.com/deepseek-ai/DeepSeek-Harness)。

**从源码运行**

如需从仓库源码运行：

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

## 致谢

- **[@ayleen](https://github.com/ayleen)**：为 Web 面板实现完整的英文界面（i18n 层）与响应式语言切换，余额查询改为语义化字段（[#7](https://github.com/feiyang-dev/dsh-usage-plugin/pull/7)）。
- **[@wuhuqif176](https://github.com/wuhuqif176)**：在「剩余余额查询」中新增百炼（Qwen）Token Plan 配额查询（[#8](https://github.com/feiyang-dev/dsh-usage-plugin/pull/8)）。
- **[@Martin-soaring-dev](https://github.com/Martin-soaring-dev)**：筹备了插件开源贡献（打包、插件契约校验、文档与 CI），并提交贡献分支，成为后续开源版本的基础（[#6](https://github.com/feiyang-dev/dsh-usage-plugin/pull/6)）。
- **[@mumuer1024](https://github.com/mumuer1024)**：报告并定位了持久化路径随会话工作区漂移导致历史数据"消失/统计为 0"的问题，提出把数据写到固定专用目录的方案（[#4](https://github.com/feiyang-dev/dsh-usage-plugin/issues/4)）。
- **[@liu3734](https://github.com/liu3734)**：报告并定位 macOS（POSIX）下路径处理与 spawn 的 Windows 专用问题，提出跨平台修复方案（[#1](https://github.com/feiyang-dev/dsh-usage-plugin/issues/1)）。

## 许可

MIT © dsh-usage-plugin
