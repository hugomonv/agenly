'use client';

import React from 'react';
// import { CardProps } from '@/types';
import { cn } from '@/lib/utils';

interface CardProps {
  onClick?: () => void;
}

export function Card({
  children,
  className,
  onClick,
  ...props
}: CardProps & React.HTMLAttributes<HTMLDivElement>) {
  const baseClasses = 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300';

  return (
    <div
      className={cn(
        baseClasses,
        onClick && 'cursor-pointer hover:bg-white/10',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-white/70', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}




