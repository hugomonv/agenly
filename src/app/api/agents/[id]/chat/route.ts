import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '@/lib/services/AgentService';
import { ConversationService } from '@/lib/services/ConversationService';
import { OpenAIService } from '@/lib/services/OpenAIService';

const agentService = AgentService.getInstance();
const conversationService = ConversationService.getInstance();
const openaiService = OpenAIService.getInstance();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    const { message, userId, conversationId } = body;

    // Validate required fields
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Get agent
    const agent = await agentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if user owns the agent
    if (agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversation = await conversationService.createConversation(
        userId,
        agentId,
        `Chat avec ${agent.name}`
      );
      currentConversationId = conversation.id;
    }

    // Get conversation history
    const messages = await conversationService.getConversationMessages(currentConversationId);
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message
    await conversationService.addMessage(currentConversationId, {
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Generate AI response
    const systemPrompt = agent.prompt || agent.metadata.systemPrompt;
    const response = await openaiService.generateResponse(
      message,
      systemPrompt,
      conversationHistory
    );

    // Add AI response
    await conversationService.addMessage(currentConversationId, {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        model: agent.model,
        temperature: agent.temperature,
      },
    });

    // Increment conversation count
    await agentService.incrementConversationCount(agentId);

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        conversationId: currentConversationId,
        agent: {
          id: agent.id,
          name: agent.name,
          model: agent.model,
        },
      },
    });
  } catch (error) {
    console.error('Error in agent chat API:', error);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get agent
    const agent = await agentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if user owns the agent
    if (agent.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get agent conversations
    const conversations = await conversationService.getAgentConversations(agentId, 10);

    return NextResponse.json({
      success: true,
      data: {
        agent,
        conversations,
      },
    });
  } catch (error) {
    console.error('Error getting agent chat history:', error);
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
