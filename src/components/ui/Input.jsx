import React, { forwardRef } from 'react';
import { cn } from '../../utils';

export const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:border-tosca-500 focus:ring-4 focus:ring-tosca-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';
