import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/lib/services/OpenAIService';
import { AgentService } from '@/lib/services/AgentService';
import { GenerateAgentRequest } from '@/types';

const openaiService = OpenAIService.getInstance();
const agentService = AgentService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAgentRequest = await request.json();
    const { businessType, name, objectives, features, personality, userId, conversationId } = body;

    // Validate required fields
    if (!businessType || !name || !objectives || !userId) {
      return NextResponse.json(
        { error: 'businessType, name, objectives, and userId are required' },
        { status: 400 }
      );
    }

    // Generate agent using OpenAI
    const agentData = await openaiService.generateAgent({
      businessType,
      name,
      objectives,
      features: features || [],
      personality: personality || 'Professionnel et utile',
      userId,
      conversationId: conversationId || '',
    });

    // Create agent in database
    const createdAgent = await agentService.createAgent({
      ...agentData,
      userId,
      conversationId: conversationId || '',
    });

    return NextResponse.json({
      success: true,
      data: createdAgent,
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
