import { NextRequest, NextResponse } from 'next/server';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const userId = searchParams.get('userId');

    if (!serviceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Service ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the service belongs to the user
    const serviceRef = doc(db, 'connected_services', serviceId);
    const serviceDoc = await getDoc(serviceRef);

    if (!serviceDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    const serviceData = serviceDoc.data();
    if (serviceData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the service
    await deleteDoc(serviceRef);

    return NextResponse.json({
      success: true,
      message: 'Service disconnected successfully',
    });

  } catch (error) {
    console.error('Disconnect service error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect service' },
      { status: 500 }
    );
  }
}
