import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput } from '../schema';
import { login, createUser, getUsers } from '../handlers/auth';
import { eq } from 'drizzle-orm';

// Test data
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'admin'
};

const testLoginInput: LoginInput = {
  username: 'testuser',
  password: 'password123'
};

describe('Auth Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await createUser(testUserInput);

      // Basic field validation
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('admin');
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.password_hash).not.toBe('password123'); // Should be hashed
      expect(result.password_hash.length).toBeGreaterThan(0);
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('testuser');
      expect(users[0].email).toBe('test@example.com');
      expect(users[0].role).toBe('admin');
      expect(users[0].is_active).toBe(true);
    });

    it('should hash the password', async () => {
      const result = await createUser(testUserInput);

      // Password should be hashed, not stored as plain text
      expect(result.password_hash).not.toBe(testUserInput.password);
      expect(result.password_hash).toBeDefined();
      expect(typeof result.password_hash).toBe('string');
      expect(result.password_hash.length).toBeGreaterThan(10);
    });

    it('should reject duplicate usernames', async () => {
      await createUser(testUserInput);

      // Try to create another user with same username
      const duplicateUser: CreateUserInput = {
        username: 'testuser',
        email: 'different@example.com',
        password: 'password456',
        role: 'owner'
      };

      await expect(createUser(duplicateUser)).rejects.toThrow();
    });

    it('should reject duplicate emails', async () => {
      await createUser(testUserInput);

      // Try to create another user with same email
      const duplicateUser: CreateUserInput = {
        username: 'differentuser',
        email: 'test@example.com',
        password: 'password456',
        role: 'owner'
      };

      await expect(createUser(duplicateUser)).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createUser(testUserInput);
    });

    it('should login with valid credentials', async () => {
      const result = await login(testLoginInput);

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('admin');
      expect(result.user.is_active).toBe(true);
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });

    it('should reject invalid username', async () => {
      const invalidLogin: LoginInput = {
        username: 'nonexistent',
        password: 'password123'
      };

      await expect(login(invalidLogin)).rejects.toThrow(/invalid credentials/i);
    });

    it('should reject invalid password', async () => {
      const invalidLogin: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      await expect(login(invalidLogin)).rejects.toThrow(/invalid credentials/i);
    });

    it('should reject inactive user', async () => {
      // Deactivate the user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.username, 'testuser'))
        .execute();

      await expect(login(testLoginInput)).rejects.toThrow(/deactivated/i);
    });

    it('should generate valid JWT token', async () => {
      const result = await login(testLoginInput);

      // Token should be a base64 encoded JSON object
      expect(typeof result.token).toBe('string');
      
      // Try to decode the token
      const decoded = JSON.parse(Buffer.from(result.token, 'base64').toString());
      expect(decoded.id).toBe(result.user.id);
      expect(decoded.username).toBe(result.user.username);
      expect(decoded.role).toBe(result.user.role);
    });
  });

  describe('getUsers', () => {
    it('should return empty array when no users exist', async () => {
      const users = await getUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', async () => {
      // Create multiple test users
      await createUser(testUserInput);
      await createUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password456',
        role: 'owner'
      });

      const users = await getUsers();
      
      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('testuser');
      expect(users[1].username).toBe('user2');
    });

    it('should return users with all required fields', async () => {
      await createUser(testUserInput);

      const users = await getUsers();
      const user = users[0];

      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.password_hash).toBeDefined();
      expect(user.role).toBe('admin');
      expect(user.is_active).toBe(true);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    it('should include both active and inactive users', async () => {
      // Create active user
      await createUser(testUserInput);
      
      // Create inactive user
      const inactiveUser = await createUser({
        username: 'inactive',
        email: 'inactive@example.com',
        password: 'password789',
        role: 'owner'
      });

      // Deactivate the second user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, inactiveUser.id))
        .execute();

      const users = await getUsers();
      
      expect(users).toHaveLength(2);
      expect(users.find(u => u.is_active === true)).toBeDefined();
      expect(users.find(u => u.is_active === false)).toBeDefined();
    });
  });
});