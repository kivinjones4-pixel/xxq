import type { Meter } from '../../../types/meter'
export type MeterDraft = Pick<Meter, 'name' | 'address' | 'type' | 'status'>
export interface MeterFilters { keyword: string; type: string; status: '' | 0 | 1 }
