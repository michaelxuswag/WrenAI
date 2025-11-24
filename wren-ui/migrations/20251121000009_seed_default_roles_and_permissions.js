/**
 * User Management System - Seed Default Roles and Permissions
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert default permissions
  const permissions = [
    // Project permissions
    { resource: 'project', action: 'create', code: 'project:create', description: 'Create new projects' },
    { resource: 'project', action: 'read', code: 'project:read', description: 'View projects' },
    { resource: 'project', action: 'update', code: 'project:update', description: 'Edit project settings' },
    { resource: 'project', action: 'delete', code: 'project:delete', description: 'Delete projects' },

    // Data source permissions
    { resource: 'datasource', action: 'create', code: 'datasource:create', description: 'Add data sources' },
    { resource: 'datasource', action: 'read', code: 'datasource:read', description: 'View data sources' },
    { resource: 'datasource', action: 'update', code: 'datasource:update', description: 'Edit data sources' },
    { resource: 'datasource', action: 'delete', code: 'datasource:delete', description: 'Remove data sources' },

    // Model permissions
    { resource: 'model', action: 'create', code: 'model:create', description: 'Create models' },
    { resource: 'model', action: 'read', code: 'model:read', description: 'View models' },
    { resource: 'model', action: 'update', code: 'model:update', description: 'Edit models' },
    { resource: 'model', action: 'delete', code: 'model:delete', description: 'Delete models' },

    // Query permissions
    { resource: 'query', action: 'create', code: 'query:create', description: 'Create queries' },
    { resource: 'query', action: 'read', code: 'query:read', description: 'View query results' },
    { resource: 'query', action: 'execute', code: 'query:execute', description: 'Execute queries' },
    { resource: 'query', action: 'export', code: 'query:export', description: 'Export query results' },

    // Thread/Chat permissions
    { resource: 'thread', action: 'create', code: 'thread:create', description: 'Create chat threads' },
    { resource: 'thread', action: 'read', code: 'thread:read', description: 'View chat threads' },
    { resource: 'thread', action: 'delete', code: 'thread:delete', description: 'Delete chat threads' },

    // Metric permissions
    { resource: 'metric', action: 'create', code: 'metric:create', description: 'Create metrics' },
    { resource: 'metric', action: 'read', code: 'metric:read', description: 'View metrics' },
    { resource: 'metric', action: 'update', code: 'metric:update', description: 'Edit metrics' },
    { resource: 'metric', action: 'delete', code: 'metric:delete', description: 'Delete metrics' },

    // View permissions
    { resource: 'view', action: 'create', code: 'view:create', description: 'Create views' },
    { resource: 'view', action: 'read', code: 'view:read', description: 'View saved views' },
    { resource: 'view', action: 'update', code: 'view:update', description: 'Edit views' },
    { resource: 'view', action: 'delete', code: 'view:delete', description: 'Delete views' },

    // Organization/User management permissions
    { resource: 'organization', action: 'read', code: 'organization:read', description: 'View organization settings' },
    { resource: 'organization', action: 'update', code: 'organization:update', description: 'Edit organization settings' },
    { resource: 'user', action: 'invite', code: 'user:invite', description: 'Invite users to organization' },
    { resource: 'user', action: 'read', code: 'user:read', description: 'View users in organization' },
    { resource: 'user', action: 'update', code: 'user:update', description: 'Edit user roles' },
    { resource: 'user', action: 'remove', code: 'user:remove', description: 'Remove users from organization' },
  ];

  await knex('permissions').insert(permissions);

  // Insert default system roles (organization_id = null means global/system roles)
  const roles = [
    {
      name: 'admin',
      description: 'Full access to all resources in the organization',
      is_system_role: true,
      organization_id: null,
    },
    {
      name: 'editor',
      description: 'Can create, edit, and execute queries, but cannot manage users or organization settings',
      is_system_role: true,
      organization_id: null,
    },
    {
      name: 'viewer',
      description: 'Read-only access to projects, models, and queries',
      is_system_role: true,
      organization_id: null,
    },
  ];

  const roleIds = await knex('roles').insert(roles).returning('id');

  // Get permission IDs
  const allPermissions = await knex('permissions').select('id', 'code');
  const permissionMap = Object.fromEntries(allPermissions.map(p => [p.code, p.id]));

  // Admin role - all permissions
  const adminPermissions = allPermissions.map(p => ({
    role_id: roleIds[0].id || roleIds[0],
    permission_id: p.id,
  }));

  // Editor role - most permissions except user/org management
  const editorPermissionCodes = [
    'project:create', 'project:read', 'project:update',
    'datasource:create', 'datasource:read', 'datasource:update',
    'model:create', 'model:read', 'model:update',
    'query:create', 'query:read', 'query:execute', 'query:export',
    'thread:create', 'thread:read', 'thread:delete',
    'metric:create', 'metric:read', 'metric:update',
    'view:create', 'view:read', 'view:update',
    'organization:read',
  ];
  const editorPermissions = editorPermissionCodes.map(code => ({
    role_id: roleIds[1].id || roleIds[1],
    permission_id: permissionMap[code],
  }));

  // Viewer role - read-only permissions
  const viewerPermissionCodes = [
    'project:read',
    'datasource:read',
    'model:read',
    'query:read', 'query:execute',
    'thread:read',
    'metric:read',
    'view:read',
    'organization:read',
  ];
  const viewerPermissions = viewerPermissionCodes.map(code => ({
    role_id: roleIds[2].id || roleIds[2],
    permission_id: permissionMap[code],
  }));

  await knex('role_permissions').insert([
    ...adminPermissions,
    ...editorPermissions,
    ...viewerPermissions,
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('role_permissions').del();
  await knex('roles').where('is_system_role', true).del();
  await knex('permissions').del();
};
