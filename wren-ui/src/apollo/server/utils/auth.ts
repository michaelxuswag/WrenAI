import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";

// JWT configuration - should be moved to environment variables
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m"; // 15 minutes
const JWT_REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d"; // 7 days

export interface IJWTPayload {
  userId: number;
  email: string;
  username: string;
  organizationId?: number;
  isSuperAdmin: boolean;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access and refresh tokens
 */
export function generateTokenPair(payload: IJWTPayload): ITokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ userId: payload.userId }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_TOKEN_EXPIRY,
  });

  // Get expiry time in seconds
  const decoded: any = jwt.decode(accessToken);
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): IJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IJWTPayload;
    return decoded;
  } catch (_error) {
    return null;
  }
}

/**
 * Decode JWT token without verification (for expired tokens)
 */
export function decodeToken(token: string): IJWTPayload | null {
  try {
    const decoded = jwt.decode(token) as IJWTPayload;
    return decoded;
  } catch (_error) {
    return null;
  }
}

/**
 * Generate a random password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get reset token expiry time (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Hash a string using SHA256
 */
export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}
