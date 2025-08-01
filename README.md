# Web Agent Swarm (网络智能体蜂群)

一个由大型语言模型（LLM）驱动的、基于浏览器的、多能力智能体系统实验项目。

---

## 核心理念

本项目旨在构建一个可扩展的、多能力的智能体平台。系统的核心是一个“任务调度总管”智能体，它能理解用户的目标，并调用相应的“专家”智能体来完成任务。

**欲了解详细的架构设计和数据流，请参阅 [架构概览 (Architectural Overview)](./docs/Architectural_Overview.md)。**

## 技术栈

*   **前端:** React, TypeScript, Vite
*   **后端:** Node.js, Express
*   **浏览器自动化:** Playwright
*   **安全代码执行:** Node.js `vm` 模块
*   **部署:** Docker, Docker Compose

## 关于本项目

这个项目是一个人机协作的探索。它由一位人类开发者指导，并由 **Google Gemini** 作为AI编程伙伴进行主要的编码、调试、重构和文档撰写工作。这个过程旨在探索在AI的协助下，软件开发的边界和可能性。

## 启动指南

1.  **环境准备:**
    *   确保您已安装 Docker 和 Docker Compose。
    *   确保您的系统中有一个正在运行的、兼容OpenAI API的LLM服务（如Ollama）。

2.  **配置:**
    *   在 `docker-compose.yml` 文件中，修改 `LOCAL_LLM_URL` 环境变量，使其指向您本地LLM服务的正确地址。

3.  **首次启动与开发:**
    *   为了获得最佳的本地开发体验（包括IDE的智能提示），请先在 `frontend` 和 `backend` 目录中手动运行 `npm install`。
        ```bash
        cd frontend
        npm install
        cd ../backend
        npm install
        cd ..
        ```
    *   使用Docker Compose构建并启动服务：
        ```bash
        docker compose up --build -d
        ```

4.  **访问:**
    *   前端应用将在 `http://localhost:5173` 上可用。

