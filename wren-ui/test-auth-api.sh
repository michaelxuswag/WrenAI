#!/bin/bash

# WrenAI 认证系统测试脚本
# 使用方法: ./test-auth-api.sh

API_URL="http://localhost:3000/api/graphql"
GRAPHQL_CONTENT_TYPE="Content-Type: application/json"

echo "========================================="
echo "WrenAI 认证系统 API 测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试 1: 用户注册
echo -e "${YELLOW}测试 1: 用户注册${NC}"
echo "----------------------------------------"

REGISTER_RESPONSE=$(curl -s -X POST $API_URL \
  -H "$GRAPHQL_CONTENT_TYPE" \
  -d '{
    "query": "mutation { register(email: \"admin@wrenai.com\", username: \"admin\", password: \"Admin123456\", fullName: \"系统管理员\", organizationName: \"WrenAI 科技\") { user { id email username fullName } accessToken refreshToken expiresIn } }"
  }')

echo "响应: $REGISTER_RESPONSE"
echo ""

# 提取 access token (如果注册成功)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ 注册成功!${NC}"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  echo ""
else
  echo -e "${RED}✗ 注册失败 (可能用户已存在)${NC}"
  echo -e "${YELLOW}尝试登录...${NC}"
  echo ""

  # 测试 2: 用户登录
  echo -e "${YELLOW}测试 2: 用户登录${NC}"
  echo "----------------------------------------"

  LOGIN_RESPONSE=$(curl -s -X POST $API_URL \
    -H "$GRAPHQL_CONTENT_TYPE" \
    -d '{
      "query": "mutation { login(email: \"admin@wrenai.com\", password: \"Admin123456\") { user { id email username fullName } accessToken refreshToken expiresIn } }"
    }')

  echo "响应: $LOGIN_RESPONSE"
  echo ""

  # 提取 access token
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')

  if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ 登录成功!${NC}"
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo ""
  else
    echo -e "${RED}✗ 登录失败${NC}"
    echo "请检查 GraphQL API 是否正常运行"
    exit 1
  fi
fi

# 测试 3: 获取当前用户信息
echo -e "${YELLOW}测试 3: 获取当前用户信息 (me query)${NC}"
echo "----------------------------------------"

ME_RESPONSE=$(curl -s -X POST $API_URL \
  -H "$GRAPHQL_CONTENT_TYPE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "query": "query { me { id email username fullName avatarUrl createdAt updatedAt } }"
  }')

echo "响应: $ME_RESPONSE"
echo ""

if echo "$ME_RESPONSE" | grep -q '"email"'; then
  echo -e "${GREEN}✓ 获取用户信息成功!${NC}"
  echo ""
else
  echo -e "${RED}✗ 获取用户信息失败${NC}"
  echo ""
fi

# 测试 4: 刷新 Token
echo -e "${YELLOW}测试 4: 刷新 Access Token${NC}"
echo "----------------------------------------"

REFRESH_RESPONSE=$(curl -s -X POST $API_URL \
  -H "$GRAPHQL_CONTENT_TYPE" \
  -d "{
    \"query\": \"mutation { refreshToken(refreshToken: \\\"$REFRESH_TOKEN\\\") { accessToken refreshToken expiresIn } }\"
  }")

echo "响应: $REFRESH_RESPONSE"
echo ""

if echo "$REFRESH_RESPONSE" | grep -q '"accessToken"'; then
  echo -e "${GREEN}✓ Token 刷新成功!${NC}"
  NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  echo "新 Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
  echo ""
else
  echo -e "${RED}✗ Token 刷新失败${NC}"
  echo ""
fi

# 测试 5: 使用错误的 Token
echo -e "${YELLOW}测试 5: 使用无效 Token (安全测试)${NC}"
echo "----------------------------------------"

INVALID_RESPONSE=$(curl -s -X POST $API_URL \
  -H "$GRAPHQL_CONTENT_TYPE" \
  -H "Authorization: Bearer invalid_token_12345" \
  -d '{
    "query": "query { me { id email } }"
  }')

echo "响应: $INVALID_RESPONSE"
echo ""

if echo "$INVALID_RESPONSE" | grep -q '"email"'; then
  echo -e "${RED}✗ 安全问题: 无效 Token 可以访问受保护资源!${NC}"
  echo ""
else
  echo -e "${GREEN}✓ 安全测试通过: 无效 Token 被正确拒绝${NC}"
  echo ""
fi

# 总结
echo "========================================="
echo -e "${GREEN}测试完成!${NC}"
echo "========================================="
echo ""
echo "如果所有测试都通过,说明认证系统工作正常。"
echo ""
echo "下一步:"
echo "1. 打开 http://localhost:3000/api/graphql 使用 GraphQL Playground"
echo "2. 增加 Docker Desktop 内存后重新构建镜像"
echo "3. 查看完整文档: AUTH_DEPLOYMENT_GUIDE.md"
echo ""
