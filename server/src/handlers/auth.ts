import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User, type CreateUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<{ user: User; token: string }> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('User account is deactivated');
    }

    // In a real implementation, you would verify the password hash here
    // For this example, we'll simulate password verification
    const isPasswordValid = await verifyPassword(input.password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token (simplified for this example)
    const token = generateJWTToken(user);

    return {
      user,
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Hash the password
    const password_hash = await hashPassword(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const users = await db.select()
      .from(usersTable)
      .execute();

    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

// Helper functions (simplified implementations for demonstration)
async function hashPassword(password: string): Promise<string> {
  // In a real implementation, use bcrypt or similar
  // This is a simple simulation for testing purposes
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + 'salt').digest('hex');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // In a real implementation, use bcrypt.compare or similar
  // This is a simple simulation that matches the hashPassword function
  const crypto = require('crypto');
  const hashedInput = crypto.createHash('sha256').update(password + 'salt').digest('hex');
  return hashedInput === hash;
}

function generateJWTToken(user: User): string {
  // In a real implementation, use jsonwebtoken library
  // This is a simple simulation for testing purposes
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}