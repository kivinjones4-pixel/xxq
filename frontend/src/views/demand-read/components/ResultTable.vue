<script setup lang="ts">
import { ElTable, ElTableColumn, ElTag } from 'element-plus'
import type { ReadResult, ResultState } from '../types'
defineProps<{ results: ReadResult[] }>()
const labels: Record<ResultState, string> = { waiting: '等待中', reading: '读取中', success: '成功', failed: '失败' }
const tones = { waiting: 'info', reading: 'warning', success: 'success', failed: 'danger' } as const
</script>

<template>
  <ElTable
    :data="results"
    row-key="id"
    empty-text="选择电表和数据项，开始一次抄读演示"
    class="[--el-table-header-bg-color:#fafcfb] [--el-table-border-color:#eef2ef] [--el-table-row-hover-bg-color:#f6faf7] [--el-table-header-text-color:#7c8c81] [--el-table-text-color:#4d6055] [&_th.el-table\_\_cell]:h-11.25 [&_th.el-table\_\_cell]:text-[11px] [&_th.el-table\_\_cell]:font-medium [&_td.el-table\_\_cell]:h-18.25 [&_td.el-table\_\_cell]:text-[12px] [&_.cell]:pl-5 [&_.cell]:pr-3 [&_.el-tag]:text-[10px] [&_.el-tag]:h-5.5 [&_.el-tag]:border-[transparent] [&_.el-tag]:rounded-[4px] [&_.el-button]:text-[11px] wide:[&_td.el-table\_\_cell]:h-20"
  >
    <ElTableColumn
      label="电表"
      min-width="200"
    >
      <template #default="{ row }">
        <div>
          <strong class="block font-medium text-[#3e5547]">{{ row.meterName }}</strong><small class="block text-[#94a198] text-[10px] font-['Segoe_UI',_sans-serif] mt-0.75">{{ row.address }}</small>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="数据项"
      min-width="180"
    >
      <template #default="{ row }">
        <div>
          {{ row.itemName }}<small class="block text-[#94a198] text-[10px] font-['Segoe_UI',_sans-serif] mt-0.75">{{ row.dataItemId }}</small>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="读取结果"
      min-width="145"
    >
      <template #default="{ row }">
        <strong class="font-semibold text-[16px] text-[#395b47]">{{ row.value ?? '—' }}</strong><span
          v-if="row.value !== null"
          class="text-[10px] text-[#9ba99e] ml-1.5"
        >{{ row.unit }}</span>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="状态"
      width="100"
    >
      <template #default="{ row }">
        <ElTag :type="tones[row.state as ResultState]">
          {{ labels[row.state as ResultState] }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="说明"
      min-width="240"
      prop="message"
    />
  </ElTable>
</template>
