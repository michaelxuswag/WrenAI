# 如何增加 Docker Desktop 内存

## macOS 操作步骤

### 1. 打开 Docker Desktop

在 macOS 菜单栏找到 Docker 图标(小鲸鱼)并点击

### 2. 进入设置

- 点击菜单栏的 Docker 图标
- 选择 **Settings** (设置)

### 3. 进入 Resources (资源)

- 在左侧菜单中点击 **Resources**
- 然后点击 **Advanced** (高级)

### 4. 调整内存

- 找到 **Memory** (内存) 滑块
- 将内存从当前值(通常是 2GB)拖动到 **8GB** 或更高
- 推荐设置:
  - **最低**: 6GB (勉强可以)
  - **推荐**: 8GB (稳定)
  - **最佳**: 12GB (如果您的 Mac 有 16GB+ 内存)

### 5. 应用并重启

- 点击右下角的 **Apply & Restart** 按钮
- 等待 Docker Desktop 重启完成(大约 30-60 秒)

### 6. 验证配置

打开终端执行:
```bash
docker info | grep -i memory
```

应该看到类似输出:
```
Total Memory: 8.00 GiB
```

## 完成后继续构建

内存增加后,执行以下命令重新构建:

```bash
cd /Users/yuexu/WrenAI/wren-ui
docker build -f Dockerfile.auth -t wren-ui-auth:latest .
```

## 如果仍然失败

### 方案 A: 进一步增加内存
- 将 Docker 内存设置为 12GB 或 16GB

### 方案 B: 清理 Docker 缓存
```bash
# 清理构建缓存
docker builder prune -a

# 清理所有未使用的资源
docker system prune -a
```

### 方案 C: 使用远程构建
如果本地 Mac 资源不足,可以:
1. 使用 GitHub Actions 构建
2. 使用云服务器(如 AWS EC2, 阿里云)构建
3. 使用 Docker BuildX 远程构建

## 系统要求

构建 WrenAI 自定义镜像的推荐配置:
- **Mac 内存**: 16GB+ (系统 + Docker)
- **Docker 内存**: 8GB+
- **可用磁盘**: 20GB+

## 故障排查

### 问题: Docker Desktop 无法分配 8GB 内存

**原因**: Mac 总内存不足

**解决方案**:
1. 关闭其他应用程序
2. 重启 Mac
3. 如果 Mac 总内存 < 16GB,考虑使用云服务器构建

### 问题: 设置后仍然内存不足

**解决方案**:
```bash
# 方案1: 减少 Next.js 并发编译
export NODE_OPTIONS="--max-old-space-size=6144"

# 方案2: 使用 swap (不推荐,但可以尝试)
# macOS 会自动管理 swap,无需手动配置
```

## 快捷视频教程

YouTube 搜索: "Docker Desktop increase memory mac"
或访问官方文档: https://docs.docker.com/desktop/settings/mac/

---

**完成上述步骤后,返回终端继续构建即可!**
