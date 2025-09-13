'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Share2, 
  Trash2, 
  MoreVertical, 
  Sun, 
  Moon,
  Settings
} from 'lucide-react';

interface HeaderProps {
  title?: string;
  onShare?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export function Header({ 
  title = 'Nouveau Chat',
  onShare,
  onDelete,
  onSettings,
  isDarkMode = true,
  onToggleTheme
}: HeaderProps) {
  return (
    <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-4 py-3 slide-in-right">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white truncate text-shimmer">
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="p-2 rounded-full hover-lift smooth-transition"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          {/* Share */}
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="p-2 rounded-full hover-lift smooth-transition"
            >
              <Share2 size={16} />
            </Button>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="p-2 text-red-400 hover:text-red-300 rounded-full hover-lift smooth-transition"
            >
              <Trash2 size={16} />
            </Button>
          )}

          {/* Settings */}
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="p-2 rounded-full hover-lift smooth-transition"
            >
              <Settings size={16} />
            </Button>
          )}

          {/* More Options */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-full hover-lift smooth-transition"
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}




