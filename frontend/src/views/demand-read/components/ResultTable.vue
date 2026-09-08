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
    class="data-table"
  >
    <ElTableColumn
      label="电表"
      min-width="200"
    >
      <template #default="{ row }">
        <div class="cell-stack">
          <strong>{{ row.meterName }}</strong><small>{{ row.address }}</small>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="数据项"
      min-width="180"
    >
      <template #default="{ row }">
        <div class="cell-stack">
          {{ row.itemName }}<small>{{ row.dataItemId }}</small>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="读取结果"
      min-width="145"
    >
      <template #default="{ row }">
        <strong class="result-value">{{ row.value ?? '—' }}</strong><span
          v-if="row.value !== null"
          class="result-unit"
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
