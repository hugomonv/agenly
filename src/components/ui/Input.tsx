'use client';

import React from 'react';
import { InputProps } from '@/types';
import { cn } from '@/lib/utils';

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  ...props
}: InputProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const baseClasses = 'w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(baseClasses, className)}
      {...props}
    />
  );
}
