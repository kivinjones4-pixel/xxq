# 最小前端初始化

- 状态：完成（仅本次前端骨架范围）
- 来源：用户 2026-09-08 请求；[项目提案](../proposal.md)、[REQ-ARCH-01 / REQ-DELIVERY-01](../spec.md)、[T-03](../task.md)、AGENTS.md 技术选型及 FE-01/03/08。

## 目标与范围

在 frontend/ 建立独立 Vue 3 + TypeScript + Vite 工程，接入 Element Plus、Tailwind、Pinia、Vue Router、Axios，提供中文首页、统一 JSON 请求入口、lint / 类型检查 / 构建命令和 npm 锁文件。
本次不实现档案、抄表、日志业务页面、业务 store、后端服务、文件导出与实时结果接口。Q-01–Q-07 不阻塞静态骨架；不声称完成项目级 T-03 或端到端验收。

## 需求与验收

### R-01 / AC-01 可复现工程
- Given Node 24.10.0、npm 11.6.1；When 在 frontend 执行 npm ci、npm run lint、npm run type-check、npm run build；Then 依赖无 peer 冲突，检查通过并生成 dist。

### R-02 / AC-02 首页
- Given 开发服务器启动；When 打开首页或未知 hash 路由；Then 展示 HES 标题及尚未实现业务功能的说明，未知路由回首页，首页不发业务请求。
- 验证：开发入口 HTTP 检查与浏览器冒烟检查；不使用模拟业务数据。

### R-03 / AC-03 请求边界
- Given 调用统一 JSON POST 方法；When 返回 code=200、业务失败或 HTTP/网络失败；Then 成功解包 data，业务失败抛出专用错误，传输错误保留 Axios 错误类型；不自动重试或输出请求数据。
- 验证：用 Axios adapter 内存夹具验证；不冒充后端联调。

## 实现设计

- 单一首页，hash 路由避免静态服务器重写依赖；注册 Pinia，待真实跨页面状态出现后创建 store。
- Element Plus 按组件导入，Tailwind 仅导入主题与 utilities，避免 preflight 覆盖组件默认样式。
- API baseURL 为 /api/v1，Vite 开发代理 /api 到 Web BackEnd localhost:8080；生产需同源反向代理。
- 普通 JSON code/message/data 依照 REQ-API-01 的成功示例 200；该入口不用于文件流；后续 Q-06 定案后调整业务合同。
- 精确版本与兼容依据见 [versions.md](versions.md)，实现前记录；Java 基线不变。

## 任务

- [x] T-01：工程、依赖锁定、脚本与文档（R-01 / AC-01）。
- [x] T-02：首页、路由、样式和 Pinia 注册（R-02 / AC-02）。
- [x] T-03：统一请求入口与夹具验证（R-03 / AC-03）。

## 验证记录

2026-09-08，Windows，本机 Node v24.10.0 / npm 11.6.1。以下 npm 命令均在 frontend/ 执行。

| 场景 | 命令 / 步骤 | 实际结果与证据 |
| --- | --- | --- |
| AC-01 | npm install --no-fund --no-audit；npm ci --no-audit --no-fund | 均成功，284 个包；ci 用时 41 秒；锁文件 frontend/package-lock.json |
| AC-01 | npm ls --depth=0 | 精确版本与 versions.md 一致，无依赖冲突 |
| AC-01 | npm run lint | 0 错误、0 警告；最初 8 条模板换行警告经 --fix 修复 |
| AC-01 | npm run build（包含 npm run type-check） | vue-tsc 通过；Vite 8.2.2 构建成功，1598 modules；dist/index.html 0.40 kB、CSS 18.03 kB、JS 111.40 kB |
| AC-02 | npm run dev；Invoke-WebRequest http://127.0.0.1:5173 | Vite 启动成功，首页 HTTP 200；验证后停止临时服务 |
| AC-02 | 浏览器打开 / 和 /#/missing | 两者最终 URL 均为 /#/；可见 HES 电表管理系统、前端工程已就绪、业务尚未实现说明；截图检查标题与卡片无重叠 |
| AC-03 | npm test | 1 项测试通过；frontend/tests/http.test.ts 验证 POST、前缀、空分页、业务错误及传输错误 |

环境限制：初次沙箱运行 Vite 创建缓存被 EPERM 拒绝，授权重跑后通过；npm 默认缓存不可写，工程 .npmrc 使用被忽略的项目内 .npm-cache。未运行真实后端接口、四服务联调或核心覆盖率验收；这些不属于本次范围。浏览器验证是首页冒烟检查，不代表多浏览器完整兼容验收。

## 完成条件与风险

全部 AC 通过且文档与实现一致才标记完成。浏览器最低版本遵循 Tailwind 4 的现代浏览器要求；旧浏览器支持不在本次范围。无本次阻塞待决项。

## 变更记录

2026-09-08：按用户要求建立最小前端初始化范围。
