/**
 * JWT Authentication Module
 * SIGMA-001: Setup JWT Authentication Infrastructure
 * 
 * Provides functions for generating and verifying JWT tokens
 * for secure authentication of students and admin users.
 */

import * as jose from 'jose';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production-immediately';
const JWT_EXPIRES_IN = '7d'; // 7 days

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Token Payload Interface
 */
export interface TokenPayload {
  email: string;
  role: 'student' | 'admin';
  nisn?: string; // Only for students
  name?: string; // Optional, can be added from user data
}

/**
 * Verified Token Payload (includes standard JWT claims)
 */
export interface VerifiedTokenPayload extends TokenPayload {
  iat: number; // Issued at
  exp: number; // Expiration time
}

/**
 * Generate JWT Token
 * 
 * Creates a signed JWT token with the provided payload.
 * Token expires in 7 days by default.
 * 
 * @param payload - User data to encode in token (email, role, nisn)
 * @returns Signed JWT token string
 * 
 * @example
 * const token = await generateToken({
 *   email: 'student@school.com',
 *   role: 'student',
 *   nisn: '0087595483'
 * });
 */
export async function generateToken(payload: TokenPayload): Promise<string> {
  try {
    const token = await new jose.SignJWT({
      email: payload.email,
      role: payload.role,
      ...(payload.nisn && { nisn: payload.nisn }),
      ...(payload.name && { name: payload.name })
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return token;
  } catch (error) {
    console.error('[auth] Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify JWT Token
 * 
 * Verifies the signature and expiration of a JWT token.
 * Returns the decoded payload if valid, or null if invalid/expired.
 * 
 * @param token - JWT token string to verify
 * @returns Decoded token payload if valid, null if invalid
 * 
 * @example
 * const payload = await verifyToken(token);
 * if (payload) {
 *   console.log('User role:', payload.role);
 * }
 */
export async function verifyToken(
  token: string
): Promise<VerifiedTokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);

    // Validate required fields
    if (
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      console.warn('[auth] Token missing required fields:', payload);
      return null;
    }

    // Validate role
    if (payload.role !== 'student' && payload.role !== 'admin') {
      console.warn('[auth] Invalid role in token:', payload.role);
      return null;
    }

    // Construct verified payload with proper types
    const verifiedPayload: VerifiedTokenPayload = {
      email: payload.email,
      role: payload.role as 'student' | 'admin',
      iat: payload.iat,
      exp: payload.exp
    };

    // Add optional fields if present
    if (payload.nisn && typeof payload.nisn === 'string') {
      verifiedPayload.nisn = payload.nisn;
    }
    if (payload.name && typeof payload.name === 'string') {
      verifiedPayload.name = payload.name;
    }

    return verifiedPayload;
  } catch (error) {
    // Token expired, invalid signature, or malformed
    if (error instanceof jose.errors.JWTExpired) {
      console.log('[auth] Token expired');
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      console.warn('[auth] Token signature verification failed');
    } else {
      console.error('[auth] Token verification error:', error);
    }
    return null;
  }
}

/**
 * Extract Token from Request Headers
 * 
 * Utility function to extract JWT token from Authorization header
 * or cookie in a Next.js request.
 * 
 * @param headers - Request headers object
 * @returns Token string or null if not found
 */
export function extractTokenFromHeaders(headers: Headers): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookieHeader = headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    if (authCookie) {
      return authCookie.substring('auth_token='.length);
    }
  }

  return null;
}

/**
 * Get User from Token
 * 
 * Helper function that combines token extraction and verification.
 * Returns the verified user payload or null.
 * 
 * @param headers - Request headers object
 * @returns Verified token payload or null
 */
export async function getUserFromToken(
  headers: Headers
): Promise<VerifiedTokenPayload | null> {
  const token = extractTokenFromHeaders(headers);
  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

/**
 * Check if user has required role
 * 
 * @param payload - Verified token payload
 * @param requiredRole - Role required for access
 * @returns True if user has the required role
 */
export function hasRole(
  payload: VerifiedTokenPayload | null,
  requiredRole: 'student' | 'admin'
): boolean {
  if (!payload) return false;
  return payload.role === requiredRole;
}

/**
 * Check if user is authenticated (any role)
 * 
 * @param payload - Verified token payload
 * @returns True if user is authenticated
 */
export function isAuthenticated(payload: VerifiedTokenPayload | null): boolean {
  return payload !== null;
}
