/**
 * Unit Tests for JWT Authentication Module
 * SIGMA-001: Setup JWT Authentication Infrastructure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateToken,
  verifyToken,
  extractTokenFromHeaders,
  getUserFromToken,
  hasRole,
  isAuthenticated,
  type TokenPayload
} from './auth';

describe('JWT Authentication Module', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token for student', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate a valid JWT token for admin', async () => {
      const payload: TokenPayload = {
        email: 'admin@school.com',
        role: 'admin'
      };

      const token = await generateToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });

    it('should include optional name in token', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483',
        name: 'Ahmad Darmawan'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.name).toBe('Ahmad Darmawan');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode valid student token', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.email).toBe('student@school.com');
      expect(verified?.role).toBe('student');
      expect(verified?.nisn).toBe('0087595483');
      expect(verified?.iat).toBeDefined();
      expect(verified?.exp).toBeDefined();
    });

    it('should verify and decode valid admin token', async () => {
      const payload: TokenPayload = {
        email: 'admin@school.com',
        role: 'admin'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.email).toBe('admin@school.com');
      expect(verified?.role).toBe('admin');
      expect(verified?.nisn).toBeUndefined();
    });

    it('should return null for invalid token', async () => {
      const verified = await verifyToken('invalid.token.here');

      expect(verified).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const verified = await verifyToken('not-a-jwt-token');

      expect(verified).toBeNull();
    });

    it('should return null for empty token', async () => {
      const verified = await verifyToken('');

      expect(verified).toBeNull();
    });

    it('should validate token expiration is set', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.exp).toBeGreaterThan(verified?.iat || 0);
      
      // Token should expire in ~7 days (604800 seconds)
      const expiresIn = (verified?.exp || 0) - (verified?.iat || 0);
      expect(expiresIn).toBeGreaterThan(604000); // ~7 days
      expect(expiresIn).toBeLessThan(605000);
    });
  });

  describe('extractTokenFromHeaders', () => {
    it('should extract token from Authorization Bearer header', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');

      const token = extractTokenFromHeaders(headers);

      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');
    });

    it('should extract token from cookie', () => {
      const headers = new Headers();
      headers.set('cookie', 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token; other=value');

      const token = extractTokenFromHeaders(headers);

      expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token');
    });

    it('should prioritize Authorization header over cookie', () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer header.token');
      headers.set('cookie', 'auth_token=cookie.token');

      const token = extractTokenFromHeaders(headers);

      expect(token).toBe('header.token');
    });

    it('should return null when no token found', () => {
      const headers = new Headers();

      const token = extractTokenFromHeaders(headers);

      expect(token).toBeNull();
    });

    it('should return null for invalid Authorization format', () => {
      const headers = new Headers();
      headers.set('authorization', 'InvalidFormat token');

      const token = extractTokenFromHeaders(headers);

      expect(token).toBeNull();
    });
  });

  describe('getUserFromToken', () => {
    it('should extract and verify token from headers', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const headers = new Headers();
      headers.set('authorization', `Bearer ${token}`);

      const user = await getUserFromToken(headers);

      expect(user).toBeTruthy();
      expect(user?.email).toBe('student@school.com');
      expect(user?.role).toBe('student');
    });

    it('should return null when no token in headers', async () => {
      const headers = new Headers();

      const user = await getUserFromToken(headers);

      expect(user).toBeNull();
    });

    it('should return null when token is invalid', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer invalid.token');

      const user = await getUserFromToken(headers);

      expect(user).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has required role', async () => {
      const payload: TokenPayload = {
        email: 'admin@school.com',
        role: 'admin'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(hasRole(verified, 'admin')).toBe(true);
    });

    it('should return false when user does not have required role', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(hasRole(verified, 'admin')).toBe(false);
    });

    it('should return false when payload is null', () => {
      expect(hasRole(null, 'admin')).toBe(false);
      expect(hasRole(null, 'student')).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid payload', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(isAuthenticated(verified)).toBe(true);
    });

    it('should return false for null payload', () => {
      expect(isAuthenticated(null)).toBe(false);
    });
  });

  describe('Token Security', () => {
    it('should not decode token with different secret', async () => {
      // This test verifies that tokens are secret-specific
      // In production, changing JWT_SECRET will invalidate all tokens
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      
      // Token should be valid with current secret
      const verified = await verifyToken(token);
      expect(verified).toBeTruthy();

      // Manually crafted token with wrong signature should fail
      const parts = token.split('.');
      const fakeToken = parts[0] + '.' + parts[1] + '.fakeSignature';
      
      const invalidVerified = await verifyToken(fakeToken);
      expect(invalidVerified).toBeNull();
    });

    it('should generate different tokens for same payload when issued at different times', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token1 = await generateToken(payload);
      
      // Wait at least 1 second since JWT iat claim is in whole seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token2 = await generateToken(payload);

      // Tokens should be different due to different iat
      expect(token1).not.toBe(token2);

      // But both should be valid
      const verified1 = await verifyToken(token1);
      const verified2 = await verifyToken(token2);
      
      expect(verified1).toBeTruthy();
      expect(verified2).toBeTruthy();
      expect(verified1?.email).toBe(verified2?.email);
    });
  });

  describe('Edge Cases', () => {
    it('should handle token with special characters in email', async () => {
      const payload: TokenPayload = {
        email: 'student+test@school.com',
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.email).toBe('student+test@school.com');
    });

    it('should handle token with Unicode characters in name', async () => {
      const payload: TokenPayload = {
        email: 'student@school.com',
        role: 'student',
        nisn: '0087595483',
        name: 'Muḥammad ʿAlī'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.name).toBe('Muḥammad ʿAlī');
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const payload: TokenPayload = {
        email: longEmail,
        role: 'student',
        nisn: '0087595483'
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.email).toBe(longEmail);
    });
  });
});
