<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
const route = useRoute()
const navigation = [
  { to: '/meters', title: '电表档案', icon: 'meter', caption: '资产与设备管理' },
  { to: '/demand-read', title: '随时抄表', icon: 'bolt', caption: '即时数据采集' },
  { to: '/logs', title: '系统日志', icon: 'log', caption: '运行记录与追踪' },
]
</script>

<template>
  <div class="flex min-h-screen compact:block">
    <aside class="w-56 shrink-0 bg-[#102f28] text-[#c4d4ce] flex flex-col fixed top-0 right-auto bottom-0 left-0 z-20 tablet:w-47.5 compact:w-full compact:static compact:block px-4.5 pt-7.75 pb-5 tablet:px-3 compact:p-4">
      <RouterLink
        class="flex gap-3 items-center text-white px-2.5 py-0 compact:p-0"
        to="/meters"
        aria-label="HES 首页"
      >
        <span class="w-10 h-11.25 grid place-items-center bg-[#225246] border border-solid border-[#41665b] rounded-[12px] text-[#a7ebc8] compact:w-8 compact:h-9"><AppIcon
          name="bolt"
          :size="26"
        /></span>
        <span><strong class="text-[29px] tracking-[1px] leading-none compact:text-[24px]">HES<span class="text-[#8cd8ae]">.</span></strong><small class="block text-[10px] text-[#9db6ac] tracking-[1px] compact:hidden mt-1.5">电表信息采集系统</small></span>
      </RouterLink>
      <div class="text-[9px] tracking-[1.4px] text-[#809e91] compact:hidden mx-3 mt-12.25 mb-4.25">
        工作空间 / WORKSPACE
      </div>
      <nav
        class="compact:flex compact:gap-2 compact:mt-4"
        aria-label="主要模块"
      >
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3.25 rounded-[7px] text-[#b1c4bb] text-[14px] transition-colors duration-150 hover:bg-[#1e4238] aria-[current=page]:text-[#d4f6df] aria-[current=page]:bg-[#285444] compact:flex-1 compact:justify-center compact:text-[12px] compact:gap-1.75 px-3.5 py-3.75 mb-2.25 compact:px-2 compact:py-2.5 compact:m-0"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <AppIcon
            :name="item.icon"
            :size="21"
          /><span>{{ item.title }}<small class="block text-[10px] opacity-[.62] compact:hidden mt-1.25">{{ item.caption }}</small></span><span
            :data-active="route.path === item.to"
            class="w-1.25 h-1.25 rounded-full data-[active=true]:bg-[#a5dfbd] compact:hidden ml-auto"
          />
        </RouterLink>
      </nav>
      <div class="compact:hidden mt-auto px-3 pt-10 pb-0">
        <div class="border border-solid border-[#345448] text-[11px] rounded-[6px] text-[#abc8b9] px-2 py-2.5">
          <span class="inline-block w-1.25 h-1.25 bg-[#8eb5a1] rounded-full mr-1.75" /> 界面原型工作区
        </div>
        <p class="text-[#739485] text-[12px] leading-[1.9] mx-0 mt-5.75 mb-7.5">
          让每一份用电数据<br>清晰可见。
        </p>
        <div class="border-t border-solid border-t-[#2b493c] text-[9px] tracking-[1px] flex justify-between text-[#739485] pt-4.25">
          HES CONSOLE <span>v0.1</span>
        </div>
      </div>
    </aside>
    <div class="min-w-0 flex-1 flex flex-col ml-56 tablet:ml-47.5 compact:m-0">
      <header class="h-18 bg-white border-b border-solid border-b-[#e6ece8] flex items-center justify-between compact:h-13 px-9 py-0 compact:px-5">
        <div class="text-[12px] text-[#95a19b] flex items-center gap-3.5">
          工作空间 <span>/</span> <strong class="text-[#4c6157] font-medium">{{ route.meta.title }}</strong>
        </div>
        <div class="flex gap-3 items-center text-[11px] text-[#617468]">
          <span class="text-[10px] bg-[#f5f1e6] text-[#897443] border border-solid border-[#e8dfc9] rounded-[4px] px-2 py-1 mr-2.25">原型模式</span><span class="bg-[#e4eeea] w-7 h-7 grid place-items-center rounded-full text-[#557564]">演</span><span class="compact:hidden">演示工作区</span>
        </div>
      </header>
      <div class="bg-[#f0f4f1] text-[#6f8174] text-[11px] flex items-center gap-2 border-b border-solid border-b-[#e4eae5] compact:items-start compact:leading-[1.6] px-9 py-2.5 compact:px-5 compact:py-2.5">
        <AppIcon
          name="info"
          :size="16"
        /><span>当前使用演示数据，所有操作仅用于界面预览，刷新后恢复初始数据。</span>
      </div>
      <main
        id="main-content"
        class="max-w-[1660px] w-full flex-1 px-9 pt-7.75 pb-6 mx-auto my-0 tablet:px-6 compact:px-4 compact:py-6"
      >
        <slot />
      </main>
      <footer class="flex justify-between gap-4 text-[#a3afa7] text-[9px] tracking-[.4px] px-9 pt-4 pb-5.5 compact:px-4 compact:py-3">
        <span class="compact:last:hidden">HES · Head-end System</span><span class="compact:last:hidden">电表档案 / 数据采集 / 运行日志</span>
      </footer>
    </div>
  </div>
</template>
