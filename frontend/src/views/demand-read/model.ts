import type { DataItem, DemoScenario, ReadResult } from './types/index.ts'

export const dataItems: DataItem[] = [
  { id: '1.0.32.7.0.255_3_2', name: 'A 相电压', obis: '1.0.32.7.0.255', classId: 3, attributeId: 2, unit: 'V', sample: 228.6 },
  { id: '1.0.31.7.0.255_3_2', name: 'A 相电流', obis: '1.0.31.7.0.255', classId: 3, attributeId: 2, unit: 'A', sample: 0 },
  { id: '1.0.1.7.0.255_3_2', name: '有功功率', obis: '1.0.1.7.0.255', classId: 3, attributeId: 2, unit: 'W', sample: 1260.5 },
  { id: '1.0.1.8.0.255_3_2', name: '正向有功电能', obis: '1.0.1.8.0.255', classId: 3, attributeId: 2, unit: 'kWh', sample: 8421.32 },
  { id: '1.0.32.7.0.255_3_3', name: '电压单位与缩放', obis: '1.0.32.7.0.255', classId: 3, attributeId: 3, unit: '', sample: '10⁻¹ / V' },
]

/** 仅推进界面演示状态，不发送协议请求。 */
export function completeResult(result: ReadResult, scenario: DemoScenario, failedMeterId: string): ReadResult {
  const failed = scenario !== 'normal' && result.meterId === failedMeterId
  return { ...result, state: failed ? 'failed' : 'success',
    value: failed ? null : (dataItems.find((item) => item.id === result.dataItemId)?.sample ?? null),
    message: failed ? (scenario === 'auth' ? 'LLS 认证失败（模拟），未执行 GET' : '响应超时（模拟）') : '读取成功（模拟）',
  }
}
