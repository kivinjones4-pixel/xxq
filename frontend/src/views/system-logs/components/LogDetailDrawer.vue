<script setup lang="ts">
import { ElDrawer, ElTag } from 'element-plus'
import type { LogEntry } from '../types'
defineProps<{ entry?: LogEntry }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ElDrawer
    :model-value="!!entry"
    title="日志详情"
    size="min(540px, 100vw)"
    @close="emit('close')"
  >
    <template v-if="entry">
      <div class="text-[#82948b] text-[9px] tracking-[1.7px] font-semibold mb-2.25">
        EVENT DETAILS · 演示记录
      </div><h2 class="text-[21px] leading-[1.6] font-medium">
        {{ entry.summary }}
      </h2>
      <dl class="grid grid-cols-[95px_1fr] gap-[18px_10px] text-[12px] px-0 py-6">
        <dt class="text-[#93a097]">
          日志编号
        </dt><dd class="wrap-anywhere m-0">
          {{ entry.id }}
        </dd><dt class="text-[#93a097]">
          发生时间
        </dt><dd class="wrap-anywhere m-0">
          {{ entry.time }} UTC+8
        </dd><dt class="text-[#93a097]">
          日志级别
        </dt><dd class="wrap-anywhere m-0">
          <ElTag :type="entry.level === 'ERROR' ? 'danger' : entry.level === 'WARN' ? 'warning' : 'info'">
            {{ entry.level }}
          </ElTag>
        </dd><dt class="text-[#93a097]">
          来源服务
        </dt><dd class="wrap-anywhere m-0">
          {{ entry.service }}
        </dd><dt class="text-[#93a097]">
          追踪编号
        </dt><dd class="wrap-anywhere m-0">
          {{ entry.traceId }}
        </dd>
      </dl>
      <h3 class="text-[13px] mx-0 my-3">
        完整消息
      </h3><pre class="whitespace-pre-wrap wrap-anywhere leading-[1.9] bg-[#f4f7f5] border border-solid border-[#e4eae6] text-[#657c6c] rounded-[6px] font-[inherit] text-[12px] p-5">{{ entry.detail }}</pre>
      <p class="text-[#8a9a8f] text-[12px] leading-[1.8] mb-5">
        此处为固定演示日志，未查询实际日志文件。
      </p>
    </template>
  </ElDrawer>
</template>
