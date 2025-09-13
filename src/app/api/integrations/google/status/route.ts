import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/services/GoogleOAuthService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'test-user';

    // Obtenir le statut réel des intégrations
    const status = await googleOAuthService.getIntegrationStatus(userId);

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error: any) {
    console.error('Erreur lors de la vérification du statut des intégrations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur lors de la vérification des intégrations' 
      },
      { status: 500 }
    );
  }
}




