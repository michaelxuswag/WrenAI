/**
 * User Management System - Permissions Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.increments('id').primary().comment('Permission ID');
    table
      .string('resource', 100)
      .notNullable()
      .comment('Resource type (project, datasource, model, query, thread, view, metric, etc)');
    table
      .string('action', 50)
      .notNullable()
      .comment('Action type (create, read, update, delete, execute, share, export)');
    table
      .text('description')
      .nullable()
      .comment('Permission description');
    table
      .string('code', 150)
      .notNullable()
      .unique()
      .comment('Unique permission code (e.g., project:create, query:execute)');
    table.timestamps(true, true);

    // Ensure unique resource-action combination
    table.unique(['resource', 'action'], 'uq_permissions_resource_action');

    // Add indexes
    table.index('code', 'idx_permissions_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('permissions');
};
