import { IContext } from "../types/context";
import { extractTokenFromHeader, verifyToken } from "../utils/auth";
import PermissionService from "../services/permissionService";

/**
 * Extract and verify JWT token from request headers
 * Adds userId, email, username, organizationId to context
 */
export async function authMiddleware(context: IContext): Promise<IContext> {
  const authHeader = context.req?.headers?.authorization;

  if (!authHeader) {
    return context;
  }

  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return context;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return context;
  }

  // Verify user still exists and is active
  const user = await context
    .knex("users")
    .where({ id: payload.userId, is_active: true })
    .first();

  if (!user) {
    return context;
  }

  // Add auth data to context
  return {
    ...context,
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    organizationId: payload.organizationId,
    isSuperAdmin: payload.isSuperAdmin,
  };
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(ctx: IContext): void {
  if (!ctx.userId) {
    throw new Error("Authentication required");
  }
}

/**
 * Require super admin - throws error if not super admin
 */
export function requireSuperAdmin(ctx: IContext): void {
  requireAuth(ctx);
  if (!ctx.isSuperAdmin) {
    throw new Error("Super admin access required");
  }
}

/**
 * Require organization context - throws error if no organization selected
 */
export function requireOrganization(ctx: IContext): void {
  requireAuth(ctx);
  if (!ctx.organizationId) {
    throw new Error("Organization context required");
  }
}

/**
 * Require specific permission in current organization
 */
export async function requirePermission(
  ctx: IContext,
  permissionCode: string,
): Promise<void> {
  requireOrganization(ctx);

  const permissionService = new PermissionService(ctx.knex);
  const hasPermission = await permissionService.hasPermission(
    ctx.userId!,
    ctx.organizationId!,
    permissionCode,
  );

  if (!hasPermission) {
    throw new Error(`Permission denied: ${permissionCode} required`);
  }
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(
  ctx: IContext,
  permissionCodes: string[],
): Promise<void> {
  requireOrganization(ctx);

  const permissionService = new PermissionService(ctx.knex);
  const hasPermission = await permissionService.hasAnyPermission(
    ctx.userId!,
    ctx.organizationId!,
    permissionCodes,
  );

  if (!hasPermission) {
    throw new Error(
      `Permission denied: one of [${permissionCodes.join(", ")}] required`,
    );
  }
}

/**
 * Require all of the specified permissions
 */
export async function requireAllPermissions(
  ctx: IContext,
  permissionCodes: string[],
): Promise<void> {
  requireOrganization(ctx);

  const permissionService = new PermissionService(ctx.knex);
  const hasPermission = await permissionService.hasAllPermissions(
    ctx.userId!,
    ctx.organizationId!,
    permissionCodes,
  );

  if (!hasPermission) {
    throw new Error(
      `Permission denied: all of [${permissionCodes.join(", ")}] required`,
    );
  }
}

/**
 * Check permission without throwing error
 */
export async function checkPermission(
  ctx: IContext,
  permissionCode: string,
): Promise<boolean> {
  if (!ctx.userId || !ctx.organizationId) {
    return false;
  }

  const permissionService = new PermissionService(ctx.knex);
  return await permissionService.hasPermission(
    ctx.userId,
    ctx.organizationId,
    permissionCode,
  );
}

/**
 * Verify user can access a specific project
 */
export async function requireProjectAccess(
  ctx: IContext,
  projectId: number,
  requiredPermission: string = "project:read",
): Promise<void> {
  requireOrganization(ctx);

  // Get project
  const project = await ctx.knex("project").where({ id: projectId }).first();

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if project belongs to user's organization
  if (project.organization_id !== ctx.organizationId) {
    throw new Error("Project does not belong to your organization");
  }

  // Check permission
  await requirePermission(ctx, requiredPermission);
}
