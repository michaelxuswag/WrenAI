#!/bin/bash

# WrenAI 认证系统 - 云服务器构建脚本
# 用途: 在阿里云/AWS 临时服务器上构建 Docker 镜像

set -e

echo "🚀 WrenAI 认证系统云端构建脚本"
echo "================================"
echo ""
echo "📝 前提条件:"
echo "1. 您已经在阿里云/AWS创建了ECS (4核16GB, Ubuntu 22.04)"
echo "2. 已通过 SSH 连接到服务器"
echo ""
echo "⚠️  请在云服务器上运行此脚本,不是在本地!"
echo ""

read -p "按回车继续..."

# 步骤 1: 安装 Docker
echo ""
echo "📦 [1/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装"
fi

# 步骤 2: 上传代码
echo ""
echo "📂 [2/6] 准备代码..."
echo ""
echo "请在本地电脑运行以下命令上传代码:"
echo ""
echo "  cd /Users/yuexu/WrenAI"
echo "  tar czf wrenai-auth.tar.gz wren-ui/"
echo "  scp wrenai-auth.tar.gz root@YOUR_SERVER_IP:~/"
echo ""
read -p "代码上传完成后,按回车继续..."

# 步骤 3: 解压代码
echo ""
echo "📦 [3/6] 解压代码..."
if [ -f ~/wrenai-auth.tar.gz ]; then
    tar xzf ~/wrenai-auth.tar.gz
    cd ~/wren-ui
    echo "✅ 代码解压完成"
else
    echo "❌ 找不到 wrenai-auth.tar.gz"
    echo "请先在本地运行:"
    echo "  cd /Users/yuexu/WrenAI"
    echo "  tar czf wrenai-auth.tar.gz wren-ui/"
    echo "  scp wrenai-auth.tar.gz root@$(curl -s ifconfig.me):~/"
    exit 1
fi

# 步骤 4: 构建镜像
echo ""
echo "🏗️  [4/6] 构建 Docker 镜像 (大约10-15分钟)..."
docker build -f Dockerfile.auth -t wren-ui-auth:latest .
echo "✅ 镜像构建完成"

# 步骤 5: 保存镜像
echo ""
echo "💾 [5/6] 导出镜像..."
docker save wren-ui-auth:latest | gzip > wren-ui-auth.tar.gz
echo "✅ 镜像已保存到: ~/wren-ui/wren-ui-auth.tar.gz"
echo "   大小: $(du -h wren-ui-auth.tar.gz | cut -f1)"

# 步骤 6: 下载到本地
echo ""
echo "⬇️  [6/6] 下载镜像到本地"
echo ""
echo "请在本地电脑运行:"
echo ""
echo "  scp root@$(curl -s ifconfig.me):~/wren-ui/wren-ui-auth.tar.gz /Users/yuexu/"
echo ""
echo "然后导入镜像:"
echo ""
echo "  cd /Users/yuexu"
echo "  docker load < wren-ui-auth.tar.gz"
echo ""
echo "最后更新 docker-compose.yaml 并重启:"
echo ""
echo "  cd /Users/yuexu/WrenAI/docker"
echo "  # 修改 wren-ui 的 image: wren-ui-auth:latest"
echo "  docker-compose up -d"
echo ""
echo "  # 测试"
echo "  cd /Users/yuexu/WrenAI/wren-ui"
echo "  ./test-auth-api.sh"
echo ""
echo "✅ 完成后,记得释放云服务器节省费用!"

echo ""
echo "🎉 构建完成!"
