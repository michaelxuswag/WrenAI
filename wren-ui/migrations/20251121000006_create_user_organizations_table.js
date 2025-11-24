/**
 * User Management System - User Organizations Junction Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_organizations', (table) => {
    table.increments('id').primary().comment('User Organization ID');
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .comment('User ID')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .integer('organization_id')
      .unsigned()
      .notNullable()
      .comment('Organization ID')
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .integer('role_id')
      .unsigned()
      .notNullable()
      .comment('Role ID in this organization')
      .references('id')
      .inTable('roles')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .boolean('is_default')
      .defaultTo(false)
      .notNullable()
      .comment('Whether this is the user default organization');
    table
      .timestamp('joined_at')
      .defaultTo(knex.fn.now())
      .notNullable()
      .comment('When user joined this organization');
    table.timestamps(true, true);

    // Ensure unique user-organization combination
    table.unique(['user_id', 'organization_id'], 'uq_user_organizations');

    // Add indexes
    table.index('user_id', 'idx_user_organizations_user_id');
    table.index('organization_id', 'idx_user_organizations_org_id');
    table.index('role_id', 'idx_user_organizations_role_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_organizations');
};
