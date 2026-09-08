import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterMeters, validateMeter } from '../src/views/meter-assets/model.ts'
import { completeResult, dataItems } from '../src/views/demand-read/model.ts'
import { demoLogs, filterLogs } from '../src/views/system-logs/model.ts'
import { toCsv } from '../src/utils/csv.ts'
import type { Meter } from '../src/types/meter.ts'
import type { ReadResult } from '../src/views/demand-read/types/index.ts'

const meter: Meter = { id: 'a', address: '001', name: '园区总表', type: '三相电表', status: 0, online: true, updatedAt: '' }
test('档案组合筛选保留禁用状态 0，地址唯一性排除当前编辑记录', () => {
  assert.equal(filterMeters([meter], { keyword: ' 001 ', type: '三相电表', status: 0 }).length, 1)
  assert.equal(filterMeters([meter], { keyword: '未知', type: '', status: '' }).length, 0)
  assert.ok(validateMeter({ ...meter, address: ' 001 ' }, [meter]))
  assert.equal(validateMeter(meter, [meter], 'a'), '')
  assert.ok(validateMeter({ ...meter, name: '  ' }, []))
})
test('模拟结果保留 0；超时与认证失败不产生有效读数；同 OBIS 属性 ID 不合并', () => {
  const row: ReadResult = { id: 'a:current', meterId: 'a', meterName: '', address: '', dataItemId: dataItems[1]!.id, itemName: '', unit: 'A', value: null, state: 'reading', message: '' }
  assert.equal(completeResult(row, 'normal', 'a').value, 0)
  assert.equal(completeResult(row, 'timeout', 'a').value, null)
  assert.equal(completeResult(row, 'auth', 'a').state, 'failed')
  assert.equal(completeResult(row, 'auth', 'b').state, 'success')
  assert.equal(dataItems.filter((item) => item.obis === '1.0.32.7.0.255').length, 2)
  assert.equal(new Set(dataItems.map((item) => item.id)).size, dataItems.length)
})
test('日志按闭区间时间、级别、服务、关键词共同过滤', () => {
  const result = filterLogs(demoLogs, { range: ['2026-09-08 09:38:52', '2026-09-08 09:38:52'], level: 'ERROR', service: 'Channels', keyword: '认证' })
  assert.deepEqual(result.map((log) => log.id), ['LOG-004'])
  assert.equal(filterLogs(demoLogs, { range: null, level: 'INFO', service: '', keyword: '不存在' }).length, 0)
})
test('CSV 转义字段且防止公式注入，保留数值 0', () => {
  assert.equal(toCsv([['a,"b', '=1+1', 0, '行1\n行2']]), '\uFEFF"a,""b","\'=1+1","0","行1\n行2"')
  assert.ok(toCsv([['  @SUM(A1)']]).includes("'  @SUM"))
})
