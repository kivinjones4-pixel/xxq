# 版本与兼容依据

2026-09-08 实现前通过官方 npm registry 的 `npm view <包> version engines peerDependencies --json` 查询。

| 依赖 | 精确版本 |
| --- | --- |
| Node / npm | 24.10.0 / 11.6.1（本机实际版本） |
| vue | 3.5.42 |
| vite / @vitejs/plugin-vue | 8.2.2 / 6.0.8 |
| element-plus | 2.14.5 |
| tailwindcss / @tailwindcss/vite | 4.3.3 / 4.3.3 |
| pinia / vue-router | 4.0.3 / 5.3.1 |
| axios | 1.20.0 |
| typescript / vue-tsc | 5.9.3 / 3.3.11 |
| eslint / @eslint/js | 10.10.0 / 10.0.1 |
| eslint-plugin-vue / typescript-eslint | 10.11.0 / 8.70.0 |
| @types/node | 24.13.3 |

Vite/plugin-vue 要求 Node ^20.19.0 或 >=22.12.0；ESLint 10 支持 Node >=24。工程限定 Node 24.10+ 的 24.x，并以 .node-version 固定本机版本。Vue 满足 Element Plus ^3.3.7、Pinia ^3.5.11、Router ^3.5.34 的 peer 要求；Tailwind Vite 插件支持 Vite 8。typescript-eslint 要求 TypeScript >=4.8.4 <6.1.0，因此未选 registry 最新 TypeScript 7.0.2。

官方配置依据：[Vite](https://vite.dev/guide/)、[Tailwind Vite 安装](https://tailwindcss.com/docs/installation/using-vite)。安装时由 npm 校验 peer 依赖；实际构建结果另记 spec。

原文 docs/03 §1.1、docs/09 §2.1 列 Node 16/18，与用户 AGENTS.md 当前 Node 24.10.0 不同；遵循用户当前约定，此工程不承诺 Node 16/18 兼容。后端 Java 8 不受影响。
