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
  <div class="flex items-center justify-between gap-5 compact:items-start mb-6.5">
    <div>
      <div class="text-[#82948b] text-[9px] tracking-[1.7px] font-semibold mb-2.25">
        ON-DEMAND READING
      </div><h1 class="text-[27px] tracking-[-.5px] font-[650] text-[#1b342a] compact:text-[23px] mb-2.25">
        随时抄表
      </h1><p class="text-[12px] text-[#809088] leading-[1.6] compact:text-[11px]">
        选择目标电表与数据项，预览一次即时采集流程。
      </p>
    </div><span class="text-[11px] text-[#6f8d7e] flex gap-1.75 items-center compact:hidden"><AppIcon
      name="bolt"
      :size="17"
    />即时采集 · 演示环境</span>
  </div>
  <div class="flex items-center gap-4.5 text-[11px] text-[#9baaa0] compact:gap-2 compact:text-[10px] mx-0 mt-0 mb-6">
    <span class="flex items-center gap-2 whitespace-nowrap text-[#288566]"><b class="grid place-items-center w-5.75 h-5.75 rounded-full bg-[#d9eee3] text-[9px] font-medium compact:hidden">01</b>选择采集对象</span><i class="w-17.5 h-0.25 bg-[#dce5df] compact:flex-1 compact:min-w-[5px]" /><span class="flex items-center gap-2 whitespace-nowrap"><b class="grid place-items-center w-5.75 h-5.75 rounded-full bg-[#e9eeeb] text-[9px] font-medium compact:hidden">02</b>开始抄读演示</span><i class="w-17.5 h-0.25 bg-[#dce5df] compact:flex-1 compact:min-w-[5px]" /><span class="flex items-center gap-2 whitespace-nowrap"><b class="grid place-items-center w-5.75 h-5.75 rounded-full bg-[#e9eeeb] text-[9px] font-medium compact:hidden">03</b>查看采集结果</span>
  </div>
  <div class="grid grid-cols-2 gap-5 compact:grid-cols-1">
    <section class="bg-white border border-solid border-[#e3eae6] rounded-[9px] overflow-hidden min-w-0 flex flex-col">
      <div class="flex justify-between items-center gap-4 border-b border-solid border-b-[#edf1ee] compact:flex-wrap p-5 compact:px-4 compact:py-4.5">
        <div>
          <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
            选择电表 <span class="text-[10px] font-medium bg-[#f0f4f1] text-[#708277] rounded-[5px] px-1.75 py-0.5">{{ selectedMeters.length }}</span>
          </h2><p class="text-[#97a39d] text-[10px] mt-1.75">
            仅显示已启用电表
          </p>
        </div><ElButton
          class="[&>span]:gap-1.75"
          link
          type="primary"
          :disabled="running"
          @click="selectVisible"
        >
          全选可见
        </ElButton>
      </div>
      <div class="px-4.5 pt-3.25 pb-0">
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
        class="h-76.75 overflow-auto px-4.5 py-2.5"
        aria-label="采集电表"
      >
        <ElCheckbox
          v-for="meter in visibleMeters"
          :key="meter.id"
          :value="meter.id"
          :aria-label="meter.name"
          class="flex items-center gap-2.25 border border-solid border-[transparent] rounded-[6px] min-h-[58px] cursor-pointer hover:bg-[#f7faf8] data-[selected=true]:bg-[#f1f8f4] data-[selected=true]:border-[#d5eadd] w-full h-auto whitespace-normal [&_.el-checkbox\_\_label]:flex [&_.el-checkbox\_\_label]:items-center [&_.el-checkbox\_\_label]:gap-2.25 [&_.el-checkbox\_\_label]:flex-1 [&_.el-checkbox\_\_label]:min-w-0 [&_.el-checkbox\_\_label]:pl-0 px-2.5 py-2.25 mb-1.25 mr-0"
          :data-selected="selectedMeters.includes(meter.id)"
        >
          <span class="flex-1 min-w-0"><strong class="block text-[12px] font-medium">{{ meter.name }}</strong><small class="block text-[9px] text-[#94a298] wrap-anywhere mt-1.25">{{ meter.address }}</small></span><span
            class="text-[11px] text-[#508967] whitespace-nowrap inline-flex items-center gap-1.5 data-[offline=true]:text-[#9ca69f] data-[offline=true]:[&>i]:bg-[#b7bfb9]"
            :data-offline="!meter.online"
          ><i class="inline-block w-1.25 h-1.25 bg-[#59a77b] rounded-full" />{{ meter.online ? '在线' : '离线' }}</span>
        </ElCheckbox>
      </ElCheckboxGroup>
      <p
        v-if="!visibleMeters.length"
        class="text-[12px] text-[#93a298] p-5"
      >
        没有匹配的已启用电表
      </p>
      <div class="border-t border-solid border-t-[#edf1ee] text-[#8b9c90] text-[10px] flex items-center justify-between min-h-[43px] [&_.el-button]:text-[10px] px-5.5 py-3">
        已选 {{ selectedMeters.length }} / {{ availableMeters.length }} 台<ElButton
          class="[&>span]:gap-1.75"
          link
          :disabled="running"
          @click="selectedMeters = []"
        >
          清空选择
        </ElButton>
      </div>
    </section>
    <section class="bg-white border border-solid border-[#e3eae6] rounded-[9px] overflow-hidden min-w-0 flex flex-col">
      <div class="flex justify-between items-center gap-4 border-b border-solid border-b-[#edf1ee] compact:flex-wrap p-5 compact:px-4 compact:py-4.5">
        <div>
          <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
            选择数据项 <span class="text-[10px] font-medium bg-[#f0f4f1] text-[#708277] rounded-[5px] px-1.75 py-0.5">{{ selectedItems.length }}</span>
          </h2><p class="text-[#97a39d] text-[10px] mt-1.75">
            按完整对象标识区分每个采集项
          </p>
        </div><AppIcon name="grid" />
      </div>
      <ElCheckboxGroup
        v-model="selectedItems"
        :disabled="running"
        class="flex-1 px-4.5 py-3.25"
        aria-label="采集数据项"
      >
        <ElCheckbox
          v-for="item in dataItems"
          :key="item.id"
          :value="item.id"
          :aria-label="item.name"
          class="flex items-center gap-2.25 border border-solid border-[transparent] rounded-[6px] min-h-[58px] cursor-pointer hover:bg-[#f7faf8] data-[selected=true]:bg-[#f1f8f4] data-[selected=true]:border-[#d5eadd] w-full h-auto whitespace-normal [&_.el-checkbox\_\_label]:flex [&_.el-checkbox\_\_label]:items-center [&_.el-checkbox\_\_label]:gap-2.25 [&_.el-checkbox\_\_label]:flex-1 [&_.el-checkbox\_\_label]:min-w-0 [&_.el-checkbox\_\_label]:pl-0 px-2.5 py-2.25 mb-1.25 mr-0"
          :data-selected="selectedItems.includes(item.id)"
        >
          <span class="flex-1 min-w-0"><strong class="block text-[12px] font-medium">{{ item.name }}</strong><small class="block text-[9px] text-[#94a298] wrap-anywhere mt-1.25">{{ item.obis }} · 类 {{ item.classId }} / 属性 {{ item.attributeId }}</small></span><span class="text-[10px] text-[#94a499]">{{ item.unit || '结构' }}</span>
        </ElCheckbox>
      </ElCheckboxGroup>
      <div class="border-t border-solid border-t-[#edf1ee] text-[#8b9c90] text-[10px] flex items-center justify-between min-h-[43px] [&_.el-button]:text-[10px] px-5.5 py-3">
        同一 OBIS 的不同属性可分别选择
      </div>
    </section>
  </div>
  <section class="bg-[#eaf3ed] border border-solid border-[#d5e6da] rounded-[7px] flex justify-between items-center gap-4 tablet:flex-wrap compact:flex-wrap px-5.5 py-4.5 mx-0 mt-5 mb-6.5 compact:p-4">
    <div><strong class="text-[14px] font-medium">{{ selectedMeters.length }} 台电表 <span class="text-[#8eaa99] mx-3 my-0">×</span> {{ selectedItems.length }} 个数据项</strong><small class="block text-[10px] text-[#7f9a88] mt-1.75">共 {{ selectedMeters.length * selectedItems.length }} 项结果 · 每表依次推进，不同表同时推进</small></div>
    <div class="flex items-center gap-3.5 compact:flex-wrap compact:w-full compact:[&_.el-button]:flex-1">
      <label class="flex items-center gap-2.25 text-[10px] text-[#7d9285] whitespace-nowrap [&_.el-select]:w-37.5 compact:w-full compact:[&_.el-select]:flex-1"><span>演示场景</span><ElSelect
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
        class="[&>span]:gap-1.75"
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
  <section class="bg-white border border-solid border-[#e3eae6] rounded-[9px] overflow-hidden min-w-0 [&_.el-table\_\_empty-block]:min-h-[150px]">
    <div class="flex justify-between items-center gap-4 compact:flex-wrap px-6 pt-5.75 pb-5 compact:px-4 compact:py-4.5">
      <div>
        <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
          采集结果 <ElTag
            v-if="taskId"
            :type="running ? 'warning' : failures ? 'danger' : 'success'"
          >
            {{ running ? '进行中' : failures ? '完成 · 含失败' : '全部完成' }}
          </ElTag>
        </h2><p class="text-[#97a39d] text-[10px] mt-1.75">
          {{ taskId ? `${taskId} · 开始于 ${startedAt} · 模拟结果` : '开始演示后，采集结果将在这里逐项呈现' }}
        </p>
      </div><div class="flex gap-4.5 text-[#8d9d91] text-[11px]">
        <span>成功 <b class="text-[#2a8d67] ml-1.5">{{ successes }}</b></span><span>失败 <b class="text-[#bd7e6c] ml-1.5">{{ failures }}</b></span>
      </div>
    </div>
    <div
      v-if="results.length"
      class="flex items-center gap-5 text-[11px] text-[#97a79b] [&_.el-progress]:flex-1 px-6 pt-0 pb-4.5"
      aria-live="polite"
    >
      <ElProgress
        :percentage="progress"
        :stroke-width="5"
      /><span>{{ finished }} / {{ results.length }} 项</span>
    </div>
    <ResultTable :results="results" />
  </section>
  <div class="flex gap-1.75 items-start text-[10px] text-[#94a197] leading-[1.6] mt-4.25">
    <AppIcon
      name="info"
      :size="15"
    />此页面模拟结果时间轴，未连接真实采集链路；离开页面会停止本次演示。
  </div>
</template>
