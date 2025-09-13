import { NextRequest, NextResponse } from 'next/server';
import PersistentPackageService from '@/lib/services/PersistentPackageService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: 'Package ID requis' },
        { status: 400 }
      );
    }

    // Utiliser le service de persistance robuste
    const deploymentPackage = await PersistentPackageService.getPackageWithFallback(packageId);
    
    if (!deploymentPackage) {
      return NextResponse.json(
        { success: false, error: 'Package non trouvé' },
        { status: 404 }
      );
    }

    // Si un fichier spécifique est demandé
    if (fileName) {
      const file = deploymentPackage.files.find(f => f.name === fileName);
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Fichier non trouvé' },
          { status: 404 }
        );
      }

      // Déterminer le type MIME
      const mimeTypes: { [key: string]: string } = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'php': 'application/x-httpd-php',
        'py': 'text/x-python',
        'java': 'text/x-java-source',
        'dockerfile': 'text/plain',
        'yaml': 'application/x-yaml',
        'yml': 'application/x-yaml'
      };

      const mimeType = mimeTypes[file.type] || 'text/plain';

      return new NextResponse(file.content, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': file.size.toString()
        }
      });
    }

    // Sinon, retourner la liste des fichiers
    return NextResponse.json({
      success: true,
      files: deploymentPackage.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }))
    });

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}




