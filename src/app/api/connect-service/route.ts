import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const { serviceName } = await request.json();

    if (!serviceName) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }

    // Configure OAuth2 client based on service
    let clientId: string;
    let clientSecret: string;
    let scopes: string[];

    switch (serviceName) {
      case 'google-calendar':
        clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET!;
        scopes = [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ];
        break;
      case 'gmail':
        clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        scopes = [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send'
        ];
        break;
      case 'google-drive':
        clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        scopes = [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.readonly'
        ];
        break;
      case 'google-contacts':
        clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
        scopes = [
          'https://www.googleapis.com/auth/contacts.readonly'
        ];
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported service' },
          { status: 400 }
        );
    }

    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: serviceName,
    });

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        serviceName,
      },
    });

  } catch (error) {
    console.error('Connect service error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect service' },
      { status: 500 }
    );
  }
}
