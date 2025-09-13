'use client';

import React from 'react';
import { Message } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MessageMetadata } from './MessageMetadata';

interface MessageBubbleProps {
  message: Message;
  onCopy?: (content: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
}

export function MessageBubble({ 
  message, 
  onCopy, 
  onLike, 
  onDislike 
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(message.id);
    }
  };

  const handleDislike = () => {
    if (onDislike) {
      onDislike(message.id);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 fade-in`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center smooth-transition hover-lift ${
          isUser 
            ? 'bg-white text-black' 
            : 'bg-white/10 text-white'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {/* Message Bubble */}
          <div className={`inline-block p-4 rounded-3xl message-bubble hover-glow ${
            isUser
              ? 'bg-white text-black'
              : 'bg-white/10 text-white'
          }`}>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
            
            {/* Message metadata for assistant messages */}
            {isAssistant && <MessageMetadata metadata={message.metadata} />}
          </div>

          {/* Message Metadata */}
          <div className={`flex items-center mt-2 space-x-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-white/50">
              {formatRelativeTime(message.timestamp)}
            </span>
            
            {message.metadata?.model_used && (
              <span className="text-xs text-white/50">
                {message.metadata.model_used}
              </span>
            )}
          </div>

          {/* Assistant Actions */}
          {isAssistant && (
            <div className="flex items-center mt-2 space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="p-1 text-white/50 hover:text-white rounded-full hover-lift smooth-transition"
              >
                <Copy size={12} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="p-1 text-white/50 hover:text-green-400 rounded-full hover-lift smooth-transition"
              >
                <ThumbsUp size={12} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                className="p-1 text-white/50 hover:text-red-400 rounded-full hover-lift smooth-transition"
              >
                <ThumbsDown size={12} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-white/50 hover:text-white rounded-full hover-lift smooth-transition"
              >
                <MoreVertical size={12} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




