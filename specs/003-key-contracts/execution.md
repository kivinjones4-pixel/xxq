# 调度、期限与结果生命周期

本文件是 Q-02–Q-05 的设计补充；原文仍约束一表一任务、同任务串行、跨表并行、LLS 在 GET 前完成。

## 调度与终态

UCI 按地址维护 FIFO，跨批次同表也互斥；一个 meterTask 完成全部项后释放地址锁。最多并行 16 个不同表任务，等待中的表任务总数上限 1000；提交先原子预留容量，不足则 429 且不创建部分任务。同表项按选择顺序执行，失败后继续下一项；AUTH_FAILED 或离线也逐项形成失败，不伪造未发项为成功。

行状态 QUEUED→RUNNING→SUCCEEDED/FAILED，重试仍为 RUNNING。终态不可改写。批次全未执行为 QUEUED；任一行开始后为 RUNNING；全部终态时：全成功 SUCCEEDED、全失败 FAILED、混合 PARTIAL_FAILED，done=true。completed=succeeded+failed，且 done 当且仅当 completed=total；状态由一致快照计算。

排队等待上限 60 秒，从提交接收起计，到期未激活的表任务全部项 FAILED/QUEUE_TIMEOUT。激活后每项尝试总预算 timeoutMs，包含 MQ 排队、等连接、AARQ、GET 和结果回传。UCI 发消息前创建 attemptId 并确定 deadlineAt；Channels 必须在期限内完成认证/GET，阶段不能各自重置预算。UCI 在 deadlineAt 到达（now>=deadline）抢占为 TIMEOUT，边界同一事件串行处理；只接受截止前收到的当前尝试结果。时钟跨服务同步误差目标≤100ms，本地等待用单调时钟，最终裁决在 UCI。

retryCount 是首次之外的重试次数，最多 1+retryCount 次；唯一负责业务重试的是 UCI。仅 TIMEOUT、DISCONNECTED、METER_OFFLINE、MQ_UNAVAILABLE 可重试，退避固定 500ms；每次新 attemptId/messageId/invokeId，过期的旧尝试永远不再有效。AUTH_FAILED、PROTOCOL_ERROR、UNSUPPORTED_APDU、DATA_TYPE_MISMATCH、DATA_ACCESS_ERROR、INVALID_MESSAGE 不重试。离线可立即报错，超时前也可等待连接；v1 固定为已有在线连接则执行，否则立即 METER_OFFLINE；因本合同主动轮换连接时允许等重新登录至期限。

Channels 自己在 deadlineAt 清理在途尝试并关闭超时连接，即使 UCI 没收到结果也不得遗留无限等待。下一条消息若到达但旧尝试尚在收尾，先清理过期尝试再处理；同表两个未过期的不同尝试为 INVALID_MESSAGE。重试必须使用新连接，禁止在超时旧连接再发 GET。

一表 n 项最坏预算为 `60000 + n*((retryCount+1)*timeoutMs + retryCount*500)` 毫秒，从批次接收起计；n≤50 最大 6,135,000ms。批次 deadline 取各表上界最大值，加 1000ms 调度余量；到期所有非终态行 FAILED/TASK_TIMEOUT。HTTP 调用超时与这些业务预算独立。

## MQ 确认、重投与幂等

JMS 接收事务在输入校验及本地任务登记后提交；禁止在无法登记时先确认。Channels 按 attemptId 原子登记执行中/已完成缓存，重复执行中不再发 GET；重复已完成重发缓存结果（同业务 messageId），不重复抄读。结果发送成功后保存缓存；发送失败每秒重试至 deadlineAt+60秒，届时仅记录错误，UCI 已用期限收敛。UCI 按当前 attemptId 和所有对象关联字段校验、原子落内存结果再确认；重复终态消息确认丢弃，不增加 completed。

消费异常回滚，broker 重投最多3次（初次之外），间隔1秒；耗尽进 ActiveMQ.DLQ。格式/路由错误直接送 DLQ 后确认，记录 messageId 和原因，禁止记录带密码 payload。ReadTask JMS TTL 为 max(1, deadlineAt-now) 毫秒；ReadResult TTL=60000ms；StatusReport TTL=60000ms。broker 到期/丢失由 UCI 超时兜底，不依赖 DLQ 生成业务结果。attempt 去重记录从终态保留24小时，已过 deadline 的消息即使缓存清除也不得执行。

v1 任务、结果、去重在内存，非跨重启 exactly-once。Channels 重启关闭全部 TCP，旧任务可能重投，但过期拒绝；允许崩溃窗口内只读 GET 重复执行，UCI 对用户只结算一次。UCI 重启后旧 taskId 返回404 TASK_NOT_FOUND（前端提示任务状态丢失，不自动重新提交），迟到结果丢弃；不承诺断电恢复或持久任务查询。当前不新增业务表。后续需可靠恢复时必须新增独立需求，不静默改变保证。

## 轮询和资源

提交成功立即查一次，之后前一次完成1秒后再查，最多一条在途查询。正常运行新结果通常在下一轮显示。网络失败以2、4、8、10秒退避，继续同 taskId；恢复后拿完整快照，不依赖游标/事件补发。终态、404、410停止；429按10秒重试。离开页面 abort 请求并清定时器；不取消服务器任务。前端保留 taskId 供返回页面恢复查询，不自动重复 start。

结果从终态起保留24小时，然后返回410；过期墓碑再保留24小时，之后404。支持最多10000个保留批次，满时拒绝新任务429，不提前驱逐仍承诺保留的结果。查询失败503/504不能当成任务失败。无取消、SSE 或 WebSocket 接口。
