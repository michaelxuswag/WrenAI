/**
 * User Management System - Users Table Migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary().comment('User ID');
    table
      .string('email', 255)
      .notNullable()
      .unique()
      .comment('User email address (unique)');
    table
      .string('username', 100)
      .notNullable()
      .unique()
      .comment('Username (unique)');
    table
      .string('password_hash', 255)
      .notNullable()
      .comment('Bcrypt hashed password');
    table
      .string('full_name', 255)
      .nullable()
      .comment('User full name');
    table
      .string('avatar_url', 500)
      .nullable()
      .comment('User avatar URL');
    table
      .boolean('is_active')
      .defaultTo(true)
      .notNullable()
      .comment('Whether user account is active');
    table
      .boolean('is_super_admin')
      .defaultTo(false)
      .notNullable()
      .comment('Super admin flag (can manage all organizations)');
    table
      .timestamp('last_login_at')
      .nullable()
      .comment('Last login timestamp');
    table
      .string('reset_password_token', 255)
      .nullable()
      .comment('Password reset token');
    table
      .timestamp('reset_password_expires_at')
      .nullable()
      .comment('Password reset token expiration');
    table.timestamps(true, true);

    // Add indexes
    table.index('email', 'idx_users_email');
    table.index('username', 'idx_users_username');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
