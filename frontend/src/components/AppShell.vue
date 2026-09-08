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
  <div class="app-frame">
    <aside class="sidebar">
      <RouterLink
        class="brand"
        to="/meters"
        aria-label="HES 首页"
      >
        <span class="brand-mark"><AppIcon
          name="bolt"
          :size="26"
        /></span>
        <span><strong>HES<span class="brand-dot">.</span></strong><small>电表信息采集系统</small></span>
      </RouterLink>
      <div class="nav-label">
        工作空间 / WORKSPACE
      </div>
      <nav aria-label="主要模块">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: route.path === item.to }"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <AppIcon
            :name="item.icon"
            :size="21"
          /><span>{{ item.title }}<small>{{ item.caption }}</small></span><span class="nav-dot" />
        </RouterLink>
      </nav>
      <div class="sidebar-bottom">
        <div class="workspace-note">
          <span class="tiny-dot" /> 界面原型工作区
        </div>
        <p>让每一份用电数据<br>清晰可见。</p>
        <div class="sidebar-footer">
          HES CONSOLE <span>v0.1</span>
        </div>
      </div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <div class="breadcrumb">
          工作空间 <span>/</span> <strong>{{ route.meta.title }}</strong>
        </div>
        <div class="topbar-right">
          <span class="prototype-pill">原型模式</span><span class="avatar">演</span><span class="demo-user">演示工作区</span>
        </div>
      </header>
      <div class="prototype-banner">
        <AppIcon
          name="info"
          :size="16"
        /><span>当前使用演示数据，所有操作仅用于界面预览，刷新后恢复初始数据。</span>
      </div>
      <main
        id="main-content"
        class="page-content"
      >
        <slot />
      </main>
      <footer class="workspace-footer">
        <span>HES · Head-end System</span><span>电表档案 / 数据采集 / 运行日志</span>
      </footer>
    </div>
  </div>
</template>
