# HTTP 与 MQ v1

本文件固化抄读链路及其选表/选项依赖，来源 05 §1–4、06 §2。新增结果和内部路由为设计补充。未列出的档案写入、导入导出、日志 DTO 仍见 Q-06/Q-07，不能推断其已实现。

## 公共类型

JSON UTF-8，Content-Type application/json；所有 HTTP 接口 POST。数据库 bigint ID 一律十进制字符串，dataItemId 为 `OBIS_classId_attributeId` 字符串，不是字典 bigint 主键或单独 OBIS。任务、子任务、请求、尝试、消息标识均用 UUID 字符串；示例使用合法固定 UUID。时间 UTC RFC3339，毫秒精度；timeoutMs 等为 JSON 整数，拒绝字符串、null、小数及未知请求字段。

HTTP 状态与 code 一致：200 成功，400 参数错误，404 未知任务/ID，409 requestId 冲突，410 任务已过期，429 容量不足，500 内部错误，503 下游不可用，504 下游 HTTP 超时。响应始终 code/message/data；错误 data=null，message 使用稳定错误标识，可附中文说明。非成功 HTTP 响应前端也须读取统一错误体；不能只处理 HTTP 200。GET 数据项失败仍是查询 HTTP 200，由行状态表达。

## 前端 → Web BackEnd

| 路径（前缀 /api/v1） | 请求 | data |
| --- | --- | --- |
| /meter/list | pageNum=1、pageSize=20（1..100），可选 meterName≤100 字符、meterType≤20 字符、status=0/1 | total 整数、list 电表对象 |
| /dataItem/list | 同分页；可选 dataItemName≤100 字符 | total、list 字典对象，仅返回 status=1 |
| /demandRead/start | requestId、meterIds（1..100）、dataItemIds（1..50）、timeoutMs=5000（1000..30000）、retryCount=0（0..3） | taskId、status、total、createdAt |
| /demandRead/result | taskId | 完整快照，见下例 |

分页筛选空字符串视为无筛选，名称为字面子串，不作 SQL 通配表达式，结果按 bigint id 升序。meter 对象为 id、meterAddress、meterName、meterType、protocolType、communicationMode、status、createTime、updateTime；不返回 authPassword。数据项为 id、dataItemId、dataItemName、obisCode、classId、attributeId、dataType、unit（可 null）、scaler（缺省0）、status。不从 status 推断在线状态。

start 两个数组不得有重复值；全部存在且启用才原子接收，不接受一半。UCI 从数据库读取档案与字典快照，不信任前端传入地址/密码/OBIS。选中表必须支持 DLMS/TCP，密码满足 protocol.md；不满足为 400 INVALID_METER_CONFIG。运行中编辑/删除档案不改变已接收快照，后续提交读取新数据。

start 示例：

```json
{"requestId":"00000000-0000-4000-8000-000000000001","meterIds":["1"],"dataItemIds":["1.1.32.7.0.255_3_2"],"timeoutMs":5000,"retryCount":0}
```

```json
{"code":200,"message":"success","data":{"taskId":"00000000-0000-4000-8000-000000000002","status":"QUEUED","total":1,"createdAt":"2026-09-10T00:00:00.000Z"}}
```

result 请求与成功快照：

```json
{"taskId":"00000000-0000-4000-8000-000000000002"}
```

```json
{"code":200,"message":"success","data":{"taskId":"00000000-0000-4000-8000-000000000002","status":"SUCCEEDED","done":true,"total":1,"completed":1,"succeeded":1,"failed":0,"createdAt":"2026-09-10T00:00:00.000Z","finishedAt":"2026-09-10T00:00:00.200Z","expiresAt":"2026-09-11T00:00:00.200Z","list":[{"meterTaskId":"00000000-0000-4000-8000-000000000003","meterId":"1","meterAddress":"M1","dataItemId":"1.1.32.7.0.255_3_2","status":"SUCCEEDED","attempts":1,"dataType":"double-long-unsigned","rawValue":"2300","scaler":-1,"value":"230.0","unit":"V","errorCode":null,"accessResult":null,"readAt":"2026-09-10T00:00:00.180Z"}]}}
```

排队/运行快照也从开始包含全部行，按 meterIds、dataItemIds 输入顺序排列；未读行 attempts=0、status=QUEUED，数值和 readAt 为 null。finishedAt/expiresAt 在终态前 null。失败行 status=FAILED，rawValue/value/readAt=null，errorCode 非空，accessResult 仅访问错误时为数值；例如 AUTH_FAILED。dataType/scaler/unit 始终使用任务字典快照。

错误示例：`{"code":400,"message":"INVALID_ARGUMENT: meterIds must not be empty","data":null}`；不存在 `404 TASK_NOT_FOUND`，已过期 `410 TASK_EXPIRED`；同 requestId 不同参数 `409 REQUEST_ID_CONFLICT`。

## Web BackEnd → UCI

UCI 暴露 POST `/internal/v1/demandRead/start`、`/internal/v1/demandRead/result`，请求、响应与外部抄读接口完全相同（不重复包装）。Web BackEnd 转发 requestId，不生成第二任务 ID。UCI 是任务/结果唯一所有者；Web BackEnd 不缓存终态、不解析协议。连接超时 1 秒，整次调用 3 秒；失败映射 503/504。start HTTP 超时不代表任务未创建，客户端只能以同 requestId 原参数重发；UCI 保证原子幂等。

保留 requestId→参数规范化摘要→taskId；数组顺序计入摘要，省略参数按默认值规范化。相同 ID/参数返回原 start 响应；冲突返回 409。保留至任务结果过期，删除后再保留 24 小时墓碑，墓碑期间返回 410，之后不保证幂等；前端每次新操作生成新 UUID。

## UCI ↔ Channels / MQBus

ActiveMQ Queue `HES.Task.Channels` / `HES.Result.UCI`；UTF-8 JSON JMS TextMessage（Java DTO 仍实现 Serializable，不用 ObjectMessage）。持久投递、事务 Session。v1 各一个 UCI/Channels 实例，实例 ID uci-1/channels-1；增加实例前必须另定路由/连接归属，不能随意增加竞争消费者。

公共字段全部必填：schemaVersion=1；priorityLevel=4（JMS 0..9 中本版固定4）；fromId/toId 实例 ID、fromType/toType 为 UCI/Channels；messageId 唯一 UUID；messageType 为 ReadTask/ReadResult/StatusReport；payload 对象。JMSCorrelationID：ReadTask 用 attemptId，ReadResult 用原 attemptId，StatusReport 用 connectionId；JMSMessageID 不代替业务 messageId。

ReadTask payload：taskId、meterTaskId、attemptId、attempt（从1计）、invokeId（1..15）、meters（恰好一项，meterId/meterAddress）、dataItems（恰好一项，dataItemId/obisCode/classId/attributeId）、authPassword、dlmsMessage（**仅 APDU** 大写 hex，无 Wrapper）、deadlineAt。保留原文集合名但长度固定1；Channels 添加 Wrapper。UCI 为每表分配 invokeId，Channels 检查当前会话未使用；若已耗尽/冲突则关闭旧连接并在期限内等新连接。Channels 不解释 GET 读数，但验证 APDU 请求 invokeId 与消息一致。

以下是测试夹具，密码 `t` 仅用于固定样本，禁止复制为部署默认密码：

invokeId 分配补充：UCI 每表按1..15循环分配；Channels 维护每连接已使用集合，遇到重复值先轮换连接后再执行。重试不复用上一尝试的值。收到响应必须匹配当前连接及其在途 invokeId，未匹配的响应丢弃，不绑定到其他等待请求。

```json
{"schemaVersion":1,"priorityLevel":4,"fromId":"uci-1","fromType":"UCI","toId":"channels-1","toType":"Channels","messageId":"00000000-0000-4000-8000-000000000004","messageType":"ReadTask","payload":{"taskId":"00000000-0000-4000-8000-000000000002","meterTaskId":"00000000-0000-4000-8000-000000000003","attemptId":"00000000-0000-4000-8000-000000000005","attempt":1,"invokeId":1,"meters":[{"meterId":"1","meterAddress":"M1"}],"dataItems":[{"dataItemId":"1.1.32.7.0.255_3_2","obisCode":"1.1.32.7.0.255","classId":3,"attributeId":2}],"authPassword":"t","dlmsMessage":"C001C100030101200700FF0200","deadlineAt":"2026-09-10T00:00:05.000Z"}}
```

ReadResult payload：taskId、meterTaskId、attemptId、requestMessageId、meterId、meterAddress、dataItemId、invokeId、connectionId（无连接时 null）、status=SUCCESS/ERROR、dlmsMessage（成功为原始响应 APDU hex，错误 null）、errorCode（成功 null）、receivedAt（UTC 接收/错误发生时刻）。协议访问拒绝仍是传输 SUCCESS，由 UCI 解码为业务失败。

```json
{"schemaVersion":1,"priorityLevel":4,"fromId":"channels-1","fromType":"Channels","toId":"uci-1","toType":"UCI","messageId":"00000000-0000-4000-8000-000000000006","messageType":"ReadResult","payload":{"taskId":"00000000-0000-4000-8000-000000000002","meterTaskId":"00000000-0000-4000-8000-000000000003","attemptId":"00000000-0000-4000-8000-000000000005","requestMessageId":"00000000-0000-4000-8000-000000000004","meterId":"1","meterAddress":"M1","dataItemId":"1.1.32.7.0.255_3_2","invokeId":1,"connectionId":"00000000-0000-4000-8000-000000000007","status":"SUCCESS","dlmsMessage":"C401C10006000008FC","errorCode":null,"receivedAt":"2026-09-10T00:00:00.180Z"}}
```

失败消息使用相同关联字段，status=ERROR、dlmsMessage=null、errorCode=AUTH_FAILED（或 execution.md 的传输错误）。禁止回传 authPassword。

StatusReport 从 Channels 送结果队列；payload 必填 meterAddress、connectionId、online（布尔）、reason=LOGIN/DISCONNECTED/HEARTBEAT_TIMEOUT、occurredAt、sequence（当前 Channels 进程内递增整数）、channelsEpoch（每次启动 UUID）。示例 payload：`{"meterAddress":"M1","connectionId":"00000000-0000-4000-8000-000000000007","online":false,"reason":"DISCONNECTED","occurredAt":"2026-09-10T00:00:01.000Z","sequence":2,"channelsEpoch":"00000000-0000-4000-8000-000000000008"}`。状态仅作观测，不能据其把正在抄读的项判成功或覆盖档案 status；新 epoch 清空旧观测。
