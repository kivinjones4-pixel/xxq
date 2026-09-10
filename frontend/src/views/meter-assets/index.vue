<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElInput, ElSelect, ElOption, ElButton, ElTable, ElTableColumn, ElTag, ElPagination, ElPopconfirm, ElDialog, ElAlert, ElMessage } from 'element-plus'
import AppIcon from '../../components/AppIcon.vue'
import StatCard from '../../components/StatCard.vue'
import MeterFormDialog from './components/MeterFormDialog.vue'
import { useDemoStore } from '../../stores/demo'
import type { Meter } from '../../types/meter'
import type { MeterDraft, MeterFilters } from './types'
import { filterMeters, validateMeter } from './model'
import { downloadCsv } from '../../utils/csv'
defineOptions({ name: 'MeterAssetsView' })
const store = useDemoStore()
const filters = reactive<MeterFilters>({ keyword: '', type: '', status: '' })
const page = ref(1)
const filtered = computed(() => filterMeters(store.meters, filters))
const visible = computed(() => filtered.value.slice((page.value - 1) * 6, page.value * 6))
watch(filters, () => { page.value = 1 })
watch(() => filtered.value.length, (length) => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / 6))) })
const formOpen = ref(false)
const current = ref<Meter>()
const readonly = ref(false)
const importOpen = ref(false)
const imported = ref(false)
const sample: MeterDraft = { name: '新增示例 · 配电总表', address: '100000009001', type: '三相电表', status: 1 }
const sampleError = computed(() => validateMeter(sample, store.meters))
function reset() { Object.assign(filters, { keyword: '', type: '', status: '' }) }
function openForm(meter?: Meter, detail = false) { current.value = meter; readonly.value = detail; formOpen.value = true }
function save(draft: MeterDraft) {
  const error = validateMeter(draft, store.meters, current.value?.id)
  if (error) { ElMessage.error(error); return }
  if (current.value) Object.assign(current.value, draft, { updatedAt: '本次会话更新' })
  else store.meters.unshift({ ...draft, id: crypto.randomUUID(), online: false, updatedAt: '本次会话新增' })
  formOpen.value = false
  reset()
  ElMessage.success('演示档案已保存')
}
function remove(id: string) { store.meters = store.meters.filter((meter) => meter.id !== id); ElMessage.success('演示档案已删除') }
function exportMeters() {
  downloadCsv('电表档案-演示.csv', [['表号', '电表名称', '类型', '启用状态', '连接状态'], ...filtered.value.map((meter) => [meter.address, meter.name, meter.type, meter.status ? '启用' : '禁用', meter.online ? '在线' : '离线'])])
  ElMessage.success(`已导出 ${filtered.value.length} 条匹配的演示档案`)
}
function importSample() {
  if (sampleError.value) return
  store.meters.unshift({ ...sample, id: crypto.randomUUID(), online: false, updatedAt: '本次会话导入' })
  imported.value = true
  reset()
}
</script>

<template>
  <div class="flex items-center justify-between gap-5 compact:items-start mb-6.5">
    <div>
      <div class="text-[#82948b] text-[9px] tracking-[1.7px] font-semibold mb-2.25">
        ASSET MANAGEMENT
      </div><h1 class="text-[27px] tracking-[-.5px] font-[650] text-[#1b342a] compact:text-[23px] mb-2.25">
        电表档案
      </h1><p class="text-[12px] text-[#809088] leading-[1.6] compact:text-[11px]">
        统一管理电表资产，掌握每一台设备的基本信息。
      </p>
    </div><ElButton
      class="[&>span]:gap-1.75"
      type="primary"
      size="large"
      @click="openForm()"
    >
      <AppIcon
        name="plus"
        :size="17"
      />新增电表
    </ElButton>
  </div>
  <div class="grid grid-cols-4 gap-4 compact:grid-cols-2 compact:gap-2.5 mb-6.5">
    <StatCard
      label="电表总数"
      :value="store.meters.length"
      note="当前工作区的演示档案"
      icon="meter"
    />
    <StatCard
      label="在线电表"
      :value="store.meters.filter(m => m.online).length"
      note="连接状态独立于启用状态"
      icon="signal"
    />
    <StatCard
      label="离线电表"
      :value="store.meters.filter(m => !m.online).length"
      note="演示连接状态 · 未连接后端"
      icon="clock"
      tone="amber"
    />
    <StatCard
      label="已启用"
      :value="store.meters.filter(m => m.status === 1).length"
      note="可在随时抄表中选择"
      icon="check"
      tone="blue"
    />
  </div>
  <section class="bg-white border border-solid border-[#e3eae6] rounded-[9px] overflow-hidden min-w-0">
    <div class="flex justify-between items-center gap-4 compact:flex-wrap px-6 pt-5.75 pb-5 compact:px-4 compact:py-4.5">
      <div>
        <h2 class="flex items-center gap-2.5 text-[15px] font-semibold">
          档案列表 <span class="text-[10px] font-medium bg-[#f0f4f1] text-[#708277] rounded-[5px] px-1.75 py-0.5">{{ filtered.length }}</span>
        </h2><p class="text-[#97a39d] text-[10px] mt-1.75">
          查看、维护和导出演示电表档案
        </p>
      </div><div>
        <ElButton
          class="[&>span]:gap-1.75"
          @click="importOpen = true; imported = false"
        >
          <AppIcon
            name="upload"
            :size="16"
          />导入预览
        </ElButton><ElButton
          class="[&>span]:gap-1.75"
          :disabled="!filtered.length"
          @click="exportMeters"
        >
          <AppIcon
            name="download"
            :size="16"
          />导出 CSV
        </ElButton>
      </div>
    </div>
    <div class="bg-[#fcfdfc] border-t border-solid border-t-[#f0f3f1] border-b border-b-[#edf1ee] flex items-end gap-3.5 [&_.el-input]:w-full compact:flex-wrap px-6 py-4.75 compact:p-4">
      <label class="flex flex-col gap-2 w-37.5 min-w-0 flex-1 max-w-[350px] [&_.el-select]:w-full tablet:w-32.5 compact:w-full compact:flex-1 compact:max-w-[none] compact:min-w-[110px] compact:basis-full"><span class="text-[11px] text-[#6b7e72]">电表名称 / 表号</span><ElInput
        v-model="filters.keyword"
        clearable
        placeholder="搜索电表名称或表号"
      ><template #prefix><AppIcon
        name="search"
        :size="16"
      /></template></ElInput></label>
      <label class="flex flex-col gap-2 w-37.5 min-w-0 [&_.el-select]:w-full tablet:w-32.5 compact:w-32.5 compact:flex-1 compact:min-w-[110px]"><span class="text-[11px] text-[#6b7e72]">电表类型</span><ElSelect
        v-model="filters.type"
        aria-label="电表类型筛选"
      ><ElOption
        label="全部类型"
        value=""
      /><ElOption
        label="三相电表"
        value="三相电表"
      /><ElOption
        label="单相电表"
        value="单相电表"
      /></ElSelect></label>
      <label class="flex flex-col gap-2 w-37.5 min-w-0 [&_.el-select]:w-full tablet:w-32.5 compact:w-32.5 compact:flex-1 compact:min-w-[110px]"><span class="text-[11px] text-[#6b7e72]">启用状态</span><ElSelect
        v-model="filters.status"
        aria-label="启用状态筛选"
      ><ElOption
        label="全部状态"
        value=""
      /><ElOption
        label="启用"
        :value="1"
      /><ElOption
        label="禁用"
        :value="0"
      /></ElSelect></label>
      <ElButton
        class="[&>span]:gap-1.75"
        @click="reset"
      >
        重置
      </ElButton>
    </div>
    <ElTable
      :data="visible"
      row-key="id"
      empty-text="没有匹配的电表，请调整筛选条件"
      class="[--el-table-header-bg-color:#fafcfb] [--el-table-border-color:#eef2ef] [--el-table-row-hover-bg-color:#f6faf7] [--el-table-header-text-color:#7c8c81] [--el-table-text-color:#4d6055] [&_th.el-table\_\_cell]:h-11.25 [&_th.el-table\_\_cell]:text-[11px] [&_th.el-table\_\_cell]:font-medium [&_td.el-table\_\_cell]:h-18.25 [&_td.el-table\_\_cell]:text-[12px] [&_.cell]:pl-5 [&_.cell]:pr-3 [&_.el-tag]:text-[10px] [&_.el-tag]:h-5.5 [&_.el-tag]:border-[transparent] [&_.el-tag]:rounded-[4px] [&_.el-button]:text-[11px] wide:[&_td.el-table\_\_cell]:h-20"
    >
      <ElTableColumn
        label="电表名称"
        min-width="210"
      >
        <template #default="{ row }">
          <div class="flex items-center gap-2.5">
            <span class="bg-[#f1f5f2] text-[#83a493] w-7.75 h-9 grid place-items-center rounded-[5px] shrink-0"><AppIcon
              name="meter"
              :size="18"
            /></span><div><strong class="block font-medium text-[#3e5547]">{{ row.name }}</strong><small class="block text-[#94a198] text-[10px] font-['Segoe_UI',_sans-serif] mt-0.75">{{ row.address }}</small></div>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn
        prop="type"
        label="电表类型"
        min-width="115"
      />
      <ElTableColumn
        label="通信协议"
        min-width="135"
      >
        <span class="text-[#93a099] text-[11px]">DLMS/COSEM</span>
      </ElTableColumn>
      <ElTableColumn
        label="启用状态"
        min-width="105"
      >
        <template #default="{ row }">
          <ElTag
            :type="row.status ? 'success' : 'info'"
            effect="light"
          >
            {{ row.status ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="连接状态"
        min-width="105"
      >
        <template #default="{ row }">
          <span
            class="text-[11px] text-[#508967] whitespace-nowrap inline-flex items-center gap-1.5 data-[offline=true]:text-[#9ca69f] data-[offline=true]:[&>i]:bg-[#b7bfb9]"
            :data-offline="!row.online"
          ><i class="inline-block w-1.25 h-1.25 bg-[#59a77b] rounded-full" />{{ row.online ? '在线' : '离线' }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="操作"
        width="175"
        fixed="right"
      >
        <template #default="{ row }">
          <ElButton
            class="[&>span]:gap-1.75"
            link
            type="primary"
            @click="openForm(row as Meter, true)"
          >
            详情
          </ElButton><ElButton
            class="[&>span]:gap-1.75"
            link
            type="primary"
            @click="openForm(row as Meter)"
          >
            编辑
          </ElButton><ElPopconfirm
            title="删除这条演示档案？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="remove(row.id)"
          >
            <template #reference>
              <ElButton
                class="[&>span]:gap-1.75"
                link
                type="danger"
              >
                删除
              </ElButton>
            </template>
          </ElPopconfirm>
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
    />启用状态决定是否参与采集；在线 / 离线表示连接状态，两者独立。
  </div>
  <MeterFormDialog
    :open="formOpen"
    :meter="current"
    :meters="store.meters"
    :readonly="readonly"
    @close="formOpen = false"
    @save="save"
  />
  <ElDialog
    v-model="importOpen"
    title="导入校验预览"
    width="620px"
    class="max-w-[calc(100vw_-_32px)]"
  >
    <ElAlert
      title="固定样例预览，不会读取或上传本地文件。正式导入将在接口联调时接入。"
      type="info"
      :closable="false"
    />
    <div
      v-if="imported"
      class="flex gap-2.5 text-[#16846b] px-0 py-4.5"
    >
      <AppIcon name="check" />已导入 1 条演示档案，2 条无效行未导入。
    </div>
    <ElTable
      :data="[{ line: 2, name: sample.name, result: imported ? '已导入' : sampleError || '校验通过' }, { line: 3, name: '重复表号示例', result: '表号重复，无法导入' }, { line: 4, name: '缺少表号示例', result: '缺少必填表号' }]"
      class="mt-4"
    >
      <ElTableColumn
        prop="line"
        label="行号"
        width="65"
      /><ElTableColumn
        prop="name"
        label="电表名称"
      /><ElTableColumn
        prop="result"
        label="校验结果"
        min-width="190"
      />
    </ElTable>
    <template #footer>
      <ElButton
        class="[&>span]:gap-1.75"
        @click="importOpen = false"
      >
        关闭
      </ElButton><ElButton
        class="[&>span]:gap-1.75"
        type="primary"
        :disabled="imported || !!sampleError"
        @click="importSample"
      >
        导入 1 条有效样例
      </ElButton>
    </template>
  </ElDialog>
</template>
