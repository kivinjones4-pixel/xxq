import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AxiosError } from 'axios'
import { ApiError, http, post } from '../src/api/http.ts'

test('JSON POST 成功解包、业务错误与传输错误保持区分', async () => {
  const original = http.defaults.adapter
  try {
    http.defaults.adapter = async (config) => {
      assert.equal(config.method, 'post')
      assert.equal(config.baseURL, '/api/v1')
      return { config, status: 200, statusText: 'OK', headers: {}, data: {
        code: 200, message: 'success', data: { total: 0, list: [] },
      } }
    }
    assert.deepEqual(await post('/fixture', {}), { total: 0, list: [] })
    http.defaults.adapter = async (config) => ({
      config, status: 200, statusText: 'OK', headers: {},
      data: { code: 500, message: '业务失败', data: null },
    })
    await assert.rejects(post('/fixture', {}), (error: unknown) =>
      error instanceof ApiError && error.code === 500 && error.message === '业务失败')
    const transportError = new AxiosError('Network Error', 'ERR_NETWORK')
    http.defaults.adapter = async () => { throw transportError }
    await assert.rejects(post('/fixture', {}), (error: unknown) => error === transportError)
  } finally {
    http.defaults.adapter = original
  }
})
