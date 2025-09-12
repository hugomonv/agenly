import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ConnectedService } from '@/types';

const googleClient = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=oauth_error`);
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=missing_params`);
    }

    try {
      // Exchange code for tokens
      const { tokens } = await googleClient.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('No tokens received');
      }

      // Get user info from Google
      googleClient.setCredentials(tokens);
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      const userId = payload.sub;
      const email = payload.email;
      const name = payload.name;

      // Save tokens to Firestore
      const serviceData: ConnectedService = {
        id: `${userId}_google-oauth`,
        userId,
        serviceName: 'google-calendar', // Default service
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        scope: tokens.scope || 'https://www.googleapis.com/auth/calendar',
        connectedAt: new Date(),
        isActive: true,
      };

      await setDoc(doc(db, 'connected_services', serviceData.id), {
        ...serviceData,
        connectedAt: serviceData.connectedAt,
        expiresAt: serviceData.expiresAt,
      });

      // Create or update user document
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: userId,
          email,
          displayName: name,
          photoURL: payload.picture,
          usage: {
            agentsCreated: 0,
            lastActivity: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await setDoc(userRef, {
          ...userDoc.data(),
          updatedAt: new Date(),
        }, { merge: true });
      }

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?connected=true`);

    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_error`);
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=callback_error`);
  }
}
