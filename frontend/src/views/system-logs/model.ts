import type { LogEntry, LogFilters } from './types/index.ts'
export const demoLogs: LogEntry[] = [
  { id: 'LOG-001', time: '2026-09-08 09:42:18', level: 'INFO', service: 'UCI', summary: '采集任务完成，共返回 6 项数据', detail: '演示事件：两台电表的电压、电流、有功功率已完成采集，6 项成功，0 项失败。该记录仅用于原型展示。', traceId: 'DEMO-20260908-001' },
  { id: 'LOG-002', time: '2026-09-08 09:42:16', level: 'INFO', service: 'Channels', summary: '应用连接认证成功，开始转发 GET 请求', detail: '演示事件：电表 100000000001 的 LLS 应用连接已建立，进入请求转发阶段。认证密码不记录在日志中。', traceId: 'DEMO-20260908-001' },
  { id: 'LOG-003', time: '2026-09-08 09:40:03', level: 'WARN', service: 'Channels', summary: '电表心跳超时，连接已断开', detail: '演示事件：电表 100000000005 超过 9 分钟未收到心跳，标记为离线并清理连接映射。', traceId: 'DEMO-20260908-002' },
  { id: 'LOG-004', time: '2026-09-08 09:38:52', level: 'ERROR', service: 'Channels', summary: 'LLS 应用连接认证失败', detail: '演示事件：电表 100000000008 返回非零认证结果，未发送 GET 请求。请在正式系统中检查配置。', traceId: 'DEMO-20260908-003' },
  { id: 'LOG-005', time: '2026-09-08 09:36:20', level: 'INFO', service: 'Web BackEnd', summary: '电表档案保存成功', detail: '演示事件：保存电表 100000000006 的档案信息。', traceId: 'DEMO-20260908-004' },
  { id: 'LOG-006', time: '2026-09-08 09:35:11', level: 'INFO', service: 'DLMS 模拟表', summary: '模拟电表登录成功，开始发送心跳', detail: '演示事件：TCP 客户端连接已建立，收到登录成功响应，心跳间隔 3 分钟。', traceId: 'DEMO-20260908-005' },
  { id: 'LOG-007', time: '2026-09-08 09:32:44', level: 'WARN', service: 'UCI', summary: '收到迟到响应，已忽略', detail: '演示事件：响应到达时任务已结束，本次响应未覆盖原有结果。', traceId: 'DEMO-20260908-006' },
  { id: 'LOG-008', time: '2026-09-08 09:30:02', level: 'ERROR', service: 'UCI', summary: '数据项响应超时，任务项标记失败', detail: '演示事件：未在等待窗口内收到数据项响应，该项无有效读数。', traceId: 'DEMO-20260908-007' },
  { id: 'LOG-009', time: '2026-09-08 09:28:30', level: 'INFO', service: 'Web BackEnd', summary: '收到随时抄表请求，已创建任务', detail: '演示事件：请求包含两台电表、三个数据项，任务已交由 UCI 处理。', traceId: 'DEMO-20260908-001' },
  { id: 'LOG-010', time: '2026-09-08 09:25:00', level: 'INFO', service: 'Channels', summary: 'TCP 服务监听就绪', detail: '演示事件：Channels 已准备接收模拟表连接。', traceId: 'DEMO-20260908-008' },
]
export function filterLogs(logs: LogEntry[], filters: LogFilters): LogEntry[] {
  const keyword = filters.keyword.trim().toLowerCase()
  return logs.filter((log) => (!filters.level || log.level === filters.level) &&
    (!filters.service || log.service === filters.service) &&
    (!keyword || `${log.summary} ${log.detail} ${log.traceId}`.toLowerCase().includes(keyword)) &&
    (!filters.range || (log.time >= filters.range[0] && log.time <= filters.range[1])))
}
