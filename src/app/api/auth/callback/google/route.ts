import { NextRequest, NextResponse } from 'next/server';
import { FirebaseUserService } from '@/lib/services/FirebaseUserService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      console.error('Erreur OAuth:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=oauth_error`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=missing_params`
      );
    }

    const userId = state;

    // Échanger le code contre les tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse.success) {
      console.error('Erreur échange tokens:', tokenResponse.error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=token_exchange_failed`
      );
    }

    // Stocker les tokens dans Firebase
    const userService = FirebaseUserService.getInstance();
    
    // Vérifier si l'utilisateur existe, sinon le créer
    let user = await userService.getUserById(userId);
    if (!user) {
      console.log('Utilisateur non trouvé, création automatique:', userId);
      user = await userService.createUser({
        email: `test-${userId}@example.com`,
        name: `Test User ${userId}`,
        role: 'user',
        preferences: {},
        subscription: { plan: 'free', status: 'active' }
      });
      console.log('Utilisateur créé avec ID:', user.id);
      // Utiliser l'ID généré par Firebase pour la suite
      userId = user.id;
    }
    
    await userService.updateUserIntegrations(userId, {
      google: {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresAt: tokenResponse.expiresAt,
        scopes: tokenResponse.scopes,
        connectedAt: new Date().toISOString()
      }
    });

    // Rediriger vers la page de succès
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?success=google_connected`
    );

  } catch (error: any) {
    console.error('Erreur callback OAuth:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?error=callback_error`
    );
  }
}

async function exchangeCodeForTokens(code: string) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Google credentials not configured' };
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur token response:', errorData);
      return { success: false, error: 'Token exchange failed' };
    }

    const tokens = await response.json();

    return {
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      scopes: tokens.scope?.split(' ') || []
    };

  } catch (error: any) {
    console.error('Erreur échange tokens:', error);
    return { success: false, error: error.message };
  }
}



