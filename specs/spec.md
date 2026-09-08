# HES 行为规范

前端工程初始化的补充验收见 [000-frontend-init-feature](000-frontend-init-feature/spec.md)，关联 REQ-ARCH-01、REQ-DELIVERY-01；不改变下述业务验收条件。
主要模块界面及页面独立目录补充验收见 [001-frontend-prototype](001-frontend-prototype/spec.md)；演示数据不作为下述业务功能的完成证据。

状态：原文要求基线；“设计补充”属于本次整理提出的稳健性要求，待在实现相关任务时确定细节。需求 ID 用于任务与验证追踪；场景使用 Given/When/Then（前置/操作/预期）。来源编号对应 [reference.md](reference.md)。

## REQ-ARCH-01 六模块与通信边界

来源：00 §5.1 A1–A4；02 §2–4。

系统必须包含六模块、四独立后端服务；UCI 与 Channels 必须经 MQBus 异步通信。

### Scenario：完整抄读链路

- Given 四服务运行，模拟表已登录。
- When 前端提交一次抄读。
- Then 请求经 Web BackEnd、UCI、MQBus、Channels 到达模拟表；响应回到 UCI 解码并展示，不能由页面硬编码替代。

## REQ-METER-01 档案管理

来源：00 §4.1 1.1–1.5；04 §2；05 §3.1–3.5。

必须支持分页、名称模糊查询、类型和状态筛选、按 ID 查详情、增改删；新增成功返回 ID，修改/删除后列表体现结果。

### Scenario：合法档案生命周期

- Given 提供符合已确定字段合同且地址未重复的档案。
- When 新增，随后查询、修改并删除。
- Then 新增返回 ID；详情与修改后的数据一致；删除后列表不再出现该记录。

### Scenario：唯一地址

- Given 地址已存在。
- When 再次新增或修改另一记录为该地址。
- Then 唯一约束阻止重复数据，返回可识别失败。

设计补充：不存在的 ID、缺失必填字段、非法状态应明确报错；必填集合、删除方式见 Q-06。

## REQ-METER-02 导入导出

来源：00 §4.1 1.6–1.7；05 §3.6–3.7。

### Scenario：批量导入校验

- Given Excel/CSV 包含有效行、重复地址或格式错误行。
- When 执行导入。
- Then 返回成功数、失败数和失败详情；不得将错误行报告为成功。是否全批回滚由 Q-06 确定。

### Scenario：按查询条件导出

- Given 用户已设置查询筛选条件。
- When 导出。
- Then 下载满足当前查询条件的 Excel/CSV 文件，不额外包含其他筛选条件下的数据；分页导出范围需在 Q-06 明确。

## REQ-DATA-01 数据与唯一标识

来源：00 §5.3 D1–D3；04 §1–4；07 §4.3。

必须有 `asset_meter`、`dict_data_item` 两张核心表及初始化脚本。电表地址即表号，唯一；保留 `auth_password` 用于 LLS。数据项 ID 为 `OBIS_classId_attributeId`，唯一；不能将 OBIS 单独设为唯一键。status=0/1 表示禁用/启用，不承载网络在线状态。

### Scenario：同 OBIS 多属性

- Given 字典中同一 OBIS 对应不同 classId 或 attributeId。
- When 初始化字典、查询并选取这些数据项。
- Then 可同时保存和区分，GET 构造使用选中项的完整对象标识。

## REQ-READ-01 选择、拆分与并发

来源：00 §4.2 2.1–2.3；02 §2.2；05 §4；07 §5.1。

### Scenario：两表三项

- Given 用户选择两个有效电表和三个有效数据项。
- When 提交随时抄表。
- Then 返回任务 ID；UCI 分为两个电表任务，每表读取全部三项；同任务上项完成后才发下项，不同表可并行。

### Scenario：完整数据项选择

- Given 页面加载电表列表与数据项字典。
- When 用户勾选对象并提交超时、重试参数。
- Then 服务按档案读取地址/认证密码，按字典读取 OBIS/classId/attributeId，不依赖前端任意拼装协议对象。

设计补充：空列表、未知 ID、非法参数需明确失败；重试范围、部分失败行为、同表跨批次串行策略见 Q-04。

## REQ-READ-02 实时结果与异常

来源：00 §4.2 2.4–2.5；05 §4.3；07 §6.3。

### Scenario：结果实时展示

- Given 已提交任务且模拟表认证成功。
- When UCI 接收到并解码数据。
- Then 前端展示对应电表和数据项的抄读结果；具体传输合同见 Q-02，不能只返回任务 ID 而无结果通路。

### Scenario：通信、协议和业务失败

- Given 电表不响应、响应不能解码或属性不支持。
- When 抄读发生相应异常。
- Then 系统处理并记录对应错误，不将失败显示为有效读数。

设计补充：每项有明确成功/失败终态与错误原因；重复、迟到响应不得覆写错误对象或重复计数。终态与保留期限见 Q-03/Q-04。

## REQ-CONN-01 登录、心跳与重连

来源：00 §5.2 P3–P5；02 §2.4；07 §3.3；08 §4、6、9。

### Scenario：连接后登录

- Given 模拟表已从数据库加载档案。
- When 模拟表主动连接 Channels TCP 端口。
- Then 发送类型 0x01，包含 meterAddress、serialNumber、meterType、timestamp；Channels 建立地址映射，返回 0x81、result、timestamp；result=0 后进入心跳状态。

说明：07 将 serialNumber/meterType 列为可选，00 要求包含；基线发送端按优先级包含，接收兼容规则见 Q-01。

### Scenario：心跳成功

- Given 电表已登录。
- When 每 3 分钟发送 0x02，含 meterAddress、timestamp。
- Then Channels 更新最后心跳时间，返回 0x82、result、timestamp。

### Scenario：超时与重新登录

- Given 超过 9 分钟未收到心跳。
- When Channels 执行超时检查。
- Then 标记离线、断开 TCP 并清理映射；模拟表按重连配置重新连接和登录。

设计补充：重复地址连接处理、未登录心跳、断连后的旧回调不得误删新连接；规则见 Q-05。恰好 9 分钟边界按 Q-05 固化，原文正文表述为“超过”。

## REQ-AUTH-01 LLS 应用连接

来源：00 §5.2 P6；07 §3.4；08 §4.1。

### Scenario：正确密码

- Given 当前 TCP 会话尚未建立应用连接。
- When Channels 用 UCI 提供的档案密码发送 LLS AARQ。
- Then 模拟表与自身档案密码比对，一致返回 AARE result=0，Channels 才发送 GET。

### Scenario：错误密码

- Given AARQ 密码与模拟表密码不一致。
- When 模拟表验证。
- Then 返回非 0 认证结果，不得继续 GET 或显示抄读成功。

## REQ-PROTO-01 协议与对象

来源：00 §5.2 P1–P2、P7；06 §3；07 §3–4。

Protocol 必须自研并被三个服务复用；实现 Wrapper、登录/心跳 BER、AARQ/AARE、GET 请求响应与 OBIS 六段表示。完整字节布局及编码范围需先解决 Q-01。

### Scenario：GET 请求响应关联

- Given 有效字典项和已认证会话。
- When UCI 编码 GET，模拟表返回匹配 invokeId 的响应。
- Then UCI 解码对应数据类型并关联正确电表和数据项。

设计补充：半包需等待完整数据，多帧需逐帧解析；非法长度、截断和未知类型不得导致无界分配或错误成功；以 Q-01 确定后的固定报文样本验证。

## REQ-MQ-01 异步消息

来源：02 §3.3；06 §2、6。

任务队列 `HES.Task.Channels`，结果队列 `HES.Result.UCI`；MQBus 封装 ActiveMQ/JMS。MQMessage 具有发送方、接收方、优先级、唯一 messageId、类型与载荷。消息对象支持序列化，队列操作线程安全。

### Scenario：发送与回传

- Given UCI 已构造 GET 与电表任务数据。
- When 消息进入任务队列，Channels 完成通信。
- Then 响应经结果队列回到 UCI，保留用于关联任务和电表的信息。

设计补充：失败投递、重投递、错误路由有可诊断结果；确认/重试/去重语义见 Q-03。

## REQ-SIM-01 多表模拟

来源：08 §2、4–6、9。

### Scenario：多实例与数据生成

- Given 配置多个电表实例。
- When 启动模拟服务并抄读。
- Then 各实例独立连接、登录和心跳；LLS 校验基于各自档案；电压 220–240 V、电流 0–10 A、有功功率 0–2000 W 为原文示例范围，累计量按增量增加，时间量返回系统时间。

设计补充：可配置固定种子/数值用于稳定测试；范围应在物理量层验证，并核对字典数据类型、单位和缩放转换。

## REQ-LOG-01 文件日志查询

来源：00 §4.3；05 §5；06 §4–5。

### Scenario：查询、详情与导出

- Given 各服务通过 Logger 产生不同时间和级别的日志。
- When 用户按时间范围、级别、关键词分页查询，并查看详情或导出。
- Then LoggerQuery 从文件/Lucene 提供匹配结果、单条完整内容和查询结果文件；不得以新增数据库日志表替代该实现。

设计补充：过滤边界、排序、日志 ID、索引刷新与多进程收集见 Q-07；认证密码不进入可查询内容。

## REQ-API-01 HTTP 契约

来源：05 §1–5。以下全部为 POST；前缀 `/api/v1`。

| 路径后缀 | 行为/输入 | 结果 |
| --- | --- | --- |
| /meter/list | 分页、名称、类型、状态 | total/list |
| /meter/detail | 电表 ID | 档案详情 |
| /meter/save | 新增档案字段 | 电表 ID |
| /meter/update | ID 与修改字段 | 操作结果 |
| /meter/delete | 电表 ID | 操作结果 |
| /meter/import | Excel/CSV 上传 | 成功数、失败数、失败详情 |
| /meter/export | 列表查询条件 | Excel/CSV 文件流 |
| /dataItem/list | 分页、名称 | 数据项列表 |
| /demandRead/start | 电表 ID 列表、数据项 ID 列表、超时、重试次数 | 任务 ID |
| /log/sys/list | 分页、时间、级别、关键词 | 日志列表 |
| /log/sys/detail | 日志 ID | 完整日志 |
| /log/sys/export | 日志查询条件 | Excel/CSV 文件流 |

### Scenario：统一返回

- Given 非文件接口请求。
- When 请求完成。
- Then JSON 使用 `code/message/data`；成功示例 200/success；失败示例 500/错误信息/null；分页 data 中含 total/list。具体 DTO、业务错误码、HTTP 状态、上传媒体类型见 Q-06。

## REQ-DELIVERY-01 工程交付

来源：00 §6–10；03 §8–9；10；11 §6–7。

### Scenario：可复现验收

- Given 按部署文档准备环境与初始化数据。
- When 启动四个后端服务与前端并执行三大功能。
- Then 可完成真实端到端抄读、档案管理和日志查询；提交 API 测试、核心单元测试至少 60% 覆盖率报告、部署说明和验收证据。没有实际运行证据的项目不得报告为通过。
