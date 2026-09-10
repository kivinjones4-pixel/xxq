<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElSwitch, ElButton, ElAlert } from 'element-plus'
import type { Meter } from '../../../types/meter'
import type { MeterDraft } from '../types'
import { validateMeter } from '../model'
const props = defineProps<{ open: boolean; meter?: Meter; meters: Meter[]; readonly?: boolean }>()
const emit = defineEmits<{ close: []; save: [draft: MeterDraft] }>()
const draft = reactive<MeterDraft>({ name: '', address: '', type: '三相电表', status: 1 })
const error = ref('')
watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(draft, props.meter ? { name: props.meter.name, address: props.meter.address, type: props.meter.type, status: props.meter.status } : { name: '', address: '', type: '三相电表', status: 1 })
  error.value = ''
})
function save() {
  error.value = validateMeter(draft, props.meters, props.meter?.id)
  if (!error.value) emit('save', { ...draft, name: draft.name.trim(), address: draft.address.trim() })
}
</script>

<template>
  <ElDialog
    :model-value="open"
    :title="readonly ? '电表详情' : meter ? '编辑电表' : '新增电表'"
    width="520px"
    class="max-w-[calc(100vw_-_32px)]"
    @close="emit('close')"
  >
    <p class="text-[#8a9a8f] text-[12px] leading-[1.8] mb-5">
      演示档案 · 仅保存在当前浏览器会话中
    </p>
    <ElAlert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      class="mb-4"
    />
    <ElForm
      label-position="top"
      :disabled="readonly"
      @submit.prevent="save"
    >
      <ElFormItem
        label="电表名称"
        required
      >
        <ElInput
          v-model="draft.name"
          placeholder="例如：一号厂房 · 总表"
          maxlength="100"
        />
      </ElFormItem>
      <ElFormItem
        label="电表地址（表号）"
        required
      >
        <ElInput
          v-model="draft.address"
          placeholder="请输入唯一表号"
          maxlength="50"
        />
      </ElFormItem>
      <ElFormItem label="电表类型">
        <ElSelect
          v-model="draft.type"
          class="w-full"
        >
          <ElOption
            label="三相电表"
            value="三相电表"
          /><ElOption
            label="单相电表"
            value="单相电表"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="启用状态">
        <ElSwitch
          v-model="draft.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </ElFormItem>
    </ElForm>
    <div
      v-if="readonly && meter"
      class="bg-[#f6f8f6] rounded-[5px] text-[12px] leading-[2] text-[#738779] p-4"
    >
      通信方式：TCP/IP · 协议：DLMS/COSEM<br>连接状态：{{ meter.online ? '在线' : '离线' }}（演示）<br>更新于：{{ meter.updatedAt }}
    </div>
    <template #footer>
      <ElButton
        class="[&>span]:gap-1.75"
        @click="emit('close')"
      >
        {{ readonly ? '关闭' : '取消' }}
      </ElButton><ElButton
        v-if="!readonly"
        class="[&>span]:gap-1.75"
        type="primary"
        @click="save"
      >
        保存演示档案
      </ElButton>
    </template>
  </ElDialog>
</template>
