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

src/views 为页面，src/router 为路由，src/api/http.ts 提供普通 JSON POST 入口，src/styles 为样式。Pinia 已注册，尚无需要跨页面共享的业务状态。按需增加组件和 store，不预建空目录。

目前仅首页与工程基础设施；档案、抄表、日志及后端联调未实现。接口测试采用内存夹具。范围、版本和验收见 [功能规范](../specs/000-frontend-init-feature/spec.md)。
