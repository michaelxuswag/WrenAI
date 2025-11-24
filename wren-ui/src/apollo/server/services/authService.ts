import { Knex } from "knex";
import UserRepository, { IUser } from "../repositories/userRepository";
import OrganizationRepository from "../repositories/organizationRepository";
import {
  generateTokenPair,
  verifyToken,
  ITokenPair,
  IJWTPayload,
} from "../utils/auth";
import * as bcrypt from "bcryptjs";

export interface ILoginInput {
  email: string;
  password: string;
  organizationId?: number;
}

export interface IRegisterInput {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  organizationName?: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: ITokenPair;
}

export interface IAuthContext {
  userId?: number;
  email?: string;
  username?: string;
  organizationId?: number;
  isSuperAdmin?: boolean;
}

export default class AuthService {
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor(private knex: Knex) {
    this.userRepository = new UserRepository(knex);
    this.organizationRepository = new OrganizationRepository(knex);
  }

  /**
   * User login
   */
  public async login(input: ILoginInput): Promise<IAuthResponse> {
    // Find user by email
    const user = await this.userRepository.findUserByEmail(input.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("User account is inactive");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Get user's default organization if not specified
    let organizationId = input.organizationId;
    if (!organizationId && !user.isSuperAdmin) {
      const userOrgs = await this.knex("user_organizations")
        .where({ user_id: user.id })
        .orderBy("is_default", "desc")
        .first();

      if (userOrgs) {
        organizationId = userOrgs.organization_id;
      }
    }

    // Generate tokens
    const payload: IJWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      organizationId,
      isSuperAdmin: user.isSuperAdmin,
    };
    const tokens = generateTokenPair(payload);

    // Save refresh token to sessions table
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.knex("sessions").insert({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    return { user, tokens };
  }

  /**
   * User registration with automatic organization creation
   */
  public async register(input: IRegisterInput): Promise<IAuthResponse> {
    // Check if email already exists
    const existingUser = await this.userRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findUserByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Use transaction to ensure atomicity
    return await this.knex.transaction(async (trx) => {
      // Create user
      const userRepo = new UserRepository(trx);
      const user = await userRepo.createUser({
        email: input.email,
        username: input.username,
        password: input.password,
        fullName: input.fullName,
      });

      // Create organization
      const orgRepo = new OrganizationRepository(trx);
      const orgName =
        input.organizationName || `${input.username}'s Organization`;
      const orgSlug = this.generateSlug(orgName);

      const organization = await orgRepo.createOrganization({
        name: orgName,
        slug: orgSlug,
        createdBy: user.id,
      });

      // Get admin role
      const adminRole = await trx("roles")
        .where({ name: "admin", is_system_role: true })
        .first();

      if (!adminRole) {
        throw new Error("Admin role not found. Please run migrations.");
      }

      // Add user to organization with admin role
      await trx("user_organizations").insert({
        user_id: user.id,
        organization_id: organization.id,
        role_id: adminRole.id,
        is_default: true,
      });

      // Generate tokens
      const payload: IJWTPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        organizationId: organization.id,
        isSuperAdmin: user.isSuperAdmin,
      };
      const tokens = generateTokenPair(payload);

      // Save refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await trx("sessions").insert({
        user_id: user.id,
        token: tokens.refreshToken,
        expires_at: expiresAt,
      });

      return { user, tokens };
    });
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<ITokenPair> {
    // Verify refresh token
    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new Error("Invalid or expired refresh token");
    }

    // Check if token exists in sessions and is not revoked
    const session = await this.knex("sessions")
      .where({ token: refreshToken, is_revoked: false })
      .first();

    if (!session) {
      throw new Error("Invalid or revoked refresh token");
    }

    // Check if token is expired
    if (new Date(session.expires_at) < new Date()) {
      throw new Error("Refresh token has expired");
    }

    // Get user data
    const user = await this.userRepository.findUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    // Generate new token pair
    const newPayload: IJWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      organizationId: payload.organizationId,
      isSuperAdmin: user.isSuperAdmin,
    };
    const tokens = generateTokenPair(newPayload);

    // Revoke old refresh token
    await this.knex("sessions")
      .where({ token: refreshToken })
      .update({ is_revoked: true });

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.knex("sessions").insert({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    return tokens;
  }

  /**
   * Logout user by revoking refresh token
   */
  public async logout(refreshToken: string): Promise<void> {
    await this.knex("sessions")
      .where({ token: refreshToken })
      .update({ is_revoked: true });
  }

  /**
   * Validate access token and return auth context
   */
  public async validateToken(token: string): Promise<IAuthContext | null> {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Verify user still exists and is active
    const user = await this.userRepository.findUserById(payload.userId);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      organizationId: payload.organizationId,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${slug}-${suffix}`;
  }
}
