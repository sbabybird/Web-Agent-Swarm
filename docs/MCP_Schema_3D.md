# 3D 场景多智能体协作协议 (MCP) 模式 v1.0

## 1. 核心原则

- **简洁性**: 协议应尽可能地简单且易于人类阅读。
- **基于 JSON**: 所有消息都必须是有效的 JSON。

## 2. 命令结构

- `action`: (字符串) 工具要执行的具体动作。
- `params`: (对象) 该动作所需的参数。

## 3. 工具: `scene`

### 3.1. 场景操作

*   **`clear_scene`**: 清空整个场景，移除所有物体和光源。
    *   `params`: `{}`

### 3.2. 物体创建与操作

*   **`create_mesh`**: 创建一个几何体（网格）。
    *   `params`: `{"id": string, "geometry": string, "material": string, "materialParams": object, "position": {x, y, z}?, "rotation": {x, y, z}?}`
    *   `geometry` 可选值: `BoxGeometry`, `SphereGeometry`, `PlaneGeometry`
    *   `material` 可选值: `MeshStandardMaterial`, `MeshBasicMaterial`
*   **`set_position`**: 设置一个已存在物体的位置。
    *   `params`: `{"id": string, "position": {x, y, z}}`

### 3.3. 光源

*   **`add_light`**: 添加一个光源。
    *   `params`: `{"type": string, "color": string, "intensity": number, "position": {x, y, z}?}`
    *   `type` 可选值: `AmbientLight`, `DirectionalLight`, `PointLight`
