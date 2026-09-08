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
      <div class="eyebrow">
        EVENT DETAILS · 演示记录
      </div><h2 class="drawer-heading">
        {{ entry.summary }}
      </h2>
      <dl class="log-details">
        <dt>日志编号</dt><dd>{{ entry.id }}</dd><dt>发生时间</dt><dd>{{ entry.time }} UTC+8</dd><dt>日志级别</dt><dd>
          <ElTag :type="entry.level === 'ERROR' ? 'danger' : entry.level === 'WARN' ? 'warning' : 'info'">
            {{ entry.level }}
          </ElTag>
        </dd><dt>来源服务</dt><dd>{{ entry.service }}</dd><dt>追踪编号</dt><dd>{{ entry.traceId }}</dd>
      </dl>
      <h3 class="detail-title">
        完整消息
      </h3><pre class="log-message">{{ entry.detail }}</pre>
      <p class="dialog-note">
        此处为固定演示日志，未查询实际日志文件。
      </p>
    </template>
  </ElDrawer>
</template>
