# 微前端 Demo — wujie 框架

基于 **wujie** 框架的微前端架构演示项目，包含 1 个主应用和 3 个子应用，实现跨应用通信。

## 项目结构

```
mfe-wujie-demo/
├── main-app/                # 主应用 (Vue 3 + shadcn-vue)
│   └── src/
│       ├── views/SubAppContainer.vue   # 子应用容器（wujie 加载/原生 iframe）
│       ├── components/Sidebar.vue      # 左侧导航栏
│       ├── components/MessagePanel.vue # 底部通信消息面板
│       └── router/index.ts             # 路由配置
│
├── sub-app-react-next/      # 子应用 1 (Next.js 15 + React 19)
│   └── src/app/
│       ├── layout.tsx        # 服务端组件布局
│       ├── page.tsx          # 页面入口（dynamic ssr:false）
│       └── page-content.tsx  # 实际页面内容 + 消息通信
│
├── sub-app-vue3/            # 子应用 2 (Vue 3 + Vite)
│   └── src/App.vue           # 页面 + 消息通信
│
├── sub-app-react-spa/       # 子应用 3 (React 18 + Ant Design + Vite)
│   └── src/App.tsx           # 页面 + 消息通信
│
├── pnpm-workspace.yaml      # pnpm monorepo 配置
└── package.json              # 根脚本
```

## 技术栈

| 应用 | 框架 | 构建工具 | 端口 |
|------|------|----------|------|
| **主应用** | Vue 3 + shadcn-vue + Tailwind CSS | Vite | 9000 |
| **子应用 1** | Next.js 15 + React 19 | Next.js | 9001 |
| **子应用 2** | Vue 3 | Vite | 9002 |
| **子应用 3** | React 18 + Ant Design 5 | Vite | 9003 |

## 快速启动

### 前置条件

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
cd mfe-wujie-demo
pnpm install
```

### 启动所有应用

```bash
pnpm dev
```

此命令会同时启动 4 个应用：

| 应用 | 访问地址 |
|------|----------|
| 主应用 | http://localhost:9000 |
| Next.js 子应用 | http://localhost:9001 |
| Vue3 子应用 | http://localhost:9002 |
| React SPA 子应用 | http://localhost:9003 |

### 分别启动

```bash
pnpm dev:main   # 主应用
pnpm dev:next   # Next.js 子应用
pnpm dev:vue3   # Vue3 子应用
pnpm dev:spa    # React SPA 子应用
```

## 使用说明

### 1. 浏览子应用

在左侧导航栏点击子应用名称，主应用会通过 wujie 框架（或原生 iframe）加载对应的子应用。

### 2. 父子应用通信

#### 主应用 → 子应用

1. 进入子应用页面
2. 在"发送给当前子应用"输入框中输入消息
3. 点击"发送给当前子应用"按钮
4. 子应用会在顶部的 **📩 来自父应用的消息** 区域显示收到的消息

#### 子应用 → 主应用

1. 在子应用的输入框中输入消息
2. 点击"发送给主应用"按钮
3. 主应用底部的通信消息面板会显示子应用发来的消息

### 3. 子应用间通信

1. 在任意子应用的输入框中输入消息
2. 点击"转发给 Vue3 子应用"或"转发给 React SPA 子应用"等按钮
3. 消息通过主应用中转到目标子应用
4. 目标子应用会在顶部的 **🔄 来自其他子应用的消息** 区域显示

### 4. 查看通信日志

每个子应用底部都有**详细通信日志**面板，记录所有收发消息，并通过虚线分隔父应用消息和子应用消息。

## 通信架构

```
┌─────────────────────────────────────────────────────┐
│                    主应用 (port 9000)                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  SubAppContainer                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │  iframe   │ │  wujie   │ │   wujie      │  │  │
│  │  │  (直接src)│ │  沙箱    │ │   沙箱       │  │  │
│  │  │  Next.js  │ │  Vue3    │ │  React SPA   │  │  │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  └───────┼─────────────┼──────────────┼──────────┘  │
└──────────┼─────────────┼──────────────┼─────────────┘
           │             │              │
      postMessage    postMessage    postMessage
           │        + wujie bus    + wujie bus
           ▼             ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ Next.js  │  │  Vue3    │  │  React SPA   │
    │ port 9001│  │ port 9002│  │  port 9003   │
    └──────────┘  └──────────┘  └──────────────┘
```

### 消息通道

| 方向 | 方式 | 适用范围 |
|------|------|----------|
| 父 → 子 | `iframe.contentWindow.postMessage()` + wujie bus | 所有子应用 |
| 子 → 父 | `window.parent.postMessage()` + wujie bus | 所有子应用 |
| 子 → 子 | 通过主应用中转（postMessage + wujie bus） | 跨子应用 |

### 加载方式

- **Next.js 子应用**：使用原生 iframe（`src` 属性直接加载），保留 SSR 能力
- **Vue3 / React SPA 子应用**：使用 wujie 沙箱隔离加载

## 构建

```bash
# 构建所有应用
pnpm build

# 单独构建
pnpm build:main
pnpm build:vue3
pnpm build:spa
```

> Next.js 子应用使用 `next build` 构建，会在 `.next` 目录生成输出。
> Vite 应用的构建输出在各自 `dist/` 目录。

## 微前端通信功能演示

| 功能 | 操作位置 | 效果 |
|------|----------|------|
| 父→子消息 | 主应用输入框 + 发送按钮 | 子应用顶部 📩 区域显示 |
| 子→父消息 | 子应用输入框 + 发送按钮 | 主应用底部消息面板显示 |
| 子↔子消息 | 子应用输入框 + 转发按钮 | 目标子应用顶部 🔄 区域显示 |
| 消息分组 | 自动 | 虚线分隔 + 蓝/绿色标签区分来源 |
