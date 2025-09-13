import { Router, Request, Response } from 'express';
import { authenticateToken, generateAccessToken, generateRefreshToken } from '../auth/middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { APIResponse, User } from '../types';

const router = Router();

// Interface pour les données de connexion
interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

// Interface pour les données d'inscription
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  companyName: string;
  tenantId?: string;
}

// Connexion utilisateur
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, tenantId }: LoginRequest = req.body as LoginRequest;

  // Validation des données
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      }
    } as APIResponse);
  }

  try {
    // TODO: Implémenter la vérification des identifiants
    // Pour l'instant, utiliser des données mock
    const user = {
      id: 'user_123',
      tenant_id: tenantId || 'tenant_123',
      email: email,
      name: 'Test User',
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin'],
      last_login: new Date(),
      created_at: new Date(),
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en'
      }
    };

    // Génération des tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log de la connexion
    logger.info('User logged in', {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get?.('User-Agent')
    });

    const response: APIResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenant_id,
          preferences: user.preferences
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Login failed', {
      email,
      error: (error as Error).message,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid credentials'
      }
    } as APIResponse);
  }
}));

// Inscription utilisateur
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, companyName, tenantId }: RegisterRequest = req.body as RegisterRequest;

  // Validation des données
  if (!email || !password || !name || !companyName) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'All fields are required'
      }
    } as APIResponse);
  }

  try {
    // TODO: Implémenter la création d'utilisateur et de tenant
    // Pour l'instant, utiliser des données mock
    const newUser = {
      id: `user_${Date.now()}`,
      tenant_id: tenantId || `tenant_${Date.now()}`,
      email: email,
      name: name,
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin'],
      last_login: new Date(),
      created_at: new Date(),
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en'
      }
    };

    // Génération des tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Log de l'inscription
    logger.info('User registered', {
      userId: newUser.id,
      tenantId: newUser.tenant_id,
      email: newUser.email,
      companyName,
      ip: req.ip,
      userAgent: req.get?.('User-Agent')
    });

    const response: APIResponse = {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tenantId: newUser.tenant_id,
          preferences: newUser.preferences
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      }
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Registration failed', {
      email,
      error: (error as Error).message,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Registration failed'
      }
    } as APIResponse);
  }
}));

// Rafraîchissement du token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      }
    } as APIResponse);
  }

  try {
    // TODO: Implémenter la vérification du refresh token
    // Pour l'instant, utiliser des données mock
    const user = {
      id: 'user_123',
      tenant_id: 'tenant_123',
      email: 'user@example.com',
      name: 'Test User',
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin'],
      last_login: new Date(),
      created_at: new Date(),
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en'
      }
    };

    // Génération d'un nouveau token d'accès
    const newAccessToken = generateAccessToken(user);

    const response: APIResponse = {
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: '15m'
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Token refresh failed', {
      error: (error as Error).message,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid refresh token'
      }
    } as APIResponse);
  }
}));

// Déconnexion utilisateur
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    // TODO: Implémenter l'invalidation du token
    // Pour l'instant, juste logger la déconnexion
    
    logger.info('User logged out', {
      userId: req.userId,
      tenantId: req.tenantId,
      ip: req.ip
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Logout failed', {
      userId: req.userId,
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Logout failed'
      }
    } as APIResponse);
  }
}));

// Vérification du token
router.get('/verify', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const response: APIResponse = {
    success: true,
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        name: req.user?.name,
        role: req.user?.role,
        tenantId: req.user?.tenant_id,
        preferences: req.user?.preferences
      },
      valid: true
    }
  };

  res.json(response);
}));

// Mot de passe oublié
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required'
      }
    } as APIResponse);
  }

  try {
    // TODO: Implémenter l'envoi d'email de réinitialisation
    logger.info('Password reset requested', {
      email,
      ip: req.ip
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Password reset email sent'
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Password reset request failed', {
      email,
      error: (error as Error).message
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_ERROR',
        message: 'Failed to send password reset email'
      }
    } as APIResponse);
  }
}));

// Réinitialisation du mot de passe
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token and new password are required'
      }
    } as APIResponse);
  }

  try {
    // TODO: Implémenter la réinitialisation du mot de passe
    logger.info('Password reset completed', {
      token: token.substring(0, 10) + '...',
      ip: req.ip
    });

    const response: APIResponse = {
      success: true,
      data: {
        message: 'Password reset successfully'
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Password reset failed', {
      error: (error as Error).message,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_ERROR',
        message: 'Invalid or expired reset token'
      }
    } as APIResponse);
  }
}));

export default router;




