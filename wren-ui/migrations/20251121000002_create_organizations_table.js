/**
 * User Management System - Organizations Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('organizations', (table) => {
    table.increments('id').primary().comment('Organization ID');
    table
      .string('name', 255)
      .notNullable()
      .comment('Organization name');
    table
      .string('slug', 100)
      .notNullable()
      .unique()
      .comment('URL-friendly organization identifier (unique)');
    table
      .text('description')
      .nullable()
      .comment('Organization description');
    table
      .string('logo_url', 500)
      .nullable()
      .comment('Organization logo URL');
    table
      .boolean('is_active')
      .defaultTo(true)
      .notNullable()
      .comment('Whether organization is active');
    table
      .integer('created_by')
      .unsigned()
      .notNullable()
      .comment('User ID who created this organization')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .jsonb('settings')
      .nullable()
      .comment('Organization-specific settings (JSON)');
    table.timestamps(true, true);

    // Add indexes
    table.index('slug', 'idx_organizations_slug');
    table.index('created_by', 'idx_organizations_created_by');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('organizations');
};
