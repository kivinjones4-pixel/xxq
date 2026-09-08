---
name: hes-spec-workflow
description: 当需要依据 HES HTML 文档整理或维护项目级需求基线时，创建或更新 proposal、design、task、spec，追踪来源冲突与业务规则。功能或迭代级可执行规范由 spec-auto-update 技能处理。
---

# HES 规范维护

从当前仓库根目录定位 `AGENTS.md`、`docs/` 和 `specs/`。优先读 `AGENTS.md` 与 `specs/reference.md`；按本次需求只读受影响的原文和规范。

本技能维护项目背景基线；当请求聚焦一个功能/迭代时，读取 [spec 自动更新与生成](../spec-auto-update/SKILL.md)，在独立编号目录维护可执行规范，避免覆盖项目总览。

## 工作步骤

1. 用 `scripts/extract_html.py` 提取所需 HTML 可见文本，保留原文件路径和章节作为出处。该脚本只输出文本，不执行 HTML 中脚本。
2. 按 `00 > 01 > 02 > 其他` 处理原文冲突；未定义合同记入 `specs/reference.md`，区分“原文要求”“设计补充”“待定”。
3. 在 proposal 说明 Why、What Changes 与范围；在 design 说明上下文、决策、取舍和风险；在 specs 用稳定需求 ID 和 Given/When/Then 定义行为；在 task 用未勾选任务连接实现、依赖、需求和验证。
4. 对照来源确认六模块、TCP 角色、LLS、3/9 分钟心跳、同表串行/跨表并行、数据项复合唯一性、文件日志等约束未丢失。
5. 行为变化同时更新相关四类文档。仅完成文档时不勾选开发任务；引用现有路径，不编造 API、字段、构建结果或标准兼容结论。

## 使用脚本

在仓库根目录运行（Python 3，仅标准库）：

```powershell
python skills/hes-spec-workflow/scripts/extract_html.py docs/05-API接口规范.html
python skills/hes-spec-workflow/scripts/extract_html.py docs
```

输出可较长，优先传单个文件。详细来源与未定合同见 [项目参考](../../specs/reference.md)；验收相关工作可读取 [验收技能](../hes-integration-review/SKILL.md)。

## 完成检查

检查 Markdown 链接、需求 ID 对应任务、原文引用、任务状态和技能 frontmatter；`SKILL.md` 保持 500 行以内。文档流程借鉴 OpenSpec 分层，不自动迁移路径或安装 CLI。汇报生成文件、验证结果和仍待明确的关键事项。
