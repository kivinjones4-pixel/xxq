# HES 技术设计

## Context

来源：文档 02、03、04、05、06、07、08、09、11。架构是四个独立 Spring Boot 服务、一个 Vue 前端、一个公共组件模块；部署到 Windows。当前 frontend/ 包含工程骨架和三个演示原型，尚无真实业务链路，以下区分“原文约束”和“建议/待定”。

## 模块与数据流（原文约束）

| 模块 | 责任 | 依赖 |
| --- | --- | --- |
| Web FrontEnd | 档案、随时抄表、日志页面 | Web BackEnd HTTP |
| Web BackEnd | 外部 API、档案持久化、结果返回、日志查询 | MyBatis、UCI HTTP、LoggerQuery |
| UCI | 加载档案与字典、拆分任务、串并行调度、GET 编解码 | MySQL、Protocol、MQBus |
| Channels | TCP 连接映射、登录/心跳、AARQ/AARE、透明转发 | Protocol、MQBus |
| Common | MQBus、Protocol、Logger、LoggerQuery | ActiveMQ/JMS、Lucene |
| DLMS 模拟表 | 多 TCP 客户端、档案加载、LLS 校验、模拟响应 | MyBatis、Protocol |

链路：前端 → Web BackEnd → HTTP → UCI → `HES.Task.Channels` → Channels → TCP → 模拟表；响应经 `HES.Result.UCI` 返回 UCI 解码，再回 Web BackEnd 和前端。

模拟表先连接并登录。Channels 保存电表地址→连接映射。未建立应用连接时，Channels 使用 UCI 传入的档案密码发送 AARQ，AARE 成功后才发送 GET。应用连接已成功的当前会话可复用；断线后必须重新登录和建立应用连接。

## Decisions

### DEC-11 关键合同（2026-09-10 设计补充）

[003](003-key-contracts/spec.md) 固化当前最小链路：8 字节 Wrapper、BER 登录/心跳与 ACSE、A-XDR GET；POST 全量快照轮询；单表单项单尝试 MQ；UCI 独占业务重试；同表跨批次 FIFO；有限期限和不可覆写终态。具体字段、默认值、报文、连接轮换与内存生命周期以该目录为唯一维护点。

DEC-02/04/05/06 中原有“待定”历史描述在本次范围内由下述修订替换；未扩大到 Q-06 全部业务 DTO 或 Q-07。协议修订遵循 00 优先级，来源冲突见 reference；不声称运行或标准互通已经通过。

### DEC-10 Tailwind 样式组织（用户明确要求）

三个原型页面及共享组件改用模板 Tailwind 工具类，保留 Element Plus 主题变量与基础重置。迁移不改变业务行为；响应式与动态状态验证及最终 CR 见 [002](002-tailwind-migration/spec.md)。

### DEC-09 主要模块原型与页面组织（用户明确要求）

每个路由页面使用 views/<page>/index.vue，页面私有 components/、types/ 按需建立；跨页共享内容独立提升。规则见 [FE-01a](../skills/hes-frontend-cr/references/frontend-cr.md)。三个原型使用内存演示数据，具体交互假设和验证见 [001](001-frontend-prototype/spec.md)，不新增正式 API 合同。

### DEC-08 最小前端骨架（用户本次范围）

使用 frontend/ 独立 npm 工程，Vue 3 + TS + Vite，接入约定的 Element Plus、Tailwind、Pinia、Vue Router 与 Axios。首页采用 hash 路由，统一 JSON 请求入口使用 /api/v1，开发代理仅通往 Web BackEnd。版本与 Node 兼容依据集中于 [版本记录](000-frontend-init-feature/versions.md)，验收见 [功能规范](000-frontend-init-feature/spec.md)。不提前定义 Q-02/Q-06 中的业务 DTO 或结果接口。

### DEC-01 服务隔离（原文约束）

保留六模块与四独立后端进程。公共功能封装为 Maven 可引用组件；每个服务保持自己的 `pom.xml` 和标准 `src/main`、`src/test` 目录。代价是跨进程联调和配置复杂度，靠接口契约与分阶段测试控制。

### DEC-02 任务调度（原文约束 + 待定补充）

每个选中电表读取全部选中数据项；UCI 一表一任务，逐项等待结果，跨表并行。采用每表 FIFO、有界并发、失败后继续；上限和期限见 [执行合同](003-key-contracts/execution.md)。

taskId、meterTaskId、attemptId、messageId、connectionId、invokeId 显式关联；MQ 重投递和旧尝试隔离见 [HTTP/MQ](003-key-contracts/http-mq.md)，不依靠 MQ 自动保证业务只处理一次。

### DEC-03 数据模型（原文约束）

库名 `hes_db`，字符集 `utf8mb4`，排序规则 `utf8mb4_general_ci`。

| 表 | 字段与类型 |
| --- | --- |
| asset_meter | id bigint；meter_address varchar(50)；meter_name varchar(100)；meter_type/protocol_type/communication_mode varchar(20)；auth_password varchar(50)；status tinyint；create_time/update_time datetime |
| dict_data_item | id bigint；data_item_id varchar(50)；data_item_name/data_item_name_en varchar(100)；obis_code varchar(20)；class_id/attribute_id int；data_type/unit varchar(20)；scaler int；description varchar(500)；status tinyint；create_time/update_time datetime |

`meter_address`、`data_item_id` 分别唯一索引；`obis_code` 普通索引。数据项 ID 格式 `OBIS_classId_attributeId`。状态为 0 禁用、1 启用。英文名、单位、缩放因子、说明为原文可选字段。必填/默认值/主键生成方式尚需在 SQL 和 DTO 中统一（Q-06）。字典初始化依据文档 07 §4.3，覆盖电压、电流、功率、电能等。

### DEC-04 HTTP 与消息契约（原文约束）

外部接口统一 POST，路径与返回约定见 [spec.md](spec.md#req-api-01-http-契约)。常规 JSON 为 `code/message/data`；成功示例 code=200，失败示例 code=500、data=null；业务错误码枚举与 HTTP 状态对应关系尚未规定。文件导出为 Excel/CSV 流。

MQMessage 保留原文字段和 ReadTask/ReadResult/StatusReport 类型，增加 schemaVersion；meters/dataItems 固定单元素，dlmsMessage 仅为 APDU。具体 DTO、抄读及查询 HTTP 错误规则见 [合同](003-key-contracts/http-mq.md)；其他业务细节仍见 Q-06。

### DEC-05 协议实现（原文约束 + 阻塞问题）

Protocol 自研并由三个服务复用；[协议合同](003-key-contracts/protocol.md) 核对一手实现参考后按 00 标准方向纠正 07 的简化头和 GET BER 表述，明确扩展边界、最小编码范围和固定样本。Q-01 文档决策完成，独立互通验证保留在 T-05/T-16，不能声称已符合完整 IEC 标准。

### DEC-06 实时结果（003 已确定）

新增 POST /api/v1/demandRead/result；前端串行轮询完整快照，UCI 持有结果，Web BackEnd 经内部 HTTP 转发。轮询间隔、断线恢复和保留见 [执行合同](003-key-contracts/execution.md)。选择原因是保持原 POST 风格、避免增加推送通道，代价为轮询延迟和请求开销。接口定义已完成，运行实现仍由 T-12 交付。

### DEC-07 日志（原文约束 + 设计补充）

Logger 基于 Lucene 和文件，输出控制台及文件；LoggerQuery 支持分页、时间、级别、关键词。设计补充：用任务/消息关联标识定位链路，认证密码脱敏。跨进程日志聚合、索引写入所有权和刷新可见性见 Q-07，避免多个进程直接争用同一索引。

## 部署与协作

按文档 11 的顺序启动：MySQL:3306 → ActiveMQ:61616 → Channels:9999 → 模拟表（主动连接）→ UCI:8081 → Web BackEnd:8080 → 前端静态服务:80。ActiveMQ 管理控制台为 8161，属于管理端口。

分工沿用文档 11：A 前端；B Web BackEnd/数据库；C UCI/Protocol；D Channels/MQBus；E 模拟表/Logger/LoggerQuery。这是项目成员分工，不要求自动启动多个 AI 代理。

## Risks 与验证

| 风险 | 对策与证据 |
| --- | --- |
| 协议双方共享错误实现而互测通过 | 固定报文样本与独立参考核验，记录编码范围与兼容性限制 |
| 登录字段和协议指导表述不一致 | 按任务书发送全部登录字段，Q-01 固化解析合同 |
| MQ 重复/响应串表/无限等待 | 关联标识、终态约束、有界超时，验证重复与迟到响应 |
| 字典缩放或唯一性处理错误 | 验证同 OBIS 不同类/属性、数值类型和单位 |
| 技术版本未锁定 | 在构建骨架前记录 Java/Node 与依赖兼容性，锁定实际版本 |
| 只有页面演示没有链路 | 保留四进程日志、消息轨迹和前端结果，执行验收一票否决检查 |

测试分层：Protocol/MQBus/Logger 和服务单元测试；DB/API/MQ/TCP 集成测试；真实进程端到端测试。覆盖率至少 60% 来自任务书；覆盖率工具及统计范围在 T-15 明确。设计补充不得替代原始验收项。
