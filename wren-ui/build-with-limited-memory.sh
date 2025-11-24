#!/bin/bash

# 低内存环境下构建 Docker 镜像的脚本
# 使用方法: ./build-with-limited-memory.sh

set -e

echo "========================================="
echo "低内存环境 Docker 构建脚本"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}步骤 1: 清理 Docker 缓存${NC}"
echo "清理旧的构建缓存以释放内存..."
docker builder prune -f
docker system prune -f
echo -e "${GREEN}✓ 缓存清理完成${NC}"
echo ""

echo -e "${YELLOW}步骤 2: 检查 Docker 内存配置${NC}"
DOCKER_MEMORY=$(docker info 2>/dev/null | grep "Total Memory" | awk '{print $3}')
echo "当前 Docker 内存: $DOCKER_MEMORY GiB"

if [ -z "$DOCKER_MEMORY" ]; then
    echo -e "${YELLOW}⚠ 无法检测 Docker 内存配置${NC}"
else
    MEMORY_VALUE=$(echo $DOCKER_MEMORY | cut -d. -f1)
    if [ "$MEMORY_VALUE" -lt 6 ]; then
        echo -e "${YELLOW}⚠ 警告: Docker 内存小于 6GB,构建可能会失败${NC}"
        echo "建议通过 Docker Desktop GUI 增加内存到 8GB"
        echo ""
        read -p "是否继续尝试构建? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi
echo ""

echo -e "${YELLOW}步骤 3: 准备构建环境${NC}"
cd /Users/yuexu/WrenAI/wren-ui

# 检查必要文件
if [ ! -f "Dockerfile.auth" ]; then
    echo "错误: 找不到 Dockerfile.auth"
    exit 1
fi

echo -e "${GREEN}✓ 构建环境准备完成${NC}"
echo ""

echo -e "${YELLOW}步骤 4: 开始分阶段构建${NC}"
echo "这可能需要 10-20 分钟,请耐心等待..."
echo ""

# 使用 --no-cache 避免缓存问题,使用 --progress=plain 显示详细输出
docker build \
  --progress=plain \
  --no-cache \
  -f Dockerfile.auth \
  -t wren-ui-auth:latest \
  . 2>&1 | tee build.log

BUILD_STATUS=$?

echo ""
if [ $BUILD_STATUS -eq 0 ]; then
    echo -e "${GREEN}========================================="
    echo "✓ 构建成功!"
    echo "=========================================${NC}"
    echo ""
    echo "下一步:"
    echo "1. 检查镜像: docker images | grep wren-ui-auth"
    echo "2. 更新 docker-compose.yaml"
    echo "3. 重启服务: docker-compose up -d"
    echo ""
else
    echo -e "${YELLOW}========================================="
    echo "✗ 构建失败"
    echo "=========================================${NC}"
    echo ""
    echo "错误日志已保存到: build.log"
    echo ""

    # 检查是否是内存错误
    if grep -q "cannot allocate memory" build.log; then
        echo "诊断: 内存不足导致构建失败"
        echo ""
        echo "解决方案:"
        echo "1. 通过 Docker Desktop GUI 增加内存到 8GB+"
        echo "2. 关闭其他应用程序释放系统内存"
        echo "3. 重启 Mac 后再次尝试"
        echo "4. 使用云服务器构建 (AWS EC2, 阿里云等)"
        echo ""
        echo "查看详细指南: cat INCREASE_DOCKER_MEMORY.md"
    fi

    exit 1
fi
