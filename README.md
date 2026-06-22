# electron_harmony

> Electron for HarmonyOS - 在鸿蒙设备上运行 Electron 应用

## 项目简介

本项目实现了在鸿蒙设备上运行基于 Electron 框架的截图编辑功能。通过桥接 HarmonyOS 的原生能力和 Electron 的渲染引擎，实现了完整的截图 + 编辑工作流。

## 功能特性

- **截图功能**：使用 HarmonyOS 原生截图 API
- **截图编辑**：支持矩形、椭圆、箭头、画笔、文字等编辑工具
- **全屏预览**：创建全屏窗口显示截图内容
- **跨平台桥接**：通过 AKI (ArkTS Kernel Interface) 桥接原生能力

## 项目结构

```
ohos_hap/
├── AppScope/                    # 应用全局配置
├── docs/                        # 项目文档
├── electron/                    # Electron 模块（待扩展）
├── entry/                       # 主入口模块
├── library/                     # 公共库模块
├── web_engine/                  # Web 引擎核心模块
│   └── src/main/resources/
│       └── resfile/resources/app/    # Web 应用资源
│           ├── main.js               # Electron main 进程入口
│           ├── index.html            # 主页面
│           ├── screenshots-editor/   # 截图编辑器
│           │   ├── lib/             # 插件编译产物
│           │   │   ├── window.js    # 窗口管理
│           │   │   ├── preload.js   # 预加载脚本
│           │   │   └── index.js      # 入口文件
│           │   ├── assets/           # 编辑器静态资源
│           │   └── electron.html     # 编辑器入口 HTML
│           └── node_modules/         # npm 依赖
└── hvigor/                      # 构建工具
```

## 核心模块说明

### main.js

Electron 主进程入口，负责：
- 初始化 etsBridge（原生能力桥接）
- 注册 IPC 处理器
- 初始化截图插件
- 隐藏原生窗口

### screenshots-editor

截图编辑器插件，基于 [electron-screenshots](https://github.com/nashaofu/screenshots) 定制：

- **window.js**: 窗口管理和截图逻辑
  - 使用 etsBridge 调用 HarmonyOS 原生截图
  - 创建全屏 BrowserWindow
  - 管理 IPC 通信

- **preload.js**: 预加载脚本
  - 暴露 `window.screenshots` API
  - 异步获取窗口 ID
  - 转发 IPC 消息给 React 编辑器

- **electron.html**: 编辑器入口
  - 加载 React 构建的截图编辑器
  - 接收截图数据并渲染

## 技术栈

- **前端框架**: React
- **Electron**: 22.x
- **构建工具**: TypeScript + esbuild
- **原生桥接**: AKI (ArkTS Kernel Interface)
- **截图 API**: HarmonyOS ScreenCapture

## 开发指南

### 环境要求

- Node.js 18+
- HarmonyOS SDK
- DevEco Studio

### 编译截图编辑器插件

```bash
cd ../qingtui_demo/screenshots/packages/electron-screenshots
npm install
npm run build
```

编译产物在 `lib/` 目录，需要复制到 `web_engine/src/main/resources/resfile/resources/app/screenshots-editor/lib/`

### 调试

1. 使用 DevEco Studio 打开项目
2. 连接鸿蒙设备
3. 启动应用后，通过 `hilog` 查看日志：

```bash
hilog -x | grep Electron
hilog -x | grep screenshots
```

### 关键日志标签

- `[main.js]` - 主进程日志
- `[window.ts]` - 窗口管理日志
- `[preload]` - 预加载脚本日志
- `[screenshots]` - 截图插件日志

## 工作原理

1. **截图触发**: 用户点击截图按钮
2. **隐藏主窗口**: 调用 `AppWindowAdapter.hideWindow()`
3. **调用原生截图**: 通过 etsBridge 调用 `screenCapture`
4. **创建编辑窗口**: 创建全屏 BrowserWindow
5. **加载编辑器**: BrowserView 加载 React 组件
6. **数据传输**: preload.js 通过 IPC 传递截图数据
7. **用户编辑**: React 组件接收数据并渲染
8. **保存结果**: 用户确认后，图片数据通过 IPC 返回主进程

## 注意事项

- 由于鸿蒙平台的限制，部分 Electron API 可能不可用
- 截图功能依赖 HarmonyOS 原生能力
- BrowserView 必须在主窗口的渲染进程中加载

## License

Apache-2.0
