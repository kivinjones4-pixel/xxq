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
  <div class="flex items-center justify-between gap-5 compact:items-start mb-6.5">
    <div>
      <div class="text-[#82948b] text-[9px] tracking-[1.7px] font-semibold mb-2.25">
        SYSTEM OBSERVABILITY
      </div><h1 class="text-[27px] tracking-[-.5px] font-[650] text-[#1b342a] compact:text-[23px] mb-2.25">
        系统日志
      </h1><p class="text-[12px] text-[#809088] leading-[1.6] compact:text-[11px]">
        追踪系统运行事件，快速定位采集与通信问题。
      </p>
    </div><ElButton
      class="[&>span]:gap-1.75"
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
  <div class="grid grid-cols-4 gap-4 compact:grid-cols-2 compact:gap-2.5 mb-6.5">
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
  <section class="bg-white border border-solid border-[#e3eae6] rounded-[9px] overflow-hidden min-w-0">
    <div class="flex justify-between items-center gap-4 compact:flex-wrap px-6 pt-5.75 pb-5 compact:px-4 compact:py-4.5">
      <div>
        <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
          事件记录 <span class="text-[10px] font-medium bg-[#f0f4f1] text-[#708277] rounded-[5px] px-1.75 py-0.5">{{ filtered.length }}</span>
        </h2><p class="text-[#97a39d] text-[10px] mt-1.75">
          按时间倒序展示 · 北京时间 UTC+8
        </p>
      </div><span class="text-[#93a099] text-[11px]">静态演示数据</span>
    </div>
    <div class="flex flex-wrap gap-3.75 border-t border-solid border-t-[#edf1ee] border-b border-b-[#edf1ee] bg-[#fcfdfc] items-end px-6 py-4.5 compact:p-4">
      <label class="flex flex-col gap-2 w-90 min-w-0 [&_.el-select]:w-full [&_.el-date-editor]:w-full tablet:w-85 compact:w-85 compact:flex-1 compact:min-w-[110px] compact:basis-full"><span class="text-[11px] text-[#6b7e72]">时间范围</span><ElDatePicker
        v-model="filters.range"
        type="datetimerange"
        value-format="YYYY-MM-DD HH:mm:ss"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        range-separator="至"
        :default-value="[new Date(2026, 8, 8), new Date(2026, 8, 8)]"
      /></label>
      <label class="flex flex-col gap-2 w-37.5 min-w-0 [&_.el-select]:w-full tablet:w-32.5 compact:w-32.5 compact:flex-1 compact:min-w-[110px]"><span class="text-[11px] text-[#6b7e72]">日志级别</span><ElSelect
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
      <label class="flex flex-col gap-2 w-37.5 min-w-0 [&_.el-select]:w-full tablet:w-32.5 compact:w-32.5 compact:flex-1 compact:min-w-[110px]"><span class="text-[11px] text-[#6b7e72]">来源服务</span><ElSelect
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
      <label class="flex flex-col gap-2 w-37.5 min-w-[220px] [&_.el-select]:w-full flex-1 tablet:w-32.5 compact:w-32.5 compact:flex-1 compact:min-w-[110px] compact:basis-[75%]"><span class="text-[11px] text-[#6b7e72]">关键词</span><ElInput
        v-model="filters.keyword"
        clearable
        placeholder="搜索日志内容或追踪编号"
      ><template #prefix><AppIcon
        name="search"
        :size="16"
      /></template></ElInput></label><ElButton
        class="[&>span]:gap-1.75"
        @click="reset"
      >
        重置
      </ElButton>
    </div>
    <ElTable
      :data="visible"
      row-key="id"
      empty-text="没有匹配的日志，请调整筛选条件"
      class="[--el-table-header-bg-color:#fafcfb] [--el-table-border-color:#eef2ef] [--el-table-row-hover-bg-color:#f6faf7] [--el-table-header-text-color:#7c8c81] [--el-table-text-color:#4d6055] [&_th.el-table\_\_cell]:h-11.25 [&_th.el-table\_\_cell]:text-[11px] [&_th.el-table\_\_cell]:font-medium [&_td.el-table\_\_cell]:h-18.25 [&_td.el-table\_\_cell]:text-[12px] [&_.cell]:pl-5 [&_.cell]:pr-3 [&_.el-tag]:text-[10px] [&_.el-tag]:h-5.5 [&_.el-tag]:border-[transparent] [&_.el-tag]:rounded-[4px] [&_.el-button]:text-[11px] wide:[&_td.el-table\_\_cell]:h-20"
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
          <div>
            <strong class="block font-medium text-[#3e5547]">{{ row.summary }}</strong><small class="block text-[#94a198] text-[10px] font-['Segoe_UI',_sans-serif] mt-0.75">{{ row.traceId }}</small>
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
            class="[&>span]:gap-1.75"
            link
            type="primary"
            @click="detail = row as LogEntry"
          >
            详情
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="flex justify-between items-center gap-3 compact:flex-wrap px-5.5 py-4.25 compact:p-3.5">
      <span class="text-[11px] text-[#8d9b92]">共 {{ filtered.length }} 条记录 · 每页 6 条</span><ElPagination
        v-model:current-page="page"
        class="[--el-pagination-button-width:28px] [--el-pagination-button-height:28px] [--el-pagination-font-size:11px]"
        :total="filtered.length"
        :page-size="6"
        layout="prev, pager, next"
        background
      />
    </div>
  </section>
  <div class="flex gap-1.75 items-start text-[10px] text-[#94a197] leading-[1.6] mt-4.25">
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
