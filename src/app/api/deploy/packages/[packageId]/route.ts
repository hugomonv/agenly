import { NextRequest, NextResponse } from 'next/server';
import PersistentPackageService from '@/lib/services/PersistentPackageService';
import UniversalDeploymentEngine from '@/lib/services/UniversalDeploymentEngine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Package ID requis' },
        { status: 400 }
      );
    }

    // Utiliser le service de persistance robuste pour récupérer le package
    const deploymentPackage = await PersistentPackageService.getPackageWithFallback(packageId);
    
    if (!deploymentPackage) {
      return NextResponse.json(
        { success: false, error: 'Package non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: deploymentPackage
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du package:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Package ID requis' },
        { status: 400 }
      );
    }

    const deleted = UniversalDeploymentEngine.deleteDeploymentPackage(packageId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Package non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du package:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}



