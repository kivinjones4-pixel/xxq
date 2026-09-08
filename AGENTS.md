# HES 项目协作指南

## 目标与依据

交付电表档案管理、随时抄表、系统日志查询。需求来自 docs/00 至 docs/11 HTML，见 [来源与待决事项](specs/reference.md)。当前为文档基线，不代表业务代码已实现。
原文冲突按 `00-项目任务书 > 01-项目概述 > 02-系统架构设计 > 其他实施指导` 处理；派生规范不得静默覆盖原文，冲突记录出处、影响和待决项。

## SDD 工作流程

功能/迭代采用一需求一目录：`specs/000-frontend-init-feature/spec.md`（命名示例）；明确本次范围、验收场景、任务与完成证据。根部现有文档作为项目背景，按需引用。
1. 阅读 [proposal.md](specs/proposal.md) 确认范围，再读 [spec.md](specs/spec.md) 相关需求与 [design.md](specs/design.md) 决策。
2. 从 [task.md](specs/task.md) 选择任务，解决依赖的待决项后实施最小完整改动。
3. 用户明确变更同步提案、设计、规范、任务；行为变更先更新规范，再更新实现和验证，以需求 ID 关联代码、测试、证据。
4. 实现与验证均完成才勾选任务；未运行的检查说明原因，不以文档生成代替功能完成。

保留 specs/、单数 task.md、skills/ 命名，借鉴 OpenSpec 分层；未配置 OpenSpec CLI，不假定相关命令可用。

## 架构与业务约束

- 六模块：Web FrontEnd、Web BackEnd、UCI、Channels、Common、DLMS 模拟表；四后端服务独立运行，Common 为复用组件。
- 前端经 HTTP 调用 Web BackEnd，后者经 HTTP 调用 UCI；UCI 与 Channels 经封装 ActiveMQ 的 MQBus 异步通信。
- Channels 是 TCP 服务端，模拟表主动作为 TCP 客户端连接；UCI 负责 GET 编解码，Channels 负责登录、心跳、LLS 应用连接和转发。
- 一表一任务，同任务数据项串行、不同表任务并行；GET 前必须完成应用连接认证。
- 心跳每 3 分钟发送；超过 9 分钟未收到则离线、断开并清理映射。
- 核心表 asset_meter、dict_data_item；电表地址即表号且唯一；数据项以 OBIS_classId_attributeId 唯一，OBIS 本身不唯一。
- status 表示启用状态而非在线状态；档案保留 auth_password 用于 LLS。
- 外部 API 保持 POST /api/v1/...；JSON 为 code/message/data，分页为 total/list，导出返回文件流。

## 技术栈选型专区

依据：[技术选型](docs/03-技术选型说明.html)、[环境配置](docs/09-开发环境配置指南.html)、[架构](docs/02-系统架构设计.html)、[Common 指导](docs/06-Common模块开发指导.html)。未明确的精确版本待锁定。

| 层次 | 技术与版本 | 状态及用途 |
| --- | --- | --- |
| 前端环境 | Node.js 16 或更高 | 当前使用24.10.0 |
| 前端框架 | Vue 3.x、TS、Composition API | 已确定 |
| UI / 状态 / 路由 | Element Plus、Tailwind、Pinia、Vue Router | 已确定，精确版本latest |
| HTTP 客户端 | Axios 1.x | 已确定，统一请求拦截 |
| 前端构建 | Vue CLI 或 Vite | 已确定，采用vite |
| 代码检查 | ESLint | 原文列出，规则与版本待定 |
| Java / 构建 | JDK 1.8、Maven 3.x | 已确定，各服务独立 Maven 项目 |
| 服务框架 | Spring Boot | 已确定，版本须兼容 Java 8 |
| 数据访问 | MyBatis Spring Boot Starter | Web BackEnd、模拟表使用；UCI 实现可选 |
| TCP 通信 | Netty | 原文推荐用于 Channels，版本待定 |
| 消息队列 | ActiveMQ 5.x、JMS API | 已确定，MQBus 封装点对点 Queue |
| 协议 | 自研 Protocol | UCI、Channels、模拟表复用；线格式待决项见 reference |
| API 文档 | Swagger 或 Knife4j | 原文推荐，具体方案待定 |
| 数据库 | MySQL 5.7 或 8.0 | 二选一；hes_db、utf8mb4、utf8mb4_general_ci |
| 连接池 | Druid 或 HikariCP | 候选，尚未选定 |
| 日志 | Lucene + 文件存储 | 已确定，须兼容 Java 8；不以数据库日志表替代 |
| 公共组件 | 自研 MQBus、Protocol、Logger、LoggerQuery | Maven 依赖复用，不单独作为业务服务部署 |
| 操作系统 | Windows Server 2016+ | 原文目标环境 |
| 后端部署 | Spring Boot 可执行 JAR、内嵌 Tomcat | 四服务独立进程，Windows 服务或批处理启动 |
| 前端部署 | Web 服务器静态资源 | IIS、Nginx 或其他服务器待选 |

### 版本管理

- 创建骨架前确定候选方案与精确版本，记录 Java/Node 与依赖、构建工具的兼容性依据。
- Maven 配置统一依赖版本，前端提交所选包管理器锁文件；不把推荐或待定写成已确定，不自动升级原文技术基线。
- 选型变更同步 design 和 task；影响范围或行为时同步 proposal 和 spec，开放问题记录到 reference。

## 实施与验收

- 保持 Maven 标准目录和服务边界；按实际 pom.xml、package.json 确定命令，无工程配置时不声称安装、兼容性验证或构建已通过。
- 密码使用运行配置或测试夹具，不复制文档示例凭据到部署配置；日志、导出和报告避免输出认证密码。
- 验证正常抄读、LLS 失败、超时/断连、重复与迟到响应、同表串行/跨表并行、导入错误、日志查询及导出；区分原文验收和设计补充。
- 最终保留四服务启动及前端→Web BackEnd→UCI→MQBus→Channels→模拟表→前端完整证据；共享编解码器互测不足以证明标准兼容。
- 核心组件和核心服务单元测试覆盖率至少 60%；模拟表成功抄读与系统运行联调为任务书一票否决项。

## 技能入口

- 前端开发与审查遵循 [前端代码规范](skills/hes-frontend-cr/references/frontend-cr.md)；技能 description 统一以“当……时，……”开头说明触发场景与动作。
- [hes-spec-workflow](skills/hes-spec-workflow/SKILL.md)：维护四类 SDD 文档与来源映射，附 HTML 提取脚本。
- [spec-auto-update](skills/spec-auto-update/SKILL.md)：生成/更新功能或迭代级可执行规范，一需求一编号目录，以验收证据判断完成。
- [hes-integration-review](skills/hes-integration-review/SKILL.md)：检查接口、协议链路和端到端验收证据。
- [hes-frontend-cr](skills/hes-frontend-cr/SKILL.md)：按前端规范审查代码差异，输出缺陷证据与验证缺口。

使用时显式读取对应 SKILL.md，不假定仓库 skills/ 已被工具自动发现。
