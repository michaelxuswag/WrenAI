import { Knex } from "knex";
import * as bcrypt from "bcryptjs";

export interface IUser {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserInput {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
}

export interface IUpdateUserInput {
  email?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export default class UserRepository {
  constructor(private knex: Knex) {}

  private toEntity(row: any): IUser {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      isSuperAdmin: row.is_super_admin,
      lastLoginAt: row.last_login_at,
      resetPasswordToken: row.reset_password_token,
      resetPasswordExpiresAt: row.reset_password_expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public async createUser(input: ICreateUserInput): Promise<IUser> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const [row] = await this.knex("users")
      .insert({
        email: input.email,
        username: input.username,
        password_hash: passwordHash,
        full_name: input.fullName,
        avatar_url: input.avatarUrl,
        is_super_admin: input.isSuperAdmin || false,
        is_active: true,
      })
      .returning("*");

    return this.toEntity(row);
  }

  public async findUserById(id: number): Promise<IUser | null> {
    const row = await this.knex("users").where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  public async findUserByEmail(email: string): Promise<IUser | null> {
    const row = await this.knex("users").where({ email }).first();
    return row ? this.toEntity(row) : null;
  }

  public async findUserByUsername(username: string): Promise<IUser | null> {
    const row = await this.knex("users").where({ username }).first();
    return row ? this.toEntity(row) : null;
  }

  public async updateUser(id: number, input: IUpdateUserInput): Promise<IUser> {
    const updateData: any = {};
    if (input.email !== undefined) updateData.email = input.email;
    if (input.username !== undefined) updateData.username = input.username;
    if (input.fullName !== undefined) updateData.full_name = input.fullName;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const [row] = await this.knex("users")
      .where({ id })
      .update(updateData)
      .returning("*");

    return this.toEntity(row);
  }

  public async updatePassword(id: number, newPassword: string): Promise<void> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.knex("users")
      .where({ id })
      .update({ password_hash: passwordHash });
  }

  public async verifyPassword(
    userId: number,
    password: string,
  ): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  public async updateLastLogin(id: number): Promise<void> {
    await this.knex("users")
      .where({ id })
      .update({ last_login_at: this.knex.fn.now() });
  }

  public async setResetPasswordToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.knex("users").where({ email }).update({
      reset_password_token: token,
      reset_password_expires_at: expiresAt,
    });
  }

  public async clearResetPasswordToken(email: string): Promise<void> {
    await this.knex("users").where({ email }).update({
      reset_password_token: null,
      reset_password_expires_at: null,
    });
  }

  public async deleteUser(id: number): Promise<void> {
    await this.knex("users").where({ id }).delete();
  }

  public async listUsers(options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }): Promise<{ users: IUser[]; total: number }> {
    let query = this.knex("users");

    if (options?.isActive !== undefined) {
      query = query.where({ is_active: options.isActive });
    }

    const [{ count }] = await query.clone().count("* as count");
    const total = Number(count);

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query.select("*");
    const users = rows.map(this.toEntity);

    return { users, total };
  }
}
