import { NextRequest, NextResponse } from 'next/server';
import { agentGenerationService } from '@/lib/services/AgentGenerationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessType, name, objectives, features, personality, userId, conversationId } = body;

    // Validate required fields
    if (!businessType || !name || !objectives || !userId) {
      return NextResponse.json(
        { error: 'businessType, name, objectives, and userId are required' },
        { status: 400 }
      );
    }

    // Generate agent using the new service
    const result = await agentGenerationService.generateAgent({
      businessType,
      name,
      objectives,
      features: features || [],
      personality: personality || 'Professionnel et utile',
      userId,
      conversationId: conversationId || '',
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to generate agent'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.agent,
    });
  } catch (error) {
    console.error('Error generating agent:', error);
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




