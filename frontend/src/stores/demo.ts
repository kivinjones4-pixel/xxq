import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Meter } from '../types/meter'

export const useDemoStore = defineStore('demo', () => {
  const names = ['研发中心 · 总表', '一号厂房 · 动力配电', '二号厂房 · 动力配电', '行政楼 · 一层', '行政楼 · 二层', '园区照明 · 东区', '园区照明 · 西区', '仓储中心 · 总表', '数据机房 · 配电', '员工餐厅 · 总表', '充电站 · 配电', '备用回路 · 测试表']
  const meters = ref<Meter[]>(names.map((name, index) => ({
    id: `demo-meter-${index + 1}`,
    address: `10000000${String(index + 1).padStart(4, '0')}`,
    name,
    type: index % 3 === 0 ? '单相电表' : '三相电表',
    status: index === 11 ? 0 : 1,
    online: ![4, 7, 11].includes(index),
    updatedAt: `2026-09-08 09:${String(42 - index).padStart(2, '0')}:18`,
  })))
  return { meters }
})
