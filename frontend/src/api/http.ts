import axios from 'axios'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const http = axios.create({ baseURL: '/api/v1', timeout: 15000 })

http.interceptors.response.use((response) => {
  const body = response.data as ApiResponse<unknown>
  if (body.code !== 200) {
    throw new ApiError(body.code, body.message || '请求失败')
  }
  return response
})

/** 仅用于普通 JSON 接口；错误交给调用方展示，不在拦截器中重复提示。 */
export async function post<T>(path: string, data: unknown, signal?: AbortSignal): Promise<T> {
  const response = await http.post<ApiResponse<T>>(path, data, { signal })
  return response.data.data
}
