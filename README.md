# GitHub 文档编辑器

一个简单的基于 Next.js 的 GitHub 文档编辑器，支持手动同步到 GitHub 仓库。

## ✨ 功能特点

- 🚀 **纯前端应用** - 无需后端服务器
- 🔐 **GitHub 集成** - 直接使用 GitHub API 操作仓库
- 📝 **Markdown 编辑** - 支持 .md 文件编辑
- 💾 **手动同步** - 手动拉取和提交，完全控制
- 🎨 **简洁界面** - 专注于文档编辑功能
- 📱 **响应式设计** - 支持各种设备

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **GitHub API**: Octokit
- **语言**: TypeScript
- **状态管理**: React Hooks

## 🚀 快速开始

### 1. 环境要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## ⚙️ 配置说明

### GitHub Personal Access Token

1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择 "repo" 权限
4. 复制生成的 token

### 应用配置

在应用首页填写以下信息：

- **仓库所有者**: 你的 GitHub 用户名
- **仓库名称**: 目标仓库名称
- **GitHub Token**: 上面生成的 Personal Access Token
- **文档路径**: 文档存储的文件夹路径 (默认: `docs/`)

## 📖 使用指南

### 1. 配置 GitHub 信息

- 在首页填写仓库信息
- 点击"保存配置"保存到本地存储

### 2. 进入编辑器

- 配置完成后，点击"进入编辑器"
- 或直接访问 `/editor` 路径

### 3. 管理文档

- **刷新文件列表**: 从 GitHub 获取最新文件列表
- **选择文档**: 点击左侧文件列表中的文档
- **编辑内容**: 在右侧文本区域编辑文档
- **保存到 GitHub**: 输入提交信息后点击保存

### 4. 创建新文档

- 点击"新建文档"按钮
- 输入文件名 (建议使用 .md 扩展名)
- 编辑内容并保存

## 🔧 项目结构

```
├── app/
│   ├── page.tsx          # 配置页面
│   ├── editor/
│   │   └── page.tsx      # 编辑器页面
│   ├── globals.css       # 全局样式
│   └── layout.tsx        # 根布局
├── package.json          # 项目依赖
├── tailwind.config.js    # Tailwind 配置
├── postcss.config.js     # PostCSS 配置
├── tsconfig.json         # TypeScript 配置
└── next.config.js        # Next.js 配置
```

## 🚀 部署

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量 (如需要)
4. 自动部署完成

### 自托管部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🔒 安全说明

- GitHub Token 仅存储在浏览器本地存储中
- 建议定期更新 Token
- 不要将 Token 分享给他人
- 可以设置 Token 的过期时间

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🆘 常见问题

### Q: 无法获取文件列表？

A: 检查 GitHub Token 是否有 `repo` 权限，以及仓库信息是否正确。

### Q: 保存文件失败？

A: 确保 Token 有效，网络连接正常，以及有仓库的写入权限。

### Q: 样式没有加载？

A: 确保 Tailwind CSS 正确安装，检查浏览器控制台是否有错误。

### Q: 如何支持其他文件格式？

A: 修改 `fetchFiles` 函数中的文件过滤条件即可。
