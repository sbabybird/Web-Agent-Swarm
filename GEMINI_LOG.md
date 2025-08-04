# Project Log: Web Agent Swarm

---

### **核心原则 (First Principles)**

1.  **文档优先**: 在开始任何重大的开发或重构任务前，必须先更新相关文档 (`README.md`, `docs/Architectural_Overview.md`) 和本工作日志。
2.  **中文优先**: 所有面向用户的界面，都必须以中文为第一优先语言，并支持 i18n。

---

### **当前架构状态 (As of 2025-07-31)**

经过多次迭代和重构，项目当前采用了一个**返璞归真的、单轮执行的“专家”模型**。这个架构被证明是完成单一领域、创造性任务（如“画布绘图”）的最健壮、最可靠的方案。

*   **核心理念**: “Manager 分类 -> Expert 生成 -> Executor 执行”。

*   **工作流程**:
    1.  **Manager Agent**: 接收用户的自然语言目标，并将其分类到一个预定义的、高级的 `taskType` (目前仅支持 `drawing`)。
    2.  **Expert Agent**: 根据 `taskType` 和用户的原始目标，一次性地生成一个完整的、自包含的、可执行的 JavaScript 代码块。
    3.  **Executor**: 前端的相应组件（如 `DrawingCanvas.tsx`）接收并安全地执行这段代码。

*   **关键组件**:
    *   **`frontend/src/prompts/manager_prompt.txt`**: 一个简化的、只负责任务分类的“管理者”提示。
    *   **`frontend/src/prompts/drawing_prompt.txt`**: 一个强大的、统一的“通用绘画专家”提示，它包含了多个高质量的示例（如画时钟、画棋盘），以指导 LLM 生成复杂、完整的绘图代码。
    *   **`frontend/src/App.tsx`**: 移除了所有“会话式执行循环”的复杂逻辑，回归到一个简单、清晰的三步执行流程。
    *   **`frontend/src/components/DrawingCanvas.tsx`**: 一个纯粹的“渲染引擎”，它接收一个完整的代码字符串，并在一个安全的沙箱中执行它。

*   **项目状态**: 当前架构稳定、可靠，能够高质量地完成复杂的单轮绘图任务。所有与浏览器自动化、多轮迭代相关的代码和配置，都已被暂时移除，以降低复杂性并聚焦于核心能力。