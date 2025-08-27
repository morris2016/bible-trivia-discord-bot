import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { createUser, getUserByEmail, getUserById, User } from './database-neon';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export interface AuthUser extends User {
  token?: string;
}

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    return null;
  }
}

// Register new user
export async function registerUser(email: string, name: string, password: string, autoLogin: boolean = true): Promise<AuthUser> {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Validate input
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  if (!email.includes('@')) {
    throw new Error('Please provide a valid email address');
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await createUser(email, name, passwordHash);

  // Generate token only if auto-login is enabled
  let token = '';
  if (autoLogin) {
    token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
  }

  return { ...user, token };
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Get user with password hash
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }
  
  // Check if email is verified (skip for OAuth users and admin users)
  if (!user.email_verified && user.auth_provider !== 'google' && user.role !== 'admin') {
    const error = new Error('Please verify your email address before signing in.');
    (error as any).code = 'EMAIL_NOT_VERIFIED';
    (error as any).userId = user.id;
    throw error;
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user;
  return { ...userWithoutPassword, token };
}

// Get current user from token
export async function getCurrentUser(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await getUserById(payload.userId);
  return user;
}

// Middleware to protect routes
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const user = await getCurrentUser(token);
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Add user to context
  c.set('user', user);
  await next();
}

// Middleware to protect admin routes
export async function adminMiddleware(c: Context, next: () => Promise<void>) {
  const user = c.get('user') as User;
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
}

// Set authentication cookie
export function setAuthCookie(c: Context, token: string) {
  const isSecure = process.env.NODE_ENV === 'production' || c.req.url.startsWith('https://');
  
  setCookie(c, 'auth-token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

// Clear authentication cookie
export function clearAuthCookie(c: Context) {
  deleteCookie(c, 'auth-token', {
    path: '/'
  });
}

// Check if user is logged in (for templates)
export async function getLoggedInUser(c: Context): Promise<User | null> {
  const token = getCookie(c, 'auth-token');
  if (!token) {
    return null;
  }

  return await getCurrentUser(token);
}