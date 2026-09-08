export type LogLevel = 'INFO' | 'WARN' | 'ERROR'
export interface LogEntry { id: string; time: string; level: LogLevel; service: string; summary: string; detail: string; traceId: string }
export interface LogFilters { keyword: string; level: string; service: string; range: [string, string] | null }
