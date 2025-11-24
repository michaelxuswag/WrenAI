/**
 * User Management System - Sessions Table Migration (for JWT token management)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('sessions', (table) => {
    table.increments('id').primary().comment('Session ID');
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
      .string('token', 500)
      .notNullable()
      .unique()
      .comment('JWT refresh token');
    table
      .string('ip_address', 45)
      .nullable()
      .comment('IP address of the session');
    table
      .string('user_agent', 500)
      .nullable()
      .comment('User agent string');
    table
      .timestamp('expires_at')
      .notNullable()
      .comment('Token expiration timestamp');
    table
      .boolean('is_revoked')
      .defaultTo(false)
      .notNullable()
      .comment('Whether this session has been revoked');
    table.timestamps(true, true);

    // Add indexes
    table.index('user_id', 'idx_sessions_user_id');
    table.index('token', 'idx_sessions_token');
    table.index('expires_at', 'idx_sessions_expires_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
