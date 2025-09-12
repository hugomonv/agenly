import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceName = searchParams.get('service');
    const userId = searchParams.get('userId');

    if (!serviceName || !userId) {
      return NextResponse.json(
        { success: false, error: 'Service name and user ID are required' },
        { status: 400 }
      );
    }

    // Get user's connected service
    const serviceRef = doc(db, 'connected_services', `${userId}_${serviceName}`);
    const serviceDoc = await getDoc(serviceRef);

    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Service not connected' },
        { status: 404 }
      );
    }

    const serviceData = serviceDoc.data();

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: serviceData.accessToken,
      refresh_token: serviceData.refreshToken,
    });

    let data;

    switch (serviceName) {
      case 'google-calendar':
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarList = await calendar.calendarList.list();
        data = calendarList.data;
        break;

      case 'gmail':
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const messages = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 10,
        });
        data = messages.data;
        break;

      case 'google-drive':
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const files = await drive.files.list({
          pageSize: 10,
          fields: 'nextPageToken, files(id, name, mimeType, createdTime)',
        });
        data = files.data;
        break;

      case 'google-contacts':
        const people = google.people({ version: 'v1', auth: oauth2Client });
        const contacts = await people.people.connections.list({
          resourceName: 'people/me',
          personFields: 'names,emailAddresses,phoneNumbers',
          pageSize: 10,
        });
        data = contacts.data;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported service' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      service: serviceName,
    });

  } catch (error) {
    console.error('Google service error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Google service data' },
      { status: 500 }
    );
  }
}
