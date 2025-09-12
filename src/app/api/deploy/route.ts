import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { agentId, deploymentType, userId } = await request.json();

    if (!agentId || !deploymentType || !userId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID, deployment type, and user ID are required' },
        { status: 400 }
      );
    }

    // Get agent data
    const agentRef = doc(db, 'agents', agentId);
    const agentDoc = await getDoc(agentRef);

    if (!agentDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agentData = agentDoc.data();

    // Verify ownership
    if (agentData.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate deployment configuration
    const deploymentId = `deploy_${agentId}_${Date.now()}`;
    const deploymentConfig = {
      id: deploymentId,
      agentId,
      userId,
      type: deploymentType,
      url: deploymentType === 'web' 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/agent/${agentId}`
        : undefined,
      embedCode: deploymentType === 'iframe'
        ? `<iframe src="${process.env.NEXT_PUBLIC_APP_URL}/agent/${agentId}" width="100%" height="600"></iframe>`
        : undefined,
      apiKey: deploymentType === 'api'
        ? `ak_${Math.random().toString(36).substr(2, 32)}`
        : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save deployment configuration
    await setDoc(doc(db, 'deployments', deploymentId), deploymentConfig);

    // Update agent with deployment info
    await setDoc(agentRef, {
      ...agentData,
      deployments: {
        ...agentData.deployments,
        [deploymentType]: true,
      },
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      data: deploymentConfig,
    });

  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}
