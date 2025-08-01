# Project Log: Web Agent Swarm

---

### **长期工作指令 (First Principle)**

**在开始任何开发任务前，必须先更新相关文档（如`docs/Architectural_Overview.md`）和本工作日志（`GEMINI_LOG.md`），以确保项目状态和决策的可追溯性。**

---

### **架构决策：向多能力平台演进 (2025-07-31)**

*   **核心洞察**: 为了将项目从单一用途的工具提升为真正的智能平台，我们需要支持多种不同类型的任务和能力。

*   **架构升级决策**: 我们将扩展系统，在现有的“网页自动化”能力之外，新增一个并行的“**Canvas绘图**”能力。

*   **新架构蓝图**:
    1.  **前端UI**: 创建一个新的`frontend/src/components/DrawingCanvas.tsx`组件，并将其集成到主页面。
    2.  **新智能体 (Drawing Expert)**: 创建一个新的`frontend/src/prompts/drawing_prompt.txt`，引导LLM将自然语言的绘画描述，转换为结构化的JSON绘图指令。
    3.  **Manager Agent升级 (任务调度总管)**: 升级`frontend/src/prompts/manager_prompt.txt`，使其能够首先判断用户任务的类型（网页自动化 vs. 绘图），然后调用相应的专家智能体，并返回一个带有`taskType`标识的结构化JSON。
    4.  **新后端服务**: 在`backend/server.js`中添加一个新的`/draw`端点，用于验证和传递绘图指令。
    5.  **前端调度逻辑**: 重构`frontend/src/App.tsx`的`handleSubmit`函数，使其能够根据`taskType`，将任务分发给不同的执行逻辑。

### **架构颠覆性升级：赋予智能体真正的“创造力” (2025-07-31)**

*   **核心洞察**: “JSON指令集”模式极大地限制了LLM的创造力，无法完成如“画一个钟表”这样的复杂任务。
*   **架构升级决策**: 将“绘画”能力与“网页自动化”能力在架构上统一，都采用**“动态代码生成与安全执行”**模型。
*   **实施细节**:
    1.  **`frontend/src/prompts/drawing_prompt.txt`** 被彻底重写，现在它会指导LLM直接生成使用原生Canvas 2D API的、可执行的JavaScript代码。
    2.  **`frontend/src/components/DrawingCanvas.tsx`** 被升级，使其能够接收并安全地执行（通过`new Function('ctx', code)`沙箱）LLM生成的绘图代码。
    3.  **`frontend/src/App.tsx`** 的调度逻辑被简化和统一，现在它能一致地处理由不同专家生成的代码。
    4.  **错误处理增强**: 实现了从前端Canvas到后端日志的错误上报机制。
    5.  **代码提取逻辑修复**: 修正了`runLLM`函数中的正则表达式，使其能更健壮地从LLM的响应中提取代码块。

### **UI/UX优化 (2025-07-31)**

*   **核心决策**: 移除冗余的“Results”面板，将所有信息流统一到“Logs”面板，并对整体布局进行现代化和自适应改造。
*   **实施细节**:
    1.  **`frontend/src/App.css`** 被重写，引入了Flexbox和Grid布局，并应用了全局的`box-sizing: border-box`规则，以实现完美的对齐和自适应效果。
    2.  **`frontend/src/App.tsx`** 的JSX结构和逻辑被更新，以匹配新的CSS，并实现了更具情境感的动态启动日志。

### **版本控制与文档本地化 (2025-07-31)**

*   **核心决策**: 将项目置于Git版本控制之下，并提供中文文档。
*   **实施细节**:
    1.  初始化了Git仓库，并创建了`.gitignore`文件。
    2.  创建了全新的中文版`README.md`和`docs/Architectural_Overview.md`。
    3.  删除了过时的`docs/Preliminary_Plan.md`。
    4.  所有更改都已提交并推送到远程GitHub仓库。
