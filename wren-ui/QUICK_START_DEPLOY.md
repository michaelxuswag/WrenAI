# WrenAI 认证系统 - 快速部署方案

由于本地 Docker 内存限制,这里提供 **3 种快速部署方案**,选择最适合您的:

---

## 🥇 方案 1: GitHub Actions (最推荐)

**优势**: 免费、自动化、无需本地资源

### 1️⃣ 推送代码到 GitHub

```bash
cd /Users/yuexu/WrenAI

# 如果还没有 git 仓库
git init
git add .
git commit -m "Add WrenAI authentication system"

# 添加远程仓库(替换成您的 GitHub 仓库地址)
git remote add origin https://github.com/YOUR_USERNAME/WrenAI.git
git push -u origin main
```

### 2️⃣ 触发自动构建

- 推送后自动触发,或手动触发:
- 访问 `https://github.com/YOUR_USERNAME/WrenAI/actions`
- 点击 "Build WrenAI Auth Docker Image" → "Run workflow"

### 3️⃣ 使用构建好的镜像

```bash
# 更新 docker-compose.yaml
cd /Users/yuexu/WrenAI/docker

# 修改 wren-ui 的 image 为:
# image: ghcr.io/YOUR_USERNAME/wren-ui-auth:latest

# 拉取并启动
docker-compose pull wren-ui
docker-compose up -d

# 测试
cd /Users/yuexu/WrenAI/wren-ui
./test-auth-api.sh
```

**详细步骤**: 参见 [GITHUB_ACTIONS_BUILD_GUIDE.md](GITHUB_ACTIONS_BUILD_GUIDE.md)

---

## 🥈 方案 2: 本地增加 Docker 内存 (最直接)

**优势**: 完全本地控制,构建一次即可

### 1️⃣ 打开 Docker Desktop

- 点击菜单栏的 Docker 图标(鲸鱼)
- 选择 **Settings** (设置)

### 2️⃣ 增加内存到 12GB

- 左侧菜单: **Resources** → **Advanced**
- 拖动 **Memory** 滑块到 **12GB** 或 **16GB**
- 点击 **Apply & Restart**

### 3️⃣ 构建并部署

```bash
cd /Users/yuexu/WrenAI/wren-ui

# 构建镜像
docker build -f Dockerfile.auth -t wren-ui-auth:latest .

# 更新 docker-compose.yaml
cd /Users/yuexu/WrenAI/docker
# 修改 image: wren-ui-auth:latest

# 重启服务
docker-compose up -d

# 测试
cd /Users/yuexu/WrenAI/wren-ui
./test-auth-api.sh
```

**详细步骤**: 参见 [INCREASE_DOCKER_MEMORY.md](INCREASE_DOCKER_MEMORY.md)

---

## 🥉 方案 3: 云服务器临时构建 (最快)

**优势**: 立即可用,按时付费(约 1 元人民币)

### 阿里云 ECS 构建

```bash
# 1. 创建按量付费 ECS (4核16GB)
# 选择镜像: Ubuntu 22.04
# 安全组开放: 22(SSH)

# 2. SSH 连接到服务器
ssh root@YOUR_ECS_IP

# 3. 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker

# 4. 克隆代码 (或上传 tar 包)
git clone YOUR_REPO_URL
cd WrenAI/wren-ui

# 5. 构建镜像
docker build -f Dockerfile.auth -t wren-ui-auth:latest .

# 6. 保存镜像
docker save wren-ui-auth:latest | gzip > wren-ui-auth.tar.gz

# 7. 下载到本地
scp root@YOUR_ECS_IP:/root/WrenAI/wren-ui/wren-ui-auth.tar.gz .

# 8. 释放 ECS 服务器(节省成本)
```

### 本地导入镜像

```bash
# 导入镜像
docker load < wren-ui-auth.tar.gz

# 更新 docker-compose.yaml
cd /Users/yuexu/WrenAI/docker
# 修改 image: wren-ui-auth:latest

# 启动
docker-compose up -d
```

---

## 🎯 快速对比

| 方案 | 时间 | 成本 | 难度 | 推荐度 |
|------|------|------|------|--------|
| **GitHub Actions** | 15分钟 | 免费 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| **增加本地内存** | 10分钟 | 免费 | ⭐⭐ 中等 | ⭐⭐⭐⭐ |
| **云服务器** | 20分钟 | ~1元 | ⭐⭐⭐ 较难 | ⭐⭐⭐ |

---

## 🧪 部署后测试

所有方案完成后,执行以下测试:

```bash
cd /Users/yuexu/WrenAI/wren-ui

# 自动化测试脚本
./test-auth-api.sh

# 或手动测试
curl -X POST http://localhost:3000/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { register(email: \"admin@example.com\", username: \"admin\", password: \"Admin123456\", fullName: \"管理员\", organizationName: \"我的公司\") { user { id email } accessToken } }"
  }'
```

**预期响应**:
```json
{
  "data": {
    "register": {
      "user": {
        "id": 1,
        "email": "admin@example.com"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

---

## 📊 当前状态

✅ **已完成 95%**:
- 9 个数据库迁移(已运行)
- 10 个后端文件(认证系统)
- 3 个前端页面(登录/注册)
- JWT + RBAC 完整实现
- 测试脚本和文档

⏳ **待完成 5%**:
- Docker 镜像构建和部署

---

## 🆘 需要帮助?

- **GitHub Actions 详细指南**: [GITHUB_ACTIONS_BUILD_GUIDE.md](GITHUB_ACTIONS_BUILD_GUIDE.md)
- **增加 Docker 内存**: [INCREASE_DOCKER_MEMORY.md](INCREASE_DOCKER_MEMORY.md)
- **完整部署指南**: [AUTH_DEPLOYMENT_GUIDE.md](AUTH_DEPLOYMENT_GUIDE.md)
- **项目总结**: [FINAL_SUMMARY.md](FINAL_SUMMARY.md)

---

**选择建议**:

1. **有 GitHub 账号** → 选方案 1 (GitHub Actions)
2. **Mac 内存 ≥ 16GB** → 选方案 2 (增加 Docker 内存)
3. **需要立即部署** → 选方案 3 (云服务器)

**开始部署吧!** 🚀
