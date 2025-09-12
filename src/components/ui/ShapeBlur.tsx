'use client';

import React from 'react';

interface ShapeBlurProps {
  className?: string;
  variant?: 'circle' | 'square' | 'triangle';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  opacity?: number;
  blur?: number;
}

export function ShapeBlur({
  className = '',
  variant = 'circle',
  size = 'md',
  color = 'white',
  opacity = 0.1,
  blur = 20,
}: ShapeBlurProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  const renderShape = () => {
    const baseClasses = `${sizeClasses[size]} absolute`;
    const style = {
      backgroundColor: color,
      opacity,
      filter: `blur(${blur}px)`,
    };

    switch (variant) {
      case 'circle':
        return (
          <div
            className={`${baseClasses} rounded-full ${className}`}
            style={style}
          />
        );
      case 'square':
        return (
          <div
            className={`${baseClasses} rounded-lg ${className}`}
            style={style}
          />
        );
      case 'triangle':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{
              ...style,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
        );
      default:
        return null;
    }
  };

  return renderShape();
}

export function FloatingShapes({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Top left */}
      <ShapeBlur
        variant="circle"
        size="lg"
        className="top-10 left-10 float"
        opacity={0.05}
        blur={30}
      />
      
      {/* Top right */}
      <ShapeBlur
        variant="square"
        size="md"
        className="top-20 right-20 float"
        opacity={0.08}
        blur={25}
      />
      
      {/* Bottom left */}
      <ShapeBlur
        variant="triangle"
        size="sm"
        className="bottom-20 left-20 float"
        opacity={0.06}
        blur={20}
      />
      
      {/* Bottom right */}
      <ShapeBlur
        variant="circle"
        size="xl"
        className="bottom-10 right-10 float"
        opacity={0.04}
        blur={35}
      />
      
      {/* Center */}
      <ShapeBlur
        variant="square"
        size="lg"
        className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 float"
        opacity={0.03}
        blur={40}
      />
    </div>
  );
}
