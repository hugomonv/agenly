import { NextRequest, NextResponse } from 'next/server';
import { EnhancedConversationService } from '@/lib/services/EnhancedConversationService';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationId, agentId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, error: 'Message and user ID are required' },
        { status: 400 }
      );
    }

    const conversationService = new EnhancedConversationService();

    // Process the intelligent chat
    const result = await conversationService.processChatRequest({
      message,
      userId,
      conversationId,
      agentId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Intelligent chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process intelligent chat' },
      { status: 500 }
    );
  }
}




