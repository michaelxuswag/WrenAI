import { Knex } from "knex";

export interface IPermission {
  id: number;
  resource: string;
  action: string;
  code: string;
  description?: string;
}

export interface IRole {
  id: number;
  name: string;
  description?: string;
  organizationId?: number;
  isSystemRole: boolean;
  permissions?: IPermission[];
}

export interface IUserPermissions {
  userId: number;
  organizationId: number;
  roleId: number;
  roleName: string;
  permissions: string[]; // Array of permission codes
}

export default class PermissionService {
  constructor(private knex: Knex) {}

  /**
   * Get all permissions for a user in a specific organization
   */
  public async getUserPermissions(
    userId: number,
    organizationId: number,
  ): Promise<IUserPermissions | null> {
    // Get user's role in the organization
    const userOrg = await this.knex("user_organizations")
      .where({
        user_id: userId,
        organization_id: organizationId,
      })
      .first();

    if (!userOrg) {
      return null;
    }

    // Get role details
    const role = await this.knex("roles")
      .where({ id: userOrg.role_id })
      .first();

    if (!role) {
      return null;
    }

    // Get all permissions for this role
    const permissions = await this.knex("permissions")
      .join(
        "role_permissions",
        "permissions.id",
        "role_permissions.permission_id",
      )
      .where("role_permissions.role_id", role.id)
      .select("permissions.code");

    return {
      userId,
      organizationId,
      roleId: role.id,
      roleName: role.name,
      permissions: permissions.map((p) => p.code),
    };
  }

  /**
   * Check if user has a specific permission in an organization
   */
  public async hasPermission(
    userId: number,
    organizationId: number,
    permissionCode: string,
  ): Promise<boolean> {
    // Super admins have all permissions
    const user = await this.knex("users").where({ id: userId }).first();
    if (user?.is_super_admin) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    );
    if (!userPermissions) {
      return false;
    }

    return userPermissions.permissions.includes(permissionCode);
  }

  /**
   * Check if user has any of the specified permissions
   */
  public async hasAnyPermission(
    userId: number,
    organizationId: number,
    permissionCodes: string[],
  ): Promise<boolean> {
    // Super admins have all permissions
    const user = await this.knex("users").where({ id: userId }).first();
    if (user?.is_super_admin) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    );
    if (!userPermissions) {
      return false;
    }

    return permissionCodes.some((code) =>
      userPermissions.permissions.includes(code),
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  public async hasAllPermissions(
    userId: number,
    organizationId: number,
    permissionCodes: string[],
  ): Promise<boolean> {
    // Super admins have all permissions
    const user = await this.knex("users").where({ id: userId }).first();
    if (user?.is_super_admin) {
      return true;
    }

    const userPermissions = await this.getUserPermissions(
      userId,
      organizationId,
    );
    if (!userPermissions) {
      return false;
    }

    return permissionCodes.every((code) =>
      userPermissions.permissions.includes(code),
    );
  }

  /**
   * Get all available permissions
   */
  public async getAllPermissions(): Promise<IPermission[]> {
    return await this.knex("permissions")
      .select("*")
      .orderBy("resource", "action");
  }

  /**
   * Get role by ID
   */
  public async getRoleById(roleId: number): Promise<IRole | null> {
    const role = await this.knex("roles").where({ id: roleId }).first();
    if (!role) {
      return null;
    }

    const permissions = await this.knex("permissions")
      .join(
        "role_permissions",
        "permissions.id",
        "role_permissions.permission_id",
      )
      .where("role_permissions.role_id", roleId)
      .select("permissions.*");

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      organizationId: role.organization_id,
      isSystemRole: role.is_system_role,
      permissions,
    };
  }

  /**
   * Get all roles for an organization (including system roles)
   */
  public async getOrganizationRoles(organizationId: number): Promise<IRole[]> {
    const roles = await this.knex("roles")
      .where({ organization_id: organizationId })
      .orWhere({ is_system_role: true })
      .select("*")
      .orderBy("is_system_role", "desc")
      .orderBy("name");

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await this.knex("permissions")
          .join(
            "role_permissions",
            "permissions.id",
            "role_permissions.permission_id",
          )
          .where("role_permissions.role_id", role.id)
          .select("permissions.*");

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          organizationId: role.organization_id,
          isSystemRole: role.is_system_role,
          permissions,
        };
      }),
    );

    return rolesWithPermissions;
  }

  /**
   * Assign role to user in an organization
   */
  public async assignRoleToUser(
    userId: number,
    organizationId: number,
    roleId: number,
  ): Promise<void> {
    // Check if user is already in the organization
    const existingUserOrg = await this.knex("user_organizations")
      .where({
        user_id: userId,
        organization_id: organizationId,
      })
      .first();

    if (existingUserOrg) {
      // Update existing role
      await this.knex("user_organizations")
        .where({
          user_id: userId,
          organization_id: organizationId,
        })
        .update({ role_id: roleId });
    } else {
      // Add new user to organization
      await this.knex("user_organizations").insert({
        user_id: userId,
        organization_id: organizationId,
        role_id: roleId,
        is_default: false,
      });
    }
  }

  /**
   * Remove user from organization
   */
  public async removeUserFromOrganization(
    userId: number,
    organizationId: number,
  ): Promise<void> {
    await this.knex("user_organizations")
      .where({
        user_id: userId,
        organization_id: organizationId,
      })
      .delete();
  }

  /**
   * Create a custom role for an organization
   */
  public async createCustomRole(
    organizationId: number,
    name: string,
    description: string,
    permissionIds: number[],
  ): Promise<IRole> {
    return await this.knex.transaction(async (trx) => {
      // Create role
      const [role] = await trx("roles")
        .insert({
          name,
          description,
          organization_id: organizationId,
          is_system_role: false,
        })
        .returning("*");

      // Assign permissions to role
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          role_id: role.id,
          permission_id: permissionId,
        }));

        await trx("role_permissions").insert(rolePermissions);
      }

      // Fetch permissions
      const permissions = await trx("permissions")
        .join(
          "role_permissions",
          "permissions.id",
          "role_permissions.permission_id",
        )
        .where("role_permissions.role_id", role.id)
        .select("permissions.*");

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        organizationId: role.organization_id,
        isSystemRole: role.is_system_role,
        permissions,
      };
    });
  }

  /**
   * Update custom role permissions
   */
  public async updateRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    await this.knex.transaction(async (trx) => {
      // Remove existing permissions
      await trx("role_permissions").where({ role_id: roleId }).delete();

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          role_id: roleId,
          permission_id: permissionId,
        }));

        await trx("role_permissions").insert(rolePermissions);
      }
    });
  }

  /**
   * Delete a custom role (system roles cannot be deleted)
   */
  public async deleteRole(roleId: number): Promise<void> {
    const role = await this.knex("roles").where({ id: roleId }).first();

    if (role?.is_system_role) {
      throw new Error("Cannot delete system roles");
    }

    // Check if role is in use
    const usersWithRole = await this.knex("user_organizations")
      .where({ role_id: roleId })
      .count("* as count")
      .first();

    if (Number(usersWithRole?.count) > 0) {
      throw new Error("Cannot delete role that is assigned to users");
    }

    await this.knex("roles").where({ id: roleId }).delete();
  }

  /**
   * Get all users in an organization with their roles
   */
  public async getOrganizationUsers(organizationId: number) {
    return await this.knex("users")
      .join("user_organizations", "users.id", "user_organizations.user_id")
      .join("roles", "user_organizations.role_id", "roles.id")
      .where("user_organizations.organization_id", organizationId)
      .select(
        "users.id",
        "users.email",
        "users.username",
        "users.full_name",
        "users.avatar_url",
        "users.is_active",
        "users.last_login_at",
        "roles.id as role_id",
        "roles.name as role_name",
        "user_organizations.joined_at",
        "user_organizations.is_default",
      )
      .orderBy("user_organizations.joined_at", "desc");
  }
}
