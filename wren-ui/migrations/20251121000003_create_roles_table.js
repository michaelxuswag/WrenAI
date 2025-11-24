/**
 * User Management System - Roles Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('roles', (table) => {
    table.increments('id').primary().comment('Role ID');
    table
      .string('name', 100)
      .notNullable()
      .comment('Role name (admin, editor, viewer, custom)');
    table
      .text('description')
      .nullable()
      .comment('Role description');
    table
      .integer('organization_id')
      .unsigned()
      .nullable()
      .comment('Organization ID (null for global/default roles)')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .boolean('is_system_role')
      .defaultTo(false)
      .notNullable()
      .comment('Whether this is a system-defined role (cannot be deleted)');
    table.timestamps(true, true);

    // Ensure unique role names per organization
    table.unique(['name', 'organization_id'], 'uq_roles_name_org');

    // Add indexes
    table.index('organization_id', 'idx_roles_organization_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
