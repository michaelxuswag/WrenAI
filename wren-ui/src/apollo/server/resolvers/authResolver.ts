import { IContext } from "../types/context";
import AuthService from "../services/authService";
import PermissionService from "../services/permissionService";

export const authResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_root: any, _args: any, ctx: IContext) => {
      if (!ctx.userId) {
        throw new Error("Not authenticated");
      }

      const user = await ctx.knex("users").where({ id: ctx.userId }).first();

      if (!user) {
        throw new Error("User not found");
      }

      // Get user's organizations
      const organizations = await ctx
        .knex("organizations")
        .join(
          "user_organizations",
          "organizations.id",
          "user_organizations.organization_id",
        )
        .where("user_organizations.user_id", ctx.userId)
        .select(
          "organizations.*",
          "user_organizations.is_default",
          "user_organizations.role_id",
        );

      // Get current organization permissions
      let permissions: string[] = [];
      if (ctx.organizationId) {
        const permissionService = new PermissionService(ctx.knex);
        const userPermissions = await permissionService.getUserPermissions(
          ctx.userId,
          ctx.organizationId,
        );
        permissions = userPermissions?.permissions || [];
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        isSuperAdmin: user.is_super_admin,
        lastLoginAt: user.last_login_at,
        organizations,
        permissions,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    },

    // Get user permissions in current organization
    myPermissions: async (_root: any, _args: any, ctx: IContext) => {
      if (!ctx.userId || !ctx.organizationId) {
        throw new Error("Not authenticated or no organization selected");
      }

      const permissionService = new PermissionService(ctx.knex);
      const userPermissions = await permissionService.getUserPermissions(
        ctx.userId,
        ctx.organizationId,
      );

      if (!userPermissions) {
        return { permissions: [], role: null };
      }

      const role = await ctx
        .knex("roles")
        .where({ id: userPermissions.roleId })
        .first();

      return {
        permissions: userPermissions.permissions,
        role: role
          ? {
              id: role.id,
              name: role.name,
              description: role.description,
            }
          : null,
      };
    },
  },

  Mutation: {
    // User login
    login: async (
      _root: any,
      args: { email: string; password: string; organizationId?: number },
      ctx: IContext,
    ) => {
      const authService = new AuthService(ctx.knex);
      const result = await authService.login({
        email: args.email,
        password: args.password,
        organizationId: args.organizationId,
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          fullName: result.user.fullName,
          avatarUrl: result.user.avatarUrl,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      };
    },

    // User registration
    register: async (
      _root: any,
      args: {
        email: string;
        username: string;
        password: string;
        fullName?: string;
        organizationName?: string;
      },
      ctx: IContext,
    ) => {
      const authService = new AuthService(ctx.knex);
      const result = await authService.register({
        email: args.email,
        username: args.username,
        password: args.password,
        fullName: args.fullName,
        organizationName: args.organizationName,
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          fullName: result.user.fullName,
          avatarUrl: result.user.avatarUrl,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
      };
    },

    // Refresh access token
    refreshToken: async (
      _root: any,
      args: { refreshToken: string },
      ctx: IContext,
    ) => {
      const authService = new AuthService(ctx.knex);
      const tokens = await authService.refreshToken(args.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    },

    // User logout
    logout: async (
      _root: any,
      args: { refreshToken: string },
      ctx: IContext,
    ) => {
      const authService = new AuthService(ctx.knex);
      await authService.logout(args.refreshToken);
      return { success: true };
    },

    // Change password
    changePassword: async (
      _root: any,
      args: { currentPassword: string; newPassword: string },
      ctx: IContext,
    ) => {
      if (!ctx.userId) {
        throw new Error("Not authenticated");
      }

      const authService = new AuthService(ctx.knex);
      const userRepo = (authService as any).userRepository;

      // Verify current password
      const isValid = await userRepo.verifyPassword(
        ctx.userId,
        args.currentPassword,
      );
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      await userRepo.updatePassword(ctx.userId, args.newPassword);

      return { success: true };
    },
  },
};
