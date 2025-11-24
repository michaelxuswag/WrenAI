/**
 * User Management System - Add Organization to Project Table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('project', (table) => {
    table
      .integer('organization_id')
      .unsigned()
      .nullable()
      .comment('Organization ID that owns this project')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .integer('created_by')
      .unsigned()
      .nullable()
      .comment('User ID who created this project')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Add indexes
    table.index('organization_id', 'idx_project_organization_id');
    table.index('created_by', 'idx_project_created_by');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('project', (table) => {
    table.dropIndex('organization_id', 'idx_project_organization_id');
    table.dropIndex('created_by', 'idx_project_created_by');
    table.dropForeign('organization_id');
    table.dropForeign('created_by');
    table.dropColumn('organization_id');
    table.dropColumn('created_by');
  });
};
