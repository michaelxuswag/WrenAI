# User Authentication & Authorization System Guide

## 🎯 Overview

This document describes the user authentication and authorization system added to WrenAI, including user management, role-based access control (RBAC), and multi-tenancy support.

## 📋 Features

### 1. **User Authentication**
- ✅ User registration with email/username/password
- ✅ User login with JWT tokens
- ✅ Access token (15 minutes) + Refresh token (7 days)
- ✅ Password encryption with bcrypt
- ✅ Session management
- ✅ Logout functionality

### 2. **Authorization (RBAC)**
- ✅ Role-based access control
- ✅ Three default roles: Admin, Editor, Viewer
- ✅ Custom role creation
- ✅ Granular permissions system
- ✅ Permission checking middleware

### 3. **Multi-Tenancy**
- ✅ Organization/Workspace support
- ✅ Data isolation per organization
- ✅ Users can belong to multiple organizations
- ✅ Project scoped to organizations

## 🗄️ Database Schema

### Core Tables

#### `users`
- User accounts with authentication credentials
- Fields: email, username, password_hash, full_name, avatar_url, is_active, is_super_admin

#### `organizations`
- Workspaces/teams for grouping users and projects
- Fields: name, slug, description, logo_url, created_by, settings

#### `roles`
- Define user roles within organizations
- System roles: admin, editor, viewer
- Custom roles can be created per organization

#### `permissions`
- Granular permission definitions
- Format: `resource:action` (e.g., `project:create`, `query:execute`)

#### `user_organizations`
- Junction table linking users to organizations with roles
- Users can have different roles in different organizations

#### `role_permissions`
- Junction table assigning permissions to roles

#### `sessions`
- Track active user sessions and refresh tokens

## 🔑 Permission System

### Permission Format

Permissions follow the pattern: `resource:action`

**Resources**: project, datasource, model, query, thread, metric, view, organization, user

**Actions**: create, read, update, delete, execute, export, invite, remove

### Default Permissions by Role

#### **Admin Role**
- Full access to all resources
- Can manage users and organization settings
- All permissions granted

#### **Editor Role**
- Can create, edit, and execute queries
- Can manage projects, models, metrics, views
- Cannot manage users or organization settings

Permissions:
```
project:create, project:read, project:update
datasource:create, datasource:read, datasource:update
model:create, model:read, model:update
query:create, query:read, query:execute, query:export
thread:create, thread:read, thread:delete
metric:create, metric:read, metric:update
view:create, view:read, view:update
organization:read
```

#### **Viewer Role**
- Read-only access
- Can execute existing queries
- Cannot create or modify resources

Permissions:
```
project:read
datasource:read
model:read
query:read, query:execute
thread:read
metric:read
view:read
organization:read
```

## 🚀 Setup Instructions

### 1. Run Database Migrations

```bash
cd wren-ui
yarn migrate
```

This will create all necessary tables and seed default roles/permissions.

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

**⚠️ IMPORTANT**: Change the JWT_SECRET in production!

### 3. Update Apollo Server Context

Update [src/apollo/server/index.ts](../wren-ui/src/apollo/server/index.ts) to include auth middleware:

```typescript
import { authMiddleware } from './middleware/authMiddleware';

const server = new ApolloServer({
  // ... existing config
  context: async ({ req, res }) => {
    let ctx = {
      req,
      res,
      knex,
      // ... other context
    };

    // Apply auth middleware
    ctx = await authMiddleware(ctx);

    return ctx;
  },
});
```

### 4. Update GraphQL Schema

Merge auth schema with existing schema:

```typescript
import { authTypeDefs } from './schema/authSchema';
import { authResolvers } from './resolvers/authResolver';

const typeDefs = [
  // ... existing type defs
  authTypeDefs,
];

const resolvers = merge(
  // ... existing resolvers
  authResolvers
);
```

### 5. Wrap App with AuthProvider

Update [src/pages/_app.tsx](../wren-ui/src/pages/_app.tsx):

```typescript
import { AuthProvider } from '../hooks/useAuth';

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ApolloProvider>
  );
}
```

### 6. Add Apollo Client Auth Link

Configure Apollo Client to include JWT token:

```typescript
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('wren_access_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

## 📝 Usage Examples

### User Registration

```graphql
mutation Register {
  register(
    email: "user@example.com"
    username: "johndoe"
    password: "SecurePassword123"
    fullName: "John Doe"
    organizationName: "Acme Corp"
  ) {
    user {
      id
      email
      username
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

### User Login

```graphql
mutation Login {
  login(
    email: "user@example.com"
    password: "SecurePassword123"
  ) {
    user {
      id
      email
      username
    }
    accessToken
    refreshToken
    expiresIn
  }
}
```

### Get Current User

```graphql
query Me {
  me {
    id
    email
    username
    fullName
    organizations {
      id
      name
      slug
      isDefault
      roleName
    }
    permissions
  }
}
```

### Check Permissions

```graphql
query MyPermissions {
  myPermissions {
    permissions
    role {
      id
      name
      description
    }
  }
}
```

## 🔒 Protecting Resolvers

### Using Middleware Functions

```typescript
import { requireAuth, requirePermission } from '../middleware/authMiddleware';

const resolvers = {
  Query: {
    projects: async (_root, _args, ctx) => {
      // Require authentication
      requireAuth(ctx);

      // Require specific permission
      await requirePermission(ctx, 'project:read');

      // Fetch projects for user's organization
      return await ctx.knex('project')
        .where({ organization_id: ctx.organizationId });
    },
  },

  Mutation: {
    createProject: async (_root, args, ctx) => {
      // Require create permission
      await requirePermission(ctx, 'project:create');

      // Create project
      return await createProject(args, ctx);
    },
  },
};
```

### Checking Multiple Permissions

```typescript
// Require ANY of the permissions
await requireAnyPermission(ctx, ['project:update', 'project:delete']);

// Require ALL of the permissions
await requireAllPermissions(ctx, ['project:read', 'datasource:read']);
```

## 👥 User Management (Admin Only)

### Invite User to Organization

```graphql
mutation InviteUser {
  inviteUser(
    organizationId: 1
    email: "newuser@example.com"
    roleId: 2  # Editor role
  ) {
    success
    message
  }
}
```

### Update User Role

```graphql
mutation UpdateUserRole {
  updateUserRole(
    userId: 5
    organizationId: 1
    roleId: 1  # Promote to Admin
  ) {
    success
  }
}
```

### List Organization Users

```graphql
query OrganizationUsers {
  organizationUsers(organizationId: 1) {
    id
    email
    username
    fullName
    roleName
    joinedAt
    lastLoginAt
  }
}
```

## 🎭 Custom Roles

### Create Custom Role

```graphql
mutation CreateCustomRole {
  createCustomRole(
    organizationId: 1
    name: "Data Analyst"
    description: "Can read and execute queries"
    permissionIds: [5, 6, 13, 14]  # IDs of specific permissions
  ) {
    id
    name
    permissions {
      code
      description
    }
  }
}
```

### Update Role Permissions

```graphql
mutation UpdateRolePermissions {
  updateRolePermissions(
    roleId: 5
    permissionIds: [1, 2, 3, 4, 5]
  ) {
    success
  }
}
```

## 🔐 Frontend Implementation

### Protected Routes

```typescript
import { withAuth } from '../hooks/useAuth';

function DashboardPage() {
  return <div>Protected Dashboard</div>;
}

export default withAuth(DashboardPage);
```

### Check Permission in UI

```typescript
import { useQuery, gql } from '@apollo/client';

const MY_PERMISSIONS = gql`
  query MyPermissions {
    myPermissions {
      permissions
    }
  }
`;

function ProjectActions() {
  const { data } = useQuery(MY_PERMISSIONS);
  const permissions = data?.myPermissions?.permissions || [];

  const canCreate = permissions.includes('project:create');
  const canDelete = permissions.includes('project:delete');

  return (
    <div>
      {canCreate && <Button>Create Project</Button>}
      {canDelete && <Button danger>Delete Project</Button>}
    </div>
  );
}
```

## 🔄 Token Refresh Flow

When access token expires:

```typescript
import { useMutation, gql } from '@apollo/client';

const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      expiresIn
    }
  }
`;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('wren_refresh_token');

  const { data } = await refreshTokenMutation({
    variables: { refreshToken },
  });

  if (data?.refreshToken) {
    localStorage.setItem('wren_access_token', data.refreshToken.accessToken);
    localStorage.setItem('wren_refresh_token', data.refreshToken.refreshToken);
  }
}
```

## 🧪 Testing

### Test User Registration & Login

1. Navigate to `http://localhost:3000/register`
2. Fill in the registration form
3. Upon success, you'll be logged in automatically
4. Check that you can access protected routes

### Test Permissions

1. Login as an admin user
2. Create a new organization
3. Invite a user with "Viewer" role
4. Login as the viewer user
5. Verify they cannot create/edit resources

## 📊 Migration to Existing Projects

If you have existing projects without organization_id:

```sql
-- Create a default organization for migration
INSERT INTO organizations (name, slug, created_by, is_active)
VALUES ('Default Organization', 'default-org', 1, true);

-- Update existing projects to belong to default organization
UPDATE project
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-org' LIMIT 1)
WHERE organization_id IS NULL;
```

## 🔍 Troubleshooting

### Issue: "Authentication required" error

**Solution**: Make sure JWT token is included in Authorization header:
```
Authorization: Bearer <your-access-token>
```

### Issue: "Permission denied" error

**Solution**: Check user's role and permissions:
```graphql
query {
  myPermissions {
    permissions
    role { name }
  }
}
```

### Issue: Token expired

**Solution**: Use refresh token to get new access token

## 🎓 Best Practices

1. **Always check permissions** in resolvers, not just in UI
2. **Use organization context** for data isolation
3. **Rotate JWT secrets** regularly in production
4. **Log authentication events** for security auditing
5. **Implement rate limiting** on login endpoint
6. **Use HTTPS** in production
7. **Set secure cookie flags** if using cookies

## 📚 Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RBAC Design Patterns](https://en.wikipedia.org/wiki/Role-based_access_control)

## 🤝 Contributing

To add new permissions:

1. Add to migration file: `migrations/20251121000009_seed_default_roles_and_permissions.js`
2. Assign to appropriate roles in the same migration
3. Update this documentation with the new permission

---

**Created**: 2025-11-21
**Version**: 1.0.0
**Status**: Ready for Testing
