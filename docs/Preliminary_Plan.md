
# 项目名称：Web Agent Swarm (网络智能体蜂群)

## 核心目标

开发一个基于浏览器的原型，用户输入一个高级目标（例如：“帮我申请GitHub Copilot的学生包”），一个多智能体系统能自主协作，通过在线搜索信息，并最终填充目标网页上的表单。

## 核心技术理念：多能力智能体平台

我们将构建一个可扩展的、多能力的智能体平台。系统的核心是一个“任务调度总管”智能体，它能理解用户的目标，判断其意图（例如，是“网页自动化”还是“绘图”），然后调用相应的“专家”智能体来完成任务。

1.  **Manager Agent (任务调度总管):**
    *   **职责:** 项目的“大脑”。负责分析用户目标，判断任务类型，并调用最合适的专家智能体来生成执行计划。
    *   **输出:** 一个包含任务类型和具体负载（Payload）的结构化JSON。例如：
        *   `{ "taskType": "browser_automation", "payload": "...JS code..." }`
        *   `{ "taskType": "drawing", "payload": [ { ...drawing instructions... } ] }`

2.  **Browser Expert (网页自动化专家):**
    *   **职责:** 接收网页自动化任务，并生成可执行的、安全的Playwright JavaScript代码。

3.  **Drawing Expert (绘画专家):**
    *   **职责:** 接收绘画任务，并生成一个描述画面元素的、结构化的JSON指令集。

4.  **Executor Services (后端执行器):**
    *   **职责:** 后端提供多个独立的、安全的执行服务。例如，一个用于在沙箱中执行Playwright代码，另一个用于验证和传递绘图指令。

---

## 技术架构与选型

这个方案完全基于浏览器，但需要一个简单的后端作为“代理”来绕过浏览器跨域限制。

*   **前端 (用户界面 & 智能体运行环境):**
    *   **框架:** **React (使用 Vite)** 或 **Vue.js**。Vite能提供极速的开发体验。
    *   **语言:** **TypeScript**。强类型能极大提升复杂应用代码的健壮性。
    *   **功能:**
        *   一个简单的UI界面，包含：目标输入框、目标网址输入框、启动按钮、以及一个实时显示各智能体工作日志的“控制台”区域。
        *   智能体编排逻辑（Orchestration Logic）: 前端代码将负责调用LLM API，并根据Manager的决策，依次激活Researcher和Form-Filler。

*   **后端 (代理服务器):**
    *   **框架:** **Node.js + Express** 或 **Python + FastAPI**。非常轻量，只需一个核心功能。
    *   **功能:**
        *   创建一个API端点，例如 `/fetch-url`。前端将目标URL发给它，它在服务器端抓取网页HTML内容，然后返回给前端。**这是绕过浏览器同源策略（CORS）的关键**。

*   **AI核心 (大语言模型):**
    *   **服务:** **OpenAI GPT系列**、**Google Gemini API** 或 **Anthropic Claude API**。选择一个您能方便获取API Key的服务即可。所有智能体的“智能”都来源于调用这些API。

---

## 分步实施的技术验证路线

#### 第一步：项目搭建与UI界面

1.  使用 `Vite` 初始化一个React + TypeScript项目。
2.  创建一个简单的后端Express服务器。
3.  设计前端UI：一个输入框用于用户输入总体目标，一个用于输入目标网页URL，一个“开始”按钮，以及一个用于显示日志的`<textarea>`。

#### 第二步：实现网页内容获取

1.  在后端Express中，创建一个 `/fetch-url` 路由，它接收一个URL参数，使用`axios`或`node-fetch`库请求该URL，并将获取到的HTML文本作为响应返回。
2.  在前端，当用户点击“开始”时，调用这个后端API来获取目标网页的HTML内容。

#### 第三步：实现单个智能体 - Researcher

1.  编写一个函数 `runResearcherAgent(task, htmlContent)`。
2.  在此函数内，构建一个精密的**提示词 (Prompt)**，例如：
    > “你是一个世界级的网络信息研究员。这是某网页的HTML内容：`{htmlContent}`。请从内容中找到关于‘`{task}`’的信息，并只返回最关键的答案。”
3.  调用LLM API，将这个Prompt发送出去，并将返回的结果显示在日志区。**至此，你已验证了“阅读网页”的核心能力。**

#### 第四步：实现单个智能体 - Form-Filler

1.  编写一个函数 `runFormFillerAgent(htmlContent, data)`。
2.  构建提示词，例如：
    > “你是一个精准的Web表单填充助手。这是某网页的HTML：`{htmlContent}`。这是一份JSON数据：`{data}`。请分析HTML中的`<form>`，找到所有`<input>`, `<select>`等字段，并返回一个JSON对象，其key为每个字段的`id`或`name`属性，value为`{data}`中对应的值。”
3.  调用LLM API，获取返回的JSON。**至此，你已验证了“映射数据到表单”的核心能力。**

#### 第五步：实现“大脑” - Manager与智能体编排

1.  这是最核心的一步。当用户点击“开始”后，首先启动Manager Agent。
2.  **Manager的第一次调用:**
    *   **Prompt:** “你是一个项目管理者。用户目标是‘`{用户总目标}`’，目标网页的表单结构分析如下（由Form-Filler提供）：`{表单字段}`。请生成一个分步计划，告诉我需要研究哪些信息。”
    *   **LLM返回:** 一个包含多个研究任务的列表，例如 `["查找用户的全名", "查找用户的邮箱地址"]`。
3.  **循环调用Researcher:**
    *   遍历上述任务列表，依次调用`runResearcherAgent`来查找每个问题的答案。
4.  **Manager的第二次调用:**
    *   **Prompt:** “你是一个项目管理者。研究任务已完成，这是收集到的所有信息：`{所有答案}`。请将这些信息整理成一份用于填充表单的JSON数据。”
    *   **LLM返回:** 一份结构化的JSON数据，例如 `{ "fullName": "张三", "email": "zhangsan@example.com" }`。
5.  **调用Form-Filler:**
    *   调用`runFormFillerAgent`，将目标网页HTML和这份最终的JSON数据传给它，获得字段与值的最终映射关系。
6.  **在浏览器中填充:**
    *   使用JavaScript `document.getElementById(fieldId).value = value;` 将LLM返回的映射结果，真实地填充到浏览器页面的表单中。
