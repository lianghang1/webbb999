# 业务系统管理后台

基于开源项目 vue-vben-admin v5（MIT 协议）二次开发的管理后台，UI 组件库使用 **Naive UI**。

## 环境要求

- Node ≥ 20.10（本机使用 22.x，见 `.node-version`）
- pnpm ≥ 11（`packageManager` 锁定 11.16.0，只允许 pnpm 安装）
- Git

## 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev:naive      # 启动开发服务器（http://localhost:5888，mock 服务自动启动于 5320）
pnpm build:naive    # 生产构建（产物在 apps/web-naive/dist）
pnpm check:type     # 全仓类型检查
pnpm lint           # 代码检查
pnpm commit         # 规范化提交（commitizen）
```

演示登录账号（mock）：`vben / 123456`（超管）、`admin / 123456`、`jack / 123456`（普通用户）。

## 目录结构

```
apps/
  web-naive/        # 主应用（Naive UI 变体），业务开发都在这里
  backend-mock/     # nitro mock 服务，联调后端后可整体移除
packages/           # @vben 框架包（布局、权限、请求等），一般不改动
internal/           # 构建与 lint 工具链配置
scripts/            # 工程脚本（turbo-run / vsh / clean）
```

## 二次开发入口

| 内容 | 位置 |
| --- | --- |
| 业务页面 | `apps/web-naive/src/views/` |
| 路由与菜单 | `apps/web-naive/src/router/routes/` |
| 接口定义 | `apps/web-naive/src/api/` |
| 组件适配（表单/表格） | `apps/web-naive/src/adapter/` |
| 主题与布局偏好 | `apps/web-naive/src/preferences.ts` |
| 国际化文案 | `apps/web-naive/src/locales/` |
| 切换真实 API | `apps/web-naive/.env.development` 中 `VITE_GLOB_API_URL` 指向后端地址 |

## 协议说明

本工程基于 MIT 协议的 vue-vben-admin 构建，`LICENSE` 文件按协议要求保留。
