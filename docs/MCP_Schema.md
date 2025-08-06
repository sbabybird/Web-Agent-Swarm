# 多智能体协作协议 (MCP) 模式 v2.1

## 1. 核心原则

- **简洁性**: 协议应尽可能地简单且易于人类阅读。
- **可扩展性**: 协议必须允许在不破坏现有实现的情况下，轻松添加新的工具、动作和参数。
- **基于 JSON**: 所有消息都必须是有效的 JSON。

## 2. 消息结构

LLM 与工具之间的通信是通过 JSON 对象完成的。主要的通信形式是由 LLM 生成的**命令**数组。

### 2.1. 命令结构

一个命令是一个包含两个键的 JSON 对象：

- `action`: (字符串) 工具要执行的具体动作。
- `params`: (对象) 该动作所需的参数。

## 3. 工具: `canvas`

`canvas` 工具提供了一套丰富的动作集，用于在 2D 画布上进行绘图。

### 3.1. 状态管理

*   **`set_fill_style`**: 设置用于填充形状的颜色。
    *   `params`: `{"color": string}`
*   **`set_stroke_style`**: 设置用于绘制线条（描边）的样式。
    *   `params`: `{"color": string, "lineWidth": number}`
*   **`set_font`**: 设置用于绘制文本的字体。
    *   `params`: `{"font": string}` (e.g., "bold 24px Arial")

### 3.2. 绘图动作

*   **`clear_rect`**: 清除指定的矩形区域。
    *   `params`: `{"x": number, "y": number, "width": number, "height": number}`
*   **`fill_rect`**: 绘制一个填充的矩形。为了获得最佳效果，建议直接在此指令中提供颜色。
    *   `params`: `{"x": number, "y": number, "width": number, "height": number, "color": string?}`
*   **`stroke_rect`**: 绘制一个矩形的轮廓。为了获得最佳效果，建议直接在此指令中提供颜色和线条宽度。
    *   `params`: `{"x": number, "y": number, "width": number, "height": number, "color": string?, "lineWidth": number?}`
*   **`fill_text`**: 绘制填充的文本。为了获得最佳效果，建议直接在此指令中提供颜色和字体。
    *   `params`: `{"text": string, "x": number, "y": number, "color": string?, "font": string?}`

### 3.3. 基于路径的绘图

`draw_path` 动作是最强大的命令，它允许通过定义由多个路径段组成的路径来创建复杂的形状。

*   **`draw_path`**: 执行一系列路径构建步骤，然后可以选择性地填充和/或描边最终形成的形状。
    *   `params`: `{"path": Array<PathSegment>, "fillStyle": string?, "strokeStyle": string?, "lineWidth": number?}`

*   **`PathSegment`**: 一个描述路径中单个步骤的 JSON 对象。
    *   `{"type": "begin_path"}`
    *   `{"type": "move_to", "args": [x, y]}`
    *   `{"type": "line_to", "args": [x, y]}`
    *   `{"type": "arc", "args": [x, y, radius, startAngle, endAngle]}`
    *   `{"type": "rect", "args": [x, y, width, height]}`
    *   `{"type": "close_path"}`