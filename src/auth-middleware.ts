// Authentication and authorization middleware for role-based permissions
import { Context, Next } from 'hono'
import { getUserById } from './database-neon'

// Extended context type with user information
export interface AuthContext {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}

// Role hierarchy for permission checking
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
} as const;

export const PERMISSIONS = {
  // Content creation permissions (admin and moderator only)
  CREATE_ARTICLE: ['admin', 'moderator'],
  EDIT_ARTICLE: ['admin', 'moderator'],
  DELETE_ARTICLE: ['admin', 'moderator'],
  PUBLISH_ARTICLE: ['admin', 'moderator'],
  
  CREATE_RESOURCE: ['admin', 'moderator'],
  EDIT_RESOURCE: ['admin', 'moderator'],
  DELETE_RESOURCE: ['admin', 'moderator'],
  
  // User management permissions (admin only)
  MANAGE_USERS: ['admin'],
  DELETE_USERS: ['admin'],
  CHANGE_USER_ROLES: ['admin'],
  SUSPEND_USERS: ['admin'],
  
  // Moderation permissions (admin and moderator)
  MODERATE_COMMENTS: ['admin', 'moderator'],
  DELETE_COMMENTS: ['admin', 'moderator'],
  
  // Regular user permissions (all authenticated users)
  CREATE_COMMENT: ['admin', 'moderator', 'user'],
  LIKE_CONTENT: ['admin', 'moderator', 'user'],
  VIEW_CONTENT: ['admin', 'moderator', 'user'],
  EDIT_OWN_PROFILE: ['admin', 'moderator', 'user']
} as const;

// Middleware to authenticate user and add to context
export async function authenticate() {
  return async (c: Context, next: Next) => {
    try {
      // Check for user session in cookies
      const userSession = c.req.header('X-User-Session');
      if (!userSession) {
        return c.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, 401);
      }

      // Parse user session (in production, this should be a JWT or secure session)
      let userId: number;
      try {
        const sessionData = JSON.parse(decodeURIComponent(userSession));
        userId = sessionData.userId;
      } catch (error) {
        return c.json({ error: 'Invalid session', code: 'INVALID_SESSION' }, 401);
      }

      // Get user from database
      const user = await getUserById(userId);
      if (!user) {
        return c.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, 401);
      }

      // Check user status
      if (user.status !== 'active') {
        let errorMessage = 'Account is not active';
        if (user.status === 'suspended') {
          errorMessage = user.suspension_expires && new Date(user.suspension_expires) > new Date()
            ? `Account suspended until ${user.suspension_expires}. Reason: ${user.suspension_reason || 'No reason provided'}`
            : 'Account suspended indefinitely';
        } else if (user.status === 'banned') {
          errorMessage = 'Account has been permanently banned';
        }
        return c.json({ error: errorMessage, code: 'ACCOUNT_INACTIVE' }, 403);
      }

      // Add user to context
      c.set('user', user);
      await next();
    } catch (error) {
      console.error('Authentication error:', error);
      return c.json({ error: 'Authentication failed', code: 'AUTH_ERROR' }, 500);
    }
  };
}

// Middleware to check if user has specific permission
export function requirePermission(permission: keyof typeof PERMISSIONS) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, 401);
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        error: 'Insufficient permissions', 
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: user.role
      }, 403);
    }

    await next();
  };
}

// Middleware to check if user has any of the specified roles
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ 
        error: 'Insufficient permissions', 
        code: 'FORBIDDEN',
        required: roles,
        current: user.role
      }, 403);
    }

    await next();
  };
}

// Middleware to check if user is admin or moderator (content creators)
export function requireContentCreator() {
  return requireRole(ROLES.ADMIN, ROLES.MODERATOR);
}

// Middleware to check if user is admin only
export function requireAdmin() {
  return requireRole(ROLES.ADMIN);
}

// Helper function to check permissions in controllers
export function hasPermission(userRole: string, permission: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

// Helper function to check if user can modify content (is author or has higher permission)
export async function canModifyContent(
  c: Context, 
  contentAuthorId: number, 
  requiredPermission: keyof typeof PERMISSIONS
): Promise<boolean> {
  const user = c.get('user');
  if (!user) return false;

  // User can modify their own content if they have the permission
  if (user.id === contentAuthorId && hasPermission(user.role, requiredPermission)) {
    return true;
  }

  // Admins can modify all content
  if (user.role === ROLES.ADMIN) {
    return true;
  }

  // Moderators can modify content created by users (but not other moderators/admins)
  if (user.role === ROLES.MODERATOR) {
    const contentAuthor = await getUserById(contentAuthorId);
    return contentAuthor?.role === ROLES.USER;
  }

  return false;
}

// User status validation
export function isUserActive(user: any): boolean {
  if (user.status !== 'active') return false;
  
  // Check if suspension has expired
  if (user.status === 'suspended' && user.suspension_expires) {
    return new Date(user.suspension_expires) <= new Date();
  }
  
  return true;
}

// Permission constants for frontend use
export const USER_PERMISSIONS = {
  // What each role can do
  admin: {
    canCreateArticles: true,
    canCreateResources: true,
    canManageUsers: true,
    canModerateComments: true,
    canDeleteAnyContent: true,
    canViewAnalytics: true,
    canChangeSettings: true
  },
  moderator: {
    canCreateArticles: true,
    canCreateResources: true,
    canManageUsers: false,
    canModerateComments: true,
    canDeleteAnyContent: false, // Can only delete user content, not admin/moderator content
    canViewAnalytics: false,
    canChangeSettings: false
  },
  user: {
    canCreateArticles: false,
    canCreateResources: false,
    canManageUsers: false,
    canModerateComments: false,
    canDeleteAnyContent: false,
    canViewAnalytics: false,
    canChangeSettings: false
  }
};