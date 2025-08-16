# 使用说明

## 🚀 快速上手

### 1. 配置 GitHub 信息

在首页填写以下信息：

- **仓库所有者**: 你的 GitHub 用户名
- **仓库名称**: 目标仓库名称
- **GitHub Token**: Personal Access Token (需要 repo 权限)
- **文档路径**: 文档存储的文件夹路径 (默认: `docs/`)

### 2. 获取 GitHub Token

1. 访问 [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 勾选 "repo" 权限
4. 复制生成的 token

### 3. 使用编辑器

- **刷新文件列表**: 从 GitHub 获取最新文件
- **选择文档**: 点击左侧文件列表
- **编辑内容**: 在右侧文本区域编辑
- **保存到 GitHub**: 输入提交信息后保存

## 📝 支持的文件格式

目前支持 `.md` 文件，如需支持其他格式，可修改代码中的文件过滤条件。

## 🔒 安全提醒

- Token 仅存储在浏览器本地
- 不要分享你的 Token
- 建议定期更新 Token
- 可设置 Token 过期时间

## 🆘 常见问题

**Q: 无法获取文件列表？**
A: 检查 Token 权限和仓库信息

**Q: 保存失败？**
A: 确保 Token 有效且有写入权限

**Q: 样式问题？**
A: 检查 Tailwind CSS 是否正确安装
