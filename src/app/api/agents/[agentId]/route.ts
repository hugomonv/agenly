import { NextRequest, NextResponse } from 'next/server';
import { HybridAgentService } from '@/lib/services/HybridAgentService';
import { agentDeploymentService } from '@/lib/services/AgentDeploymentService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Récupérer l'agent directement
    const agentService = HybridAgentService.getInstance();
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Retourner les informations de l'agent
    const agentData = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      personality: agent.personality,
      capabilities: agent.capabilities,
      status: agent.status,
      version: agent.version,
      created_at: agent.created_at,
      system_prompt: agent.system_prompt,
    };

    return NextResponse.json({
      success: true,
      agent: agentData,
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    const { userId, updates } = body;

    if (!agentId || !userId) {
      return NextResponse.json(
        { error: 'Agent ID and User ID are required' },
        { status: 400 }
      );
    }

    const agentService = HybridAgentService.getInstance();
    
    // Vérifier que l'agent appartient à l'utilisateur
    const existingAgent = await agentService.getAgentById(agentId);
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (existingAgent.created_by !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Mettre à jour l'agent
    const updatedAgent = await agentService.updateAgent(agentId, {
      ...updates,
      updated_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: updatedAgent,
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!agentId || !userId) {
      return NextResponse.json(
        { error: 'Agent ID and User ID are required' },
        { status: 400 }
      );
    }

    const agentService = HybridAgentService.getInstance();
    
    // Vérifier que l'agent appartient à l'utilisateur
    const existingAgent = await agentService.getAgentById(agentId);
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    if (existingAgent.created_by !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Supprimer l'agent
    await agentService.deleteAgent(agentId);

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}






