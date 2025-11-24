/**
 * User Management System - Role Permissions Junction Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table.increments('id').primary().comment('Role Permission ID');
    table
      .integer('role_id')
      .unsigned()
      .notNullable()
      .comment('Role ID')
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .integer('permission_id')
      .unsigned()
      .notNullable()
      .comment('Permission ID')
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamps(true, true);

    // Ensure unique role-permission combination
    table.unique(['role_id', 'permission_id'], 'uq_role_permissions');

    // Add indexes
    table.index('role_id', 'idx_role_permissions_role_id');
    table.index('permission_id', 'idx_role_permissions_permission_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('role_permissions');
};
