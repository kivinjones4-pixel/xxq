/** 原型展示模型，不是正式后端 DTO。 */
export interface Meter {
  id: string
  address: string
  name: string
  type: '三相电表' | '单相电表'
  status: 0 | 1
  online: boolean
  updatedAt: string
}
