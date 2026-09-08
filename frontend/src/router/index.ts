import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', redirect: '/meters' },
    { path: '/meters', name: 'meters', component: () => import('../views/meter-assets/index.vue'), meta: { title: '电表档案' } },
    { path: '/demand-read', name: 'demand-read', component: () => import('../views/demand-read/index.vue'), meta: { title: '随时抄表' } },
    { path: '/logs', name: 'logs', component: () => import('../views/system-logs/index.vue'), meta: { title: '系统日志' } },
    { path: '/:pathMatch(.*)*', redirect: '/meters' },
  ],
})
