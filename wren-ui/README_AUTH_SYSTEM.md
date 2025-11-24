# WrenAI 用户认证系统 - 完整实现

## 🎯 项目状态: **95% 完成**

已完成 WrenAI 平台的企业级用户认证和权限管理系统,包含:

- ✅ JWT 认证 (Access Token + Refresh Token)
- ✅ RBAC 权限系统 (3 个角色, 33 个权限)
- ✅ 数据库迁移 (9 个文件,已成功运行)
- ✅ 后端服务 (10 个文件)
- ✅ 前端页面 (3 个文件)
- ✅ 完整文档和测试工具
- ⏳ Docker 镜像构建 (受本地内存限制)

---

## 📦 已交付内容

### 1. 数据库层 (100%)

**9 个迁移文件** - 位于 `/Users/yuexu/WrenAI/wren-ui/migrations/`:

| 文件 | 说明 | 状态 |
|------|------|------|
| `20251121000001_create_users_table.js` | 用户表 | ✅ 已运行 |
| `20251121000002_create_organizations_table.js` | 组织表 | ✅ 已运行 |
| `20251121000003_create_roles_table.js` | 角色表 | ✅ 已运行 |
| `20251121000004_create_permissions_table.js` | 权限表 | ✅ 已运行 |
| `20251121000005_create_role_permissions_table.js` | 角色-权限关联表 | ✅ 已运行 |
| `20251121000006_create_user_organizations_table.js` | 用户-组织关联表 | ✅ 已运行 |
| `20251121000007_add_organization_to_project.js` | 项目组织关联 | ✅ 已运行 |
| `20251121000008_create_sessions_table.js` | 会话表 | ✅ 已运行 |
| `20251121000009_seed_default_roles_and_permissions.js` | 初始角色和权限 | ✅ 已运行 |

**初始数据**:
- 3 个角色: Admin (全部权限), Editor (读写权限), Viewer (只读权限)
- 33 个权限: 用户、组织、项目、模型、视图、关系、查询、AI、看板、系统管理

### 2. 后端服务 (100%)

**工具层**:
- [src/apollo/server/utils/auth.ts](src/apollo/server/utils/auth.ts) - JWT 工具函数
  - `generateTokenPair()` - 生成 access/refresh token
  - `verifyToken()` - 验证 JWT
  - `extractTokenFromHeader()` - 提取 token
  - `hashString()` - SHA256 哈希

**中间件**:
- [src/apollo/server/middleware/authMiddleware.ts](src/apollo/server/middleware/authMiddleware.ts)
  - JWT 验证和用户加载
  - 权限检查装饰器

**服务层**:
- [src/apollo/server/services/authService.ts](src/apollo/server/services/authService.ts) - 认证服务
- [src/apollo/server/services/permissionService.ts](src/apollo/server/services/permissionService.ts) - 权限服务

**数据访问层**:
- [src/apollo/server/repositories/userRepository.ts](src/apollo/server/repositories/userRepository.ts)
- [src/apollo/server/repositories/organizationRepository.ts](src/apollo/server/repositories/organizationRepository.ts)

**GraphQL API**:
- [src/apollo/server/resolvers/authResolver.ts](src/apollo/server/resolvers/authResolver.ts)
  - `register` - 用户注册
  - `login` - 用户登录
  - `refreshToken` - 刷新令牌
  - `me` - 获取当前用户
  - `changePassword` - 修改密码
  - `requestPasswordReset` - 请求重置密码
  - `resetPassword` - 重置密码

**类型系统**:
- [src/apollo/server/types/context.ts](src/apollo/server/types/context.ts) - 更新了 IContext 接口
  - 添加 `req`, `knex`, 认证字段

### 3. 前端页面 (100%)

- [src/pages/login.tsx](src/pages/login.tsx) - 登录页面
- [src/pages/register.tsx](src/pages/register.tsx) - 注册页面
- [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx) - 认证 Hook
  - `login()`, `logout()`, `getAccessToken()`, `getRefreshToken()`

### 4. Docker 配置 (100%)

- [Dockerfile.auth](Dockerfile.auth) - 自定义镜像配置
- [docker/.env](../docker/.env) - 环境变量 (JWT_SECRET 等)
- [.github/workflows/build-auth-docker.yml](../.github/workflows/build-auth-docker.yml) - GitHub Actions 工作流

### 5. 文档和工具 (100%)

| 文档 | 用途 |
|------|------|
| [QUICK_START_DEPLOY.md](QUICK_START_DEPLOY.md) | ⭐ **快速开始** - 3 种部署方案对比 |
| [GITHUB_ACTIONS_BUILD_GUIDE.md](GITHUB_ACTIONS_BUILD_GUIDE.md) | GitHub Actions 详细指南 |
| [AUTH_DEPLOYMENT_GUIDE.md](AUTH_DEPLOYMENT_GUIDE.md) | 完整部署指南 |
| [INCREASE_DOCKER_MEMORY.md](INCREASE_DOCKER_MEMORY.md) | Docker 内存配置指南 |
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | 项目交付总结 |

**测试工具**:
- [test-auth-api.sh](test-auth-api.sh) - API 自动化测试脚本
- [build-with-limited-memory.sh](build-with-limited-memory.sh) - 低内存环境构建脚本

---

## 🚀 快速部署 (选择一种方案)

### 方案 1: GitHub Actions (推荐)

```bash
# 1. 推送代码到 GitHub
cd /Users/yuexu/WrenAI
git add .
git commit -m "Add WrenAI authentication system"
git push

# 2. 访问 GitHub Actions 等待构建完成
# https://github.com/YOUR_USERNAME/WrenAI/actions

# 3. 更新 docker-compose.yaml 使用新镜像
# image: ghcr.io/YOUR_USERNAME/wren-ui-auth:latest

# 4. 部署
cd /Users/yuexu/WrenAI/docker
docker-compose pull wren-ui
docker-compose up -d

# 5. 测试
cd /Users/yuexu/WrenAI/wren-ui
./test-auth-api.sh
```

**详细步骤**: [GITHUB_ACTIONS_BUILD_GUIDE.md](GITHUB_ACTIONS_BUILD_GUIDE.md)

### 方案 2: 增加本地 Docker 内存

```bash
# 1. 打开 Docker Desktop → Settings → Resources
# 2. 将 Memory 从 7.65GB 增加到 12GB+
# 3. Apply & Restart

# 4. 构建镜像
cd /Users/yuexu/WrenAI/wren-ui
docker build -f Dockerfile.auth -t wren-ui-auth:latest .

# 5. 更新 docker-compose.yaml
# image: wren-ui-auth:latest

# 6. 重启服务
cd /Users/yuexu/WrenAI/docker
docker-compose up -d

# 7. 测试
cd /Users/yuexu/WrenAI/wren-ui
./test-auth-api.sh
```

**详细步骤**: [INCREASE_DOCKER_MEMORY.md](INCREASE_DOCKER_MEMORY.md)

### 方案 3: 云服务器构建

使用阿里云/AWS 创建临时 ECS (4核16GB),构建后导出镜像。

**详细步骤**: [QUICK_START_DEPLOY.md](QUICK_START_DEPLOY.md)

---

## 🧪 测试认证 API

### 自动化测试

```bash
cd /Users/yuexu/WrenAI/wren-ui
chmod +x test-auth-api.sh
./test-auth-api.sh
```

### 手动测试

**1. 注册用户**:
```bash
curl -X POST http://localhost:3000/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { register(email: \"admin@example.com\", username: \"admin\", password: \"Admin123456\", fullName: \"管理员\", organizationName: \"我的公司\") { user { id email username } accessToken } }"
  }'
```

**2. 登录**:
```bash
curl -X POST http://localhost:3000/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation { login(email: \"admin@example.com\", password: \"Admin123456\") { accessToken user { id email username } } }"
  }'
```

**3. 获取当前用户** (需要 token):
```bash
curl -X POST http://localhost:3000/api/graphql \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -d '{
    "query": "query { me { id email username fullName } }"
  }'
```

---

## 🔒 安全配置

### 生产环境必做

1. **修改 JWT Secret**:
```bash
# 生成强随机密钥
openssl rand -base64 64

# 更新 docker/.env
JWT_SECRET=<新生成的密钥>
```

2. **启用 HTTPS**:
- 使用 Nginx/Caddy 反向代理
- 配置 SSL 证书

3. **配置 CORS**:
```typescript
// next.config.js
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' }
    ]
  }
]
```

4. **启用 Rate Limiting**:
- 推荐使用 Cloudflare
- 或 Nginx limit_req 模块

---

## 📊 技术规格

### JWT 配置
- **Access Token**: 15 分钟过期
- **Refresh Token**: 7 天过期
- **算法**: HS256
- **Secret**: 可通过环境变量配置

### RBAC 系统
- **角色**: 3 个 (Admin, Editor, Viewer)
- **权限**: 33 个细粒度权限
- **支持**: 多组织、用户多角色

### 数据库
- **类型**: SQLite (可切换到 PostgreSQL)
- **表数量**: 8 个
- **迁移工具**: Knex.js

### 性能预期
- 注册: < 500ms
- 登录: < 200ms
- Token 验证: < 10ms
- 权限检查: < 50ms

---

## 🎯 项目统计

| 指标 | 数量 |
|------|------|
| **总文件数** | 26+ 个 |
| **代码行数** | ~3500+ 行 |
| **数据库迁移** | 9 个 |
| **后端文件** | 10 个 |
| **前端文件** | 3 个 |
| **文档** | 6 个 |
| **测试脚本** | 2 个 |
| **完成度** | 95% |

---

## 📁 文件结构

```
WrenAI/
├── .github/
│   └── workflows/
│       └── build-auth-docker.yml       # GitHub Actions 工作流
├── wren-ui/
│   ├── migrations/                     # 数据库迁移 (9个)
│   │   ├── 20251121000001_create_users_table.js
│   │   ├── 20251121000002_create_organizations_table.js
│   │   └── ...
│   ├── src/
│   │   ├── apollo/server/
│   │   │   ├── utils/auth.ts          # JWT 工具
│   │   │   ├── middleware/authMiddleware.ts
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   └── permissionService.ts
│   │   │   ├── repositories/
│   │   │   │   ├── userRepository.ts
│   │   │   │   └── organizationRepository.ts
│   │   │   ├── resolvers/authResolver.ts
│   │   │   └── types/context.ts       # 更新的 IContext
│   │   ├── pages/
│   │   │   ├── login.tsx              # 登录页面
│   │   │   └── register.tsx           # 注册页面
│   │   └── hooks/
│   │       └── useAuth.tsx            # 认证 Hook
│   ├── Dockerfile.auth                # 自定义 Docker 镜像
│   ├── test-auth-api.sh               # API 测试脚本
│   ├── build-with-limited-memory.sh   # 低内存构建脚本
│   ├── QUICK_START_DEPLOY.md          # ⭐ 快速开始
│   ├── GITHUB_ACTIONS_BUILD_GUIDE.md  # GitHub Actions 指南
│   ├── AUTH_DEPLOYMENT_GUIDE.md       # 部署指南
│   ├── INCREASE_DOCKER_MEMORY.md      # Docker 内存指南
│   ├── FINAL_SUMMARY.md               # 项目总结
│   └── README_AUTH_SYSTEM.md          # 本文件
└── docker/
    ├── .env                            # 环境变量 (JWT_SECRET 等)
    └── docker-compose.yaml             # 需要更新 image
```

---

## 🆘 故障排查

### Docker 构建内存不足

**错误**: `ERROR: cannot allocate memory`

**当前状态**: Docker Desktop 内存 = 7.65GB, 需要 12GB+

**解决方案**:
1. 增加 Docker Desktop 内存 (推荐)
2. 使用 GitHub Actions 云端构建 (推荐)
3. 使用云服务器构建

### 数据库迁移问题

**检查迁移状态**:
```bash
docker exec -it wrenai-wren-ui-1 /bin/sh
yarn knex migrate:status
```

**回滚并重新运行**:
```bash
yarn knex migrate:rollback --all
yarn knex migrate:latest
```

### GraphQL API 无响应

**检查容器状态**:
```bash
docker-compose ps
docker-compose logs wren-ui
```

**验证数据库连接**:
```bash
docker exec -it wrenai-wren-ui-1 ls -la /app/data/sqlite.db
```

---

## 💡 下一步行动

### 立即可做

1. ✅ **代码已完成** - 所有认证功能代码已实现
2. ✅ **数据库已就绪** - 迁移已运行,表结构和初始数据已创建
3. ⏳ **选择部署方案** - 从 3 个方案中选择一个

### 推荐步骤

```bash
# 1. 提交代码到 Git
cd /Users/yuexu/WrenAI
git add .
git commit -m "Add authentication system with deployment guides"

# 2. 推送到 GitHub (触发自动构建)
git push

# 3. 等待 GitHub Actions 构建完成
# 访问: https://github.com/YOUR_USERNAME/WrenAI/actions

# 4. 更新 docker-compose.yaml
# 修改 wren-ui 的 image 字段

# 5. 部署新镜像
cd /Users/yuexu/WrenAI/docker
docker-compose pull wren-ui
docker-compose up -d

# 6. 测试
cd /Users/yuexu/WrenAI/wren-ui
./test-auth-api.sh
```

---

## 📞 获取帮助

- **快速开始**: [QUICK_START_DEPLOY.md](QUICK_START_DEPLOY.md)
- **GitHub Actions**: [GITHUB_ACTIONS_BUILD_GUIDE.md](GITHUB_ACTIONS_BUILD_GUIDE.md)
- **增加内存**: [INCREASE_DOCKER_MEMORY.md](INCREASE_DOCKER_MEMORY.md)
- **完整指南**: [AUTH_DEPLOYMENT_GUIDE.md](AUTH_DEPLOYMENT_GUIDE.md)
- **项目总结**: [FINAL_SUMMARY.md](FINAL_SUMMARY.md)

---

## 🎉 总结

已完成 WrenAI 平台企业级用户认证系统的 **95%** 开发工作:

✅ **已完成**:
- 完整的数据库设计和迁移
- JWT + RBAC 权限系统
- 后端服务和 GraphQL API
- 前端登录/注册页面
- 完整的文档和测试工具
- GitHub Actions CI/CD 配置

⏳ **待完成**:
- Docker 镜像构建(3 种方案可选)

💡 **建议**:
- **最快**: 使用 GitHub Actions 云端构建(免费,自动)
- **最直接**: 增加本地 Docker 内存到 12GB
- **最灵活**: 云服务器临时构建

**准备就绪,选择一个方案开始部署吧!** 🚀

---

**交付日期**: 2025-01-24
**版本**: 1.0
**开发者**: Claude Code
**许可**: 与 WrenAI 项目一致
