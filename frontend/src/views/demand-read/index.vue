<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElButton, ElCheckbox, ElCheckboxGroup, ElInput, ElSelect, ElOption, ElProgress, ElTag } from 'element-plus'
import AppIcon from '../../components/AppIcon.vue'
import { useDemoStore } from '../../stores/demo'
import { dataItems, completeResult } from './model'
import type { DemoScenario, ReadResult } from './types'
import ResultTable from './components/ResultTable.vue'
defineOptions({ name: 'DemandReadView' })
const store = useDemoStore()
const selectedMeters = ref<string[]>([])
const selectedItems = ref<string[]>(dataItems.slice(0, 3).map((item) => item.id))
const search = ref('')
const availableMeters = computed(() => store.meters.filter((meter) => meter.status === 1))
const visibleMeters = computed(() => availableMeters.value.filter((meter) => `${meter.name}${meter.address}`.includes(search.value.trim())))
const scenario = ref<DemoScenario>('normal')
const running = ref(false)
const results = ref<ReadResult[]>([])
const taskId = ref('')
const startedAt = ref('')
const finished = computed(() => results.value.filter((row) => row.state === 'success' || row.state === 'failed').length)
const successes = computed(() => results.value.filter((row) => row.state === 'success').length)
const failures = computed(() => results.value.filter((row) => row.state === 'failed').length)
const progress = computed(() => results.value.length ? Math.round(finished.value / results.value.length * 100) : 0)
let timer: ReturnType<typeof setInterval> | undefined
function clearTimer() { if (timer) clearInterval(timer); timer = undefined }
onBeforeUnmount(clearTimer)
function selectVisible() { selectedMeters.value = [...new Set([...selectedMeters.value, ...visibleMeters.value.map((meter) => meter.id)])] }
function start() {
  if (running.value || !selectedMeters.value.length || !selectedItems.value.length) return
  const meters = availableMeters.value.filter((meter) => selectedMeters.value.includes(meter.id))
  if (!meters.length) return
  clearTimer()
  const items = dataItems.filter((item) => selectedItems.value.includes(item.id))
  const activeScenario = scenario.value
  const failedMeterId = meters.at(-1)!.id
  taskId.value = `DEMO-${Date.now().toString().slice(-8)}`
  startedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  results.value = meters.flatMap((meter) => items.map((item, index) => ({
    id: `${meter.id}:${item.id}`, meterId: meter.id, meterName: meter.name, address: meter.address,
    dataItemId: item.id, itemName: item.name, unit: item.unit, value: null,
    state: index === 0 ? 'reading' as const : 'waiting' as const, message: index === 0 ? '正在演示读取…' : '等待前一项完成',
  })))
  running.value = true
  timer = setInterval(() => {
    results.value = results.value.map((row) => row.state === 'reading' ? completeResult(row, activeScenario, failedMeterId) : row)
    for (const meter of meters) {
      const next = results.value.find((row) => row.meterId === meter.id && row.state === 'waiting')
      if (next) { next.state = 'reading'; next.message = '正在演示读取…' }
    }
    if (results.value.every((row) => row.state === 'success' || row.state === 'failed')) { running.value = false; clearTimer() }
  }, 1000)
}
</script>

<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow">
        ON-DEMAND READING
      </div><h1>随时抄表</h1><p>选择目标电表与数据项，预览一次即时采集流程。</p>
    </div><span class="heading-note"><AppIcon
      name="bolt"
      :size="17"
    />即时采集 · 演示环境</span>
  </div>
  <div class="reading-steps">
    <span class="step-current"><b>01</b>选择采集对象</span><i /><span><b>02</b>开始抄读演示</span><i /><span><b>03</b>查看采集结果</span>
  </div>
  <div class="reading-grid">
    <section class="panel selection-panel">
      <div class="panel-title">
        <div><h2>选择电表 <span class="count-badge">{{ selectedMeters.length }}</span></h2><p>仅显示已启用电表</p></div><ElButton
          link
          type="primary"
          :disabled="running"
          @click="selectVisible"
        >
          全选可见
        </ElButton>
      </div>
      <div class="selection-search">
        <ElInput
          v-model="search"
          placeholder="搜索电表名称或表号"
          aria-label="搜索采集电表"
          clearable
        >
          <template #prefix>
            <AppIcon
              name="search"
              :size="16"
            />
          </template>
        </ElInput>
      </div>
      <ElCheckboxGroup
        v-model="selectedMeters"
        :disabled="running"
        class="meter-options"
        aria-label="采集电表"
      >
        <ElCheckbox
          v-for="meter in visibleMeters"
          :key="meter.id"
          :value="meter.id"
          :aria-label="meter.name"
          class="choice-row"
          :class="{ selected: selectedMeters.includes(meter.id) }"
        >
          <span class="choice-content"><strong>{{ meter.name }}</strong><small>{{ meter.address }}</small></span><span
            class="connection"
            :class="{ offline: !meter.online }"
          ><i />{{ meter.online ? '在线' : '离线' }}</span>
        </ElCheckbox>
      </ElCheckboxGroup>
      <p
        v-if="!visibleMeters.length"
        class="empty-message"
      >
        没有匹配的已启用电表
      </p>
      <div class="selection-footer">
        已选 {{ selectedMeters.length }} / {{ availableMeters.length }} 台<ElButton
          link
          :disabled="running"
          @click="selectedMeters = []"
        >
          清空选择
        </ElButton>
      </div>
    </section>
    <section class="panel selection-panel">
      <div class="panel-title">
        <div><h2>选择数据项 <span class="count-badge">{{ selectedItems.length }}</span></h2><p>按完整对象标识区分每个采集项</p></div><AppIcon name="grid" />
      </div>
      <ElCheckboxGroup
        v-model="selectedItems"
        :disabled="running"
        class="item-options"
        aria-label="采集数据项"
      >
        <ElCheckbox
          v-for="item in dataItems"
          :key="item.id"
          :value="item.id"
          :aria-label="item.name"
          class="choice-row"
          :class="{ selected: selectedItems.includes(item.id) }"
        >
          <span class="choice-content"><strong>{{ item.name }}</strong><small>{{ item.obis }} · 类 {{ item.classId }} / 属性 {{ item.attributeId }}</small></span><span class="unit-chip">{{ item.unit || '结构' }}</span>
        </ElCheckbox>
      </ElCheckboxGroup>
      <div class="selection-footer">
        同一 OBIS 的不同属性可分别选择
      </div>
    </section>
  </div>
  <section class="run-bar">
    <div><strong>{{ selectedMeters.length }} 台电表 <span>×</span> {{ selectedItems.length }} 个数据项</strong><small>共 {{ selectedMeters.length * selectedItems.length }} 项结果 · 每表依次推进，不同表同时推进</small></div>
    <div class="run-actions">
      <label class="scenario-select"><span>演示场景</span><ElSelect
        v-model="scenario"
        :disabled="running"
        aria-label="演示场景"
      ><ElOption
        value="normal"
        label="全部成功"
      /><ElOption
        value="timeout"
        label="末台电表超时"
      /><ElOption
        value="auth"
        label="末台认证失败"
      /></ElSelect></label><ElButton
        type="primary"
        size="large"
        :loading="running"
        :disabled="!selectedMeters.length || !selectedItems.length"
        @click="start"
      >
        <AppIcon
          v-if="!running"
          name="bolt"
          :size="17"
        />{{ running ? '抄读演示中' : '开始抄读演示' }}
      </ElButton>
    </div>
  </section>
  <section class="panel results-panel">
    <div class="panel-title">
      <div>
        <h2>
          采集结果 <ElTag
            v-if="taskId"
            :type="running ? 'warning' : failures ? 'danger' : 'success'"
          >
            {{ running ? '进行中' : failures ? '完成 · 含失败' : '全部完成' }}
          </ElTag>
        </h2><p>{{ taskId ? `${taskId} · 开始于 ${startedAt} · 模拟结果` : '开始演示后，采集结果将在这里逐项呈现' }}</p>
      </div><div class="result-counts">
        <span>成功 <b>{{ successes }}</b></span><span>失败 <b class="danger-text">{{ failures }}</b></span>
      </div>
    </div>
    <div
      v-if="results.length"
      class="progress-strip"
      aria-live="polite"
    >
      <ElProgress
        :percentage="progress"
        :stroke-width="5"
      /><span>{{ finished }} / {{ results.length }} 项</span>
    </div>
    <ResultTable :results="results" />
  </section>
  <div class="footnote">
    <AppIcon
      name="info"
      :size="15"
    />此页面模拟结果时间轴，未连接真实采集链路；离开页面会停止本次演示。
  </div>
</template>
