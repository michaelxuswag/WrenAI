# WrenAI 用户认证系统 - 部署指南

## 📋 系统概述

已完成为 WrenAI 添加完整的用户认证和权限管理系统,包括:

- **JWT 认证**: Access Token (15分钟) + Refresh Token (7天)
- **RBAC 权限系统**: 基于角色的访问控制
- **3个默认角色**: Admin (管理员), Editor (编辑者), Viewer (查看者)
- **33个权限点**: 覆盖用户、组织、项目、模型、视图、看板等所有功能
- **完整的用户管理**: 注册、登录、个人信息、密码重置等

## ✅ 已完成的工作

### 1. 数据库迁移 (9个文件)

已创建以下数据库表:
- `users` - 用户表
- `organizations` - 组织表
- `user_organizations` - 用户组织关系表
- `roles` - 角色表
- `permissions` - 权限表
- `role_permissions` - 角色权限关系表
- `user_organization_roles` - 用户组织角色关系表

**迁移文件位置**: `/Users/yuexu/WrenAI/wren-ui/migrations/`

### 2. 后端认证系统

#### 核心工具模块
- **JWT 工具**: [src/apollo/server/utils/auth.ts](src/apollo/server/utils/auth.ts)
  - `generateTokenPair()` - 生成 access/refresh token
  - `verifyToken()` - 验证 JWT token
  - `extractTokenFromHeader()` - 从 Authorization header 提取 token
  - `hashString()` - SHA256 哈希

#### 认证中间件
- **Auth Middleware**: [src/apollo/server/middleware/authMiddleware.ts](src/apollo/server/middleware/authMiddleware.ts)
  - 从请求头提取和验证 JWT token
  - 添加用户信息到 GraphQL context
  - `requireAuth()` - 要求认证
  - `requirePermission()` - 要求特定权限
  - `requireSuperAdmin()` - 要求超级管理员权限

#### 服务层
- **UserService**: [src/apollo/server/services/userService.ts](src/apollo/server/services/userService.ts)
  - 用户CRUD操作
  - 密码验证 (bcrypt)
  - 用户搜索和过滤

- **OrganizationService**: [src/apollo/server/services/organizationService.ts](src/apollo/server/services/organizationService.ts)
  - 组织CRUD操作
  - 用户组织关系管理
  - 组织成员管理

- **PermissionService**: [src/apollo/server/services/permissionService.ts](src/apollo/server/services/permissionService.ts)
  - 权限检查
  - 角色权限管理
  - 用户权限查询

#### 数据访问层
- **UserRepository**: [src/apollo/server/repositories/userRepository.ts](src/apollo/server/repositories/userRepository.ts)
- **OrganizationRepository**: [src/apollo/server/repositories/organizationRepository.ts](src/apollo/server/repositories/organizationRepository.ts)

#### GraphQL API
- **Auth Resolvers**: [src/apollo/server/resolvers/authResolver.ts](src/apollo/server/resolvers/authResolver.ts)
  - `register` - 用户注册
  - `login` - 用户登录
  - `refreshToken` - 刷新访问令牌
  - `me` - 获取当前用户信息
  - `changePassword` - 修改密码
  - `requestPasswordReset` - 请求密码重置
  - `resetPassword` - 重置密码

### 3. 前端认证系统

- **登录页面**: [src/pages/login.tsx](src/pages/login.tsx)
- **注册页面**: [src/pages/register.tsx](src/pages/register.tsx)
- **useAuth Hook**: [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)
  - 提供 `login()`, `logout()`, `getAccessToken()`, `getRefreshToken()`
  - 管理认证状态
  - 自动跳转未登录用户

### 4. 类型系统更新

- **IContext 接口**: [src/apollo/server/types/context.ts](src/apollo/server/types/context.ts)
  - 添加 `req` (请求对象)
  - 添加 `knex` (数据库连接)
  - 添加认证字段: `userId`, `email`, `username`, `organizationId`, `isSuperAdmin`

### 5. 配置文件

- **Dockerfile**: [Dockerfile.auth](Dockerfile.auth) - 自定义Docker镜像配置
- **环境变量**: JWT配置已添加到 [docker/.env](docker/.env)
  ```
  JWT_SECRET=wren-ai-super-secret-key-please-change-in-production-2025
  JWT_ACCESS_TOKEN_EXPIRY=15m
  JWT_REFRESH_TOKEN_EXPIRY=7d
  ```

## 🚀 部署方案

### 方案 1: 增加 Docker 内存后构建 (推荐)

由于 Next.js 构建过程需要较多内存,建议:

1. **增加 Docker Desktop 内存**:
   - 打开 Docker Desktop
   - 进入 Settings → Resources → Memory
   - 将内存从默认 2GB 增加到 8GB 或更多
   - 点击 "Apply & Restart"

2. **构建自定义镜像**:
   ```bash
   cd /Users/yuexu/WrenAI/wren-ui
   docker build -f Dockerfile.auth -t wren-ui-auth:latest .
   ```

3. **更新 docker-compose.yaml**:
   ```yaml
   wren-ui:
     image: wren-ui-auth:latest  # 改为使用自定义镜像
     # 其他配置保持不变
   ```

4. **重启服务**:
   ```bash
   cd /Users/yuexu/WrenAI/docker
   docker-compose up -d
   ```

### 方案 2: 本地构建后复制

如果 Docker 内存不足,可以本地构建:

1. **安装依赖并构建**:
   ```bash
   cd /Users/yuexu/WrenAI/wren-ui
   # 如果没有 yarn,先安装: npm install -g yarn
   yarn install
   NODE_OPTIONS="--max-old-space-size=6144" yarn build
   ```

2. **创建轻量级 Dockerfile** (仅复制构建产物)

3. **构建并部署**

### 方案 3: 直接测试 GraphQL API (快速验证)

如果只想快速测试后端功能:

1. **迁移已完成** - 数据库表和初始数据已创建
2. **访问 GraphQL Playground**: http://localhost:3000/api/graphql
3. **使用下面的测试用例**

## 🧪 GraphQL API 测试指南

### 1. 用户注册

```graphql
mutation {
  register(
    email: "admin@wrenai.com"
    username: "admin"
    password: "Admin123456"
    fullName: "系统管理员"
    organizationName: "WrenAI 科技"
  ) {
    user {
      id
      email
      username
      fullName
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

**预期响应**:
```json
{
  "data": {
    "register": {
      "user": {
        "id": 1,
        "email": "admin@wrenai.com",
        "username": "admin",
        "fullName": "系统管理员"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

### 2. 用户登录

```graphql
mutation {
  login(
    email: "admin@wrenai.com"
    password: "Admin123456"
  ) {
    user {
      id
      email
      username
      fullName
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

### 3. 获取当前用户信息 (需要 Authorization header)

**设置 HTTP Headers**:
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

**查询**:
```graphql
query {
  me {
    id
    email
    username
    fullName
    avatarUrl
    createdAt
    updatedAt
  }
}
```

### 4. 修改密码

```graphql
mutation {
  changePassword(
    currentPassword: "Admin123456"
    newPassword: "NewPassword123"
  )
}
```

### 5. 刷新 Token

```graphql
mutation {
  refreshToken(refreshToken: "YOUR_REFRESH_TOKEN_HERE") {
    accessToken
    refreshToken
    expiresIn
  }
}
```

## 📊 数据库初始数据

迁移脚本已自动创建:

### 角色 (3个)
1. **Admin** (管理员) - 所有权限
2. **Editor** (编辑者) - 读写权限
3. **Viewer** (查看者) - 只读权限

### 权限 (33个)

**用户管理**:
- user:create, user:read, user:update, user:delete

**组织管理**:
- org:create, org:read, org:update, org:delete, org:manage_members

**项目管理**:
- project:create, project:read, project:update, project:delete

**模型管理**:
- model:create, model:read, model:update, model:delete

**视图管理**:
- view:create, view:read, view:update, view:delete

**关系管理**:
- relation:create, relation:read, relation:update, relation:delete

**查询管理**:
- query:execute, query:read, query:update, query:delete

**AI服务**:
- ai:ask, ai:read

**看板管理**:
- dashboard:create, dashboard:read, dashboard:update, dashboard:delete

**系统管理**:
- system:admin

## 🔐 安全建议

1. **修改 JWT Secret**: 生产环境必须修改 `JWT_SECRET` 环境变量
2. **HTTPS**: 生产环境启用 HTTPS
3. **密码策略**: 当前要求至少8位,可根据需要调整
4. **Token 过期时间**: 根据安全需求调整 access/refresh token 过期时间
5. **CORS**: 配置适当的 CORS 策略

## 📁 文件清单

### 迁移文件 (9个)
- `migrations/20250124000001_create_users_table.js`
- `migrations/20250124000002_create_organizations_table.js`
- `migrations/20250124000003_create_user_organizations_table.js`
- `migrations/20250124000004_create_roles_table.js`
- `migrations/20250124000005_create_permissions_table.js`
- `migrations/20250124000006_create_role_permissions_table.js`
- `migrations/20250124000007_create_user_organization_roles_table.js`
- `migrations/20250124000008_seed_roles.js`
- `migrations/20250124000009_seed_permissions.js`

### 后端文件 (10个)
- `src/apollo/server/utils/auth.ts`
- `src/apollo/server/middleware/authMiddleware.ts`
- `src/apollo/server/services/userService.ts`
- `src/apollo/server/services/organizationService.ts`
- `src/apollo/server/services/permissionService.ts`
- `src/apollo/server/repositories/userRepository.ts`
- `src/apollo/server/repositories/organizationRepository.ts`
- `src/apollo/server/resolvers/authResolver.ts`
- `src/apollo/server/types/context.ts` (已更新)
- `src/pages/api/graphql.ts` (已更新)

### 前端文件 (3个)
- `src/pages/login.tsx`
- `src/pages/register.tsx`
- `src/hooks/useAuth.tsx`

### 配置文件
- `Dockerfile.auth`
- `docker/.env` (已更新)
- `next.config.js` (已更新)
- `package.json` (已添加依赖)

## ⚠️ 当前状态

✅ **已完成**:
- 所有代码文件已创建
- 数据库迁移已成功运行
- 类型系统已更新
- GraphQL context 已配置

❌ **待完成**:
- Docker 镜像构建 (因内存限制失败)
- 需要增加 Docker 内存或采用替代部署方案

## 🆘 故障排查

### Docker 构建内存不足

**问题**: `ERROR: cannot allocate memory`

**解决方案**:
1. 增加 Docker Desktop 内存到 8GB+
2. 或使用本地构建方式
3. 或在更强大的机器上构建

### 迁移已运行如何重置

```bash
# 进入容器
docker exec -it wrenai-wren-ui-1 /bin/sh

# 回滚所有迁移
yarn knex migrate:rollback --all

# 重新运行迁移
yarn knex migrate:latest
```

## 📞 技术支持

如有问题,请检查:
1. Docker 日志: `docker logs wrenai-wren-ui-1`
2. 数据库连接: 确保 SQLite 文件存在
3. 环境变量: 检查 JWT_SECRET 等配置
4. 依赖包: 确保 jsonwebtoken 和 bcryptjs 已安装

---

**创建时间**: 2025-01-24
**版本**: 1.0
**作者**: Claude Code
