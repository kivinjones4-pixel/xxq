<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElDatePicker, ElInput, ElSelect, ElOption, ElButton, ElTable, ElTableColumn, ElTag, ElPagination, ElMessage } from 'element-plus'
import StatCard from '../../components/StatCard.vue'
import AppIcon from '../../components/AppIcon.vue'
import { demoLogs, filterLogs } from './model'
import type { LogEntry, LogFilters } from './types'
import LogDetailDrawer from './components/LogDetailDrawer.vue'
import { downloadCsv } from '../../utils/csv'
defineOptions({ name: 'SystemLogsView' })
const filters = reactive<LogFilters>({ keyword: '', level: '', service: '', range: null })
const filtered = computed(() => filterLogs(demoLogs, filters))
const page = ref(1)
const visible = computed(() => filtered.value.slice((page.value - 1) * 6, page.value * 6))
const detail = ref<LogEntry>()
watch(filters, () => { page.value = 1 })
function reset() { Object.assign(filters, { keyword: '', level: '', service: '', range: null }) }
function exportLogs() {
  downloadCsv('系统日志-演示.csv', [['时间（UTC+8）', '级别', '来源服务', '消息', '详情', '追踪编号'], ...filtered.value.map((log) => [log.time, log.level, log.service, log.summary, log.detail, log.traceId])])
  ElMessage.success(`已导出 ${filtered.value.length} 条匹配的演示日志`)
}
</script>

<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow">
        SYSTEM OBSERVABILITY
      </div><h1>系统日志</h1><p>追踪系统运行事件，快速定位采集与通信问题。</p>
    </div><ElButton
      size="large"
      :disabled="!filtered.length"
      @click="exportLogs"
    >
      <AppIcon
        name="download"
        :size="17"
      />导出日志
    </ElButton>
  </div>
  <div class="stats-grid">
    <StatCard
      label="演示日志"
      :value="demoLogs.length"
      note="2026-09-08 · 固定样例"
      icon="log"
    />
    <StatCard
      label="信息 / INFO"
      :value="demoLogs.filter(l => l.level === 'INFO').length"
      note="正常运行与任务记录"
      icon="info"
      tone="blue"
    />
    <StatCard
      label="警告 / WARN"
      :value="demoLogs.filter(l => l.level === 'WARN').length"
      note="需要关注的运行事件"
      icon="clock"
      tone="amber"
    />
    <StatCard
      label="错误 / ERROR"
      :value="demoLogs.filter(l => l.level === 'ERROR').length"
      note="认证失败与采集异常"
      icon="bolt"
      tone="red"
    />
  </div>
  <section class="panel">
    <div class="panel-title">
      <div><h2>事件记录 <span class="count-badge">{{ filtered.length }}</span></h2><p>按时间倒序展示 · 北京时间 UTC+8</p></div><span class="subtle-text">静态演示数据</span>
    </div>
    <div class="log-filters">
      <label class="filter-field date-filter"><span>时间范围</span><ElDatePicker
        v-model="filters.range"
        type="datetimerange"
        value-format="YYYY-MM-DD HH:mm:ss"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        range-separator="至"
        :default-value="[new Date(2026, 8, 8), new Date(2026, 8, 8)]"
      /></label>
      <label class="filter-field"><span>日志级别</span><ElSelect
        v-model="filters.level"
        aria-label="日志级别"
      ><ElOption
        label="全部级别"
        value=""
      /><ElOption
        v-for="level in ['INFO', 'WARN', 'ERROR']"
        :key="level"
        :value="level"
        :label="level"
      /></ElSelect></label>
      <label class="filter-field"><span>来源服务</span><ElSelect
        v-model="filters.service"
        aria-label="来源服务"
      ><ElOption
        label="全部服务"
        value=""
      /><ElOption
        v-for="service in ['Web BackEnd', 'UCI', 'Channels', 'DLMS 模拟表']"
        :key="service"
        :value="service"
        :label="service"
      /></ElSelect></label>
      <label class="filter-field log-search"><span>关键词</span><ElInput
        v-model="filters.keyword"
        clearable
        placeholder="搜索日志内容或追踪编号"
      ><template #prefix><AppIcon
        name="search"
        :size="16"
      /></template></ElInput></label><ElButton @click="reset">
        重置
      </ElButton>
    </div>
    <ElTable
      :data="visible"
      row-key="id"
      empty-text="没有匹配的日志，请调整筛选条件"
      class="data-table"
    >
      <ElTableColumn
        prop="time"
        label="发生时间"
        width="182"
      />
      <ElTableColumn
        label="级别"
        width="95"
      >
        <template #default="{ row }">
          <ElTag :type="row.level === 'ERROR' ? 'danger' : row.level === 'WARN' ? 'warning' : 'info'">
            {{ row.level }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn
        prop="service"
        label="来源服务"
        min-width="145"
      />
      <ElTableColumn
        label="事件消息"
        min-width="340"
      >
        <template #default="{ row }">
          <div class="cell-stack">
            <strong>{{ row.summary }}</strong><small>{{ row.traceId }}</small>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="操作"
        width="85"
        fixed="right"
      >
        <template #default="{ row }">
          <ElButton
            link
            type="primary"
            @click="detail = row as LogEntry"
          >
            详情
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="table-footer">
      <span>共 {{ filtered.length }} 条记录 · 每页 6 条</span><ElPagination
        v-model:current-page="page"
        :total="filtered.length"
        :page-size="6"
        layout="prev, pager, next"
        background
      />
    </div>
  </section>
  <div class="footnote">
    <AppIcon
      name="info"
      :size="15"
    />日志用于展示运行记录与错误定位流程，当前未连接日志查询服务。
  </div>
  <LogDetailDrawer
    :entry="detail"
    @close="detail = undefined"
  />
</template>
