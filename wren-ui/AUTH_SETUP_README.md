# 🔐 User Authentication System - Quick Start

This authentication system has been successfully added to WrenAI! Follow these steps to get started.

## ✅ What's Been Added

### Database Layer
- ✅ 9 migration files for user management
- ✅ Users, Organizations, Roles, Permissions tables
- ✅ Multi-tenancy support
- ✅ Session management

### Backend (Apollo GraphQL)
- ✅ User repository (CRUD operations)
- ✅ Organization repository
- ✅ Auth service (login/register/refresh)
- ✅ Permission service (RBAC logic)
- ✅ JWT utilities
- ✅ Auth middleware
- ✅ GraphQL schema & resolvers

### Frontend (Next.js)
- ✅ Login page (`/login`)
- ✅ Register page (`/register`)
- ✅ Auth context & hooks (`useAuth`)
- ✅ Protected route HOC (`withAuth`)

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
cd /Users/yuexu/WrenAI/wren-ui

# Install new dependencies
yarn add jsonwebtoken bcryptjs
yarn add -D @types/jsonwebtoken @types/bcryptjs
```

### Step 2: Run Migrations

```bash
# Run database migrations to create tables
yarn migrate
```

This will:
- Create all user/auth tables
- Seed default roles (admin, editor, viewer)
- Seed default permissions (34 permissions)

### Step 3: Set Environment Variables

Create or update `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production-please
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

### Step 4: Update Apollo Server

Update `src/apollo/server/index.ts`:

```typescript
import { authMiddleware } from './middleware/authMiddleware';
import { authTypeDefs } from './schema/authSchema';
import { authResolvers } from './resolvers/authResolver';
import merge from 'lodash/merge';

// Add to your type definitions
const typeDefs = [
  // ... existing typeDefs
  authTypeDefs,
];

// Merge resolvers
const resolvers = merge(
  // ... existing resolvers
  authResolvers,
  // ... other resolvers
);

// Update context to include auth middleware
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }) => {
    let ctx = {
      req,
      res,
      knex,
      // ... other context
    };

    // Apply authentication
    ctx = await authMiddleware(ctx);

    return ctx;
  },
});
```

### Step 5: Update _app.tsx

Wrap your app with `AuthProvider` in `src/pages/_app.tsx`:

```typescript
import { AuthProvider } from '../hooks/useAuth';
import { ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Add auth link to Apollo Client
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('wren_access_token')
    : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Update Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default MyApp;
```

## 🎯 Test It Out!

### 1. Start the server

```bash
yarn dev
```

### 2. Open browser

Navigate to:
- Registration: http://localhost:3000/register
- Login: http://localhost:3000/login

### 3. Create first user

Fill in the registration form. This will:
- Create your user account
- Create your organization
- Assign you as admin
- Log you in automatically

### 4. Test GraphQL Playground

Open http://localhost:3000/api/graphql

Try these queries:

```graphql
# Register a user
mutation {
  register(
    email: "admin@wren.ai"
    username: "admin"
    password: "admin123456"
    fullName: "Admin User"
    organizationName: "Wren AI Org"
  ) {
    user {
      id
      email
      username
    }
    accessToken
  }
}

# Login
mutation {
  login(email: "admin@wren.ai", password: "admin123456") {
    user {
      id
      email
    }
    accessToken
    refreshToken
  }
}

# Get current user (requires auth header)
query {
  me {
    id
    email
    username
    organizations {
      name
      roleName
    }
    permissions
  }
}
```

## 🔒 Protect Your Existing Routes

### Example: Protect the home page

```typescript
// src/pages/home/index.tsx
import { withAuth } from '../../hooks/useAuth';

function HomePage() {
  return <div>Welcome to protected home page!</div>;
}

export default withAuth(HomePage);
```

### Example: Check permissions in a resolver

```typescript
import { requirePermission } from '../middleware/authMiddleware';

const resolvers = {
  Mutation: {
    deleteProject: async (_root, args, ctx) => {
      // Require authentication + permission
      await requirePermission(ctx, 'project:delete');

      // Your deletion logic
      return await deleteProject(args.id, ctx);
    },
  },
};
```

## 📋 Default Roles & Permissions

### Admin (Full Access)
- All 34 permissions
- Can manage users and organizations

### Editor (Read-Write)
- Can create, read, update resources
- Can execute queries
- Cannot manage users or delete projects

### Viewer (Read-Only)
- Can view all resources
- Can execute existing queries
- Cannot create or modify anything

## 🎨 Customize the Login Page

The login/register pages are located at:
- `src/pages/login.tsx`
- `src/pages/register.tsx`

Feel free to customize the styling to match your brand!

## 📚 Full Documentation

See [/docs/USER_AUTHENTICATION_GUIDE.md](/Users/yuexu/WrenAI/docs/USER_AUTHENTICATION_GUIDE.md) for:
- Complete API reference
- Permission system details
- User management examples
- Custom role creation
- Multi-tenancy guide
- Troubleshooting

## 🔧 Common Issues

### Issue: Cannot find module 'jsonwebtoken'

```bash
yarn add jsonwebtoken bcryptjs
```

### Issue: Migration fails

Make sure your database is running and accessible:

```bash
# Check database connection
yarn knex migrate:status
```

### Issue: "Authentication required" in GraphQL

Make sure you're sending the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## 🎉 Next Steps

1. **Customize roles** - Create custom roles for your organization
2. **Add password reset** - Implement email-based password reset
3. **Add OAuth** - Integrate Google/GitHub login
4. **Audit logging** - Track user actions
5. **2FA support** - Add two-factor authentication

## 🤝 Need Help?

- Check the [full documentation](/Users/yuexu/WrenAI/docs/USER_AUTHENTICATION_GUIDE.md)
- Review migration files in `/migrations/20251121*`
- Check the auth service implementation in `src/apollo/server/services/authService.ts`

---

**🎊 Congratulations! Your WrenAI now has enterprise-grade user authentication! 🎊**
