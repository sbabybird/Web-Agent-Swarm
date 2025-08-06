# Gemini 助手项目速记手册：Web Agent Swarm

本文档为 Gemini 助手提供与 "Web Agent Swarm" 项目相关的核心上下文，旨在实现持久化和高效的协作。

---

## 1. 核心理念

项目是一个基于浏览器的、由大型语言模型（LLM）驱动的多智能体系统。其核心是**“总管/专家”模型**：

-   **总管智能体 (Manager Agent)**: 理解用户的高层级目标。
-   **专家智能体 (Expert Agents)**: 接收总管分配的子任务，并生成特定工具可执行的命令。

---

## 2. 核心架构：关注点分离

架构将 LLM 的推理能力与浏览器的执行能力解耦。

-   **后端 (`/backend`)**:
    -   **技术**: Node.js, Express。
    -   **角色**: 一个**无状态的、轻量级的代理**。
    -   **唯一职责**: 将前端的请求转发给本地 LLM 服务 (`LOCAL_LLM_URL`)，并将 LLM 的响应流式传输回前端。它不包含任何业务逻辑。
    -   **关键文件**: `server.js`。

-   **前端 (`/frontend`)**:
    -   **技术**: React, TypeScript, Vite。
    -   **角色**: **系统的核心**。处理所有用户交互、状态管理和业务逻辑。
    -   **最关键的特点**: **所有“工具”都在前端实现**。例如，`DrawingCanvas.tsx` 直接在浏览器中解释并执行来自 LLM 的绘图命令。
    -   **关键文件**:
        -   `App.tsx`: 应用主入口，负责初始化智能体和UI布局。
        -   `mcp/*`: 包含了智能体（`ManagerAgent`, `CanvasExpertAgent`）和通信总线（`MessageBus`, `broker`）的实现。
        -   `components/DrawingCanvas.tsx`: 一个具体的“工具”实现。

-   **多智能体协作协议 (MCP)**:
    -   **角色**: 一个基于 JSON 的**命令协议**，用于规范 LLM 与前端工具之间的通信。
    -   **工作方式**: 专家智能体生成符合此协议的 JSON 命令，前端工具负责解析和执行。
    -   **关键文档**: `docs/MCP_Schema.md`。

---

## 3. 工作流程

1.  **用户输入**: 用户在 UI 中输入目标 (例如, "画一座房子")。
2.  **总管分析**: `App.tsx` 将目标通过 `MessageBus` 发送给 `ManagerAgent`。LLM 分析后确定需要 `canvas` 专家。
3.  **专家执行**: `ManagerAgent` 将任务派发给 `CanvasExpertAgent`。
4.  **生成命令**: `CanvasExpertAgent` 的 LLM 将目标转换为一系列 MCP JSON 命令。
5.  **前端执行**: `MessageBus` 将这些命令传递给 `DrawingCanvas`。
6.  **渲染**: `DrawingCanvas` 解析命令并调用浏览器 Canvas API 进行绘图，用户立即看到结果。

---

## 4. 关键原则与文档

-   **开发原则**:
    -   **文档优先**: 在进行重大变更前，先更新文档。
    -   **中文优先**: UI 以中文为第一语言。
    -   **日志**: `GEMINI_LOG.md` 记录了重要的决策过程。
-   **核心文档**:
    -   `docs/Architectural_Overview.md`: 架构的权威解释。
    -   `docs/MCP_Schema.md`: MCP 协议定义。
    -   `README.md`: 项目高级概述和设置指南。
