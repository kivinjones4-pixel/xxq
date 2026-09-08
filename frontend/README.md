# HES 前端

环境：Node 24.10.0、npm 11.6.1。

```powershell
cd frontend
npm ci
npm run dev
```

打开 http://127.0.0.1:5173。首次依赖已安装后可直接运行 `npm run dev`。

```powershell
npm run lint
npm run type-check
npm test
npm run build
npm run preview
```

构建输出为 dist/。使用 hash 路由；生产服务器需将 /api 反向代理至 Web BackEnd，开发代理在 vite.config.ts 中指向 localhost:8080。前端配置均公开，不放服务密码。

src/views 为页面，src/router 为路由，src/api/http.ts 提供普通 JSON POST 入口，src/styles 为样式。Pinia 的 demo store 在档案与抄表页面之间共享内存演示档案。

已提供三个交互原型：

- `/#/meters`：电表档案，筛选、分页、新增/编辑/详情/删除、固定样例导入和 CSV 导出。
- `/#/demand-read`：多表多项选择，成功、超时和认证失败的采集结果演示。
- `/#/logs`：时间、级别、服务、关键词筛选，详情和 CSV 导出。

全部使用演示数据，刷新恢复；正式 API、真实导入、日志查询及采集链路尚未接入。导入预览仅导入固定样例，不读取实际文件。

页面必须独立目录，入口为 index.vue。私有组件、类型按需就近放置；跨页面共享组件与类型提升到 src/components/、src/types/。不允许页面 .vue 文件平铺在 views/ 下，详见 [FE-01a](../skills/hes-frontend-cr/references/frontend-cr.md)。

```text
src/views/
  meter-assets/
    index.vue
    model.ts
    components/MeterFormDialog.vue
    types/index.ts
  demand-read/
    index.vue
    model.ts
    components/ResultTable.vue
    types/index.ts
  system-logs/
    index.vue
    model.ts
    components/LogDetailDrawer.vue
    types/index.ts
```

版本见 [初始化规范](../specs/000-frontend-init-feature/spec.md)，原型范围与验证见 [001 原型规范](../specs/001-frontend-prototype/spec.md)。
