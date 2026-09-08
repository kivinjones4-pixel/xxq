import type { Meter } from '../../types/meter.ts'
import type { MeterDraft, MeterFilters } from './types/index.ts'

export function filterMeters(meters: Meter[], filters: MeterFilters): Meter[] {
  const keyword = filters.keyword.trim().toLowerCase()
  return meters.filter((meter) =>
    (!keyword || `${meter.name} ${meter.address}`.toLowerCase().includes(keyword)) &&
    (!filters.type || meter.type === filters.type) &&
    (filters.status === '' || meter.status === filters.status))
}

export function validateMeter(draft: MeterDraft, meters: Meter[], id?: string): string {
  if (!draft.name.trim() || !draft.address.trim()) return '请填写电表名称和表号'
  if (draft.name.trim().length > 100 || draft.address.trim().length > 50) return '电表名称最多 100 字，表号最多 50 字'
  if (meters.some((meter) => meter.address === draft.address.trim() && meter.id !== id)) return '该表号已存在，请使用唯一表号'
  return ''
}
