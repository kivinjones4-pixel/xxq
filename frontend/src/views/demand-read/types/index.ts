export interface DataItem { id: string; name: string; obis: string; classId: number; attributeId: number; unit: string; sample: number | string }
export type DemoScenario = 'normal' | 'timeout' | 'auth'
export type ResultState = 'waiting' | 'reading' | 'success' | 'failed'
export interface ReadResult {
  id: string
  meterId: string
  meterName: string
  address: string
  dataItemId: string
  itemName: string
  unit: string
  value: number | string | null
  state: ResultState
  message: string
}
