import { NextRequest, NextResponse } from 'next/server';
import { agentDeploymentService } from '@/lib/services/AgentDeploymentService';

export async function POST(request: NextRequest) {
  try {
    const { agentId, deploymentType, userId, options } = await request.json();

    if (!agentId || !deploymentType || !userId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID, deployment type, and user ID are required' },
        { status: 400 }
      );
    }

    // Deploy agent using the new service
    const result = await agentDeploymentService.deployAgent(
      agentId, 
      userId, 
      deploymentType as 'web' | 'iframe' | 'api',
      options
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.deployment,
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}



