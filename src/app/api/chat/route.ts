import { NextRequest, NextResponse } from 'next/server';
import { EnhancedConversationService } from '@/lib/services/EnhancedConversationService';
import { adminAuth } from '@/lib/firebase-admin';
import { ChatRequest } from '@/types';

const enhancedConversationService = EnhancedConversationService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId, userId, agentId } = body;

    // Validate required fields
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Verify user authentication (optional - can be done via token)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader) {
    //   const token = authHeader.split(' ')[1];
    //   const decodedToken = await adminAuth.verifyIdToken(token);
    //   if (decodedToken.uid !== userId) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //   }
    // }

    // Process chat request
    const response = await enhancedConversationService.processChatRequest({
      message,
      conversationId,
      userId,
      agentId,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'conversationId and userId are required' },
        { status: 400 }
      );
    }

    // Get conversation context
    const context = await enhancedConversationService.getConversationContext(conversationId);

    return NextResponse.json({
      success: true,
      data: context,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
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
