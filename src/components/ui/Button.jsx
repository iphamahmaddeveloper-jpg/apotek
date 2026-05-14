import React from 'react';
import { cn } from '../../utils';

export function Button({ className, variant = 'primary', size = 'default', children, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tosca-500 disabled:opacity-50 disabled:pointer-events-none ring-offset-2 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-tosca-500 text-white hover:bg-tosca-600 shadow-soft hover:shadow-md',
    secondary: 'bg-tosca-50 text-tosca-600 hover:bg-tosca-100 hover:text-tosca-700',
    outline: 'border-2 border-slate-200 hover:border-tosca-500 hover:text-tosca-600',
    ghost: 'hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-soft hover:shadow-md',
  };

  const sizes = {
    default: 'h-11 py-2 px-5',
    sm: 'h-9 px-4 rounded-lg text-sm',
    lg: 'h-14 px-8 rounded-2xl text-lg',
    icon: 'h-11 w-11 rounded-xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
