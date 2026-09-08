<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppShell from './components/AppShell.vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <ElConfigProvider
    :locale="zhCn"
    :empty-values="[null, undefined]"
  >
    <AppShell><RouterView /></AppShell>
  </ElConfigProvider>
</template>
