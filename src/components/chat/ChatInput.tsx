'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, Paperclip, Mic, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Tapez votre message...",
  isLoading = false
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    // TODO: Implement file upload
    console.log('File upload clicked');
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
    console.log('Voice recording:', !isRecording);
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 p-4 slide-in-right">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Input Container */}
          <div className="relative bg-white/5 border border-white/20 rounded-3xl p-4 focus-within:border-white/40 focus-within:scale-105 transition-all duration-300 hover-glow input-enhanced">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full bg-transparent text-white placeholder-white/50 resize-none outline-none min-h-[24px] max-h-32"
              rows={1}
            />

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              {/* Left Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={disabled || isLoading}
                  className="p-2 text-white/70 hover:text-white rounded-full hover-lift smooth-transition"
                >
                  <Paperclip size={16} />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceRecord}
                  disabled={disabled || isLoading}
                  className={`p-2 rounded-full hover-lift smooth-transition ${isRecording ? 'text-red-400 glow' : 'text-white/70 hover:text-white'}`}
                >
                  {isRecording ? <Square size={16} /> : <Mic size={16} />}
                </Button>
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={!message.trim() || disabled || isLoading}
                className="p-2 rounded-full btn-enhanced hover-glow smooth-transition"
                size="sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-white/50 mt-2 text-center">
            Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
          </div>
        </div>
      </form>
    </div>
  );
}




