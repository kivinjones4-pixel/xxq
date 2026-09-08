<script setup lang="ts">
import { ElCard, ElTag } from 'element-plus'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/tag/style/css'
</script>

<template>
  <main class="mx-auto max-w-3xl px-6 py-12">
    <h1 class="mb-3 text-3xl font-semibold">
      HES 电表管理系统
    </h1>
    <p class="mb-8 text-slate-600">
      电表档案管理 · 随时抄表 · 系统日志
    </p>
    <ElCard shadow="never">
      <ElTag type="info">
        项目初始化
      </ElTag>
      <h2 class="mt-4 text-xl font-medium">
        前端工程已就绪
      </h2>
      <p class="mt-3 leading-7 text-slate-600">
        当前为工程首页，业务功能尚未实现。后续将在此接入电表档案、随时抄表和系统日志。
      </p>
    </ElCard>
  </main>
</template>
