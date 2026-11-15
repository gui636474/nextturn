import React from 'react'
import { clsx } from 'clsx'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'gold' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
}

export function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-nt-surface3 text-nt-muted border border-nt-border',
    primary: 'bg-nt-bordeaux/20 text-red-200 border border-nt-bordeaux/40',
    gold: 'bg-nt-gold/15 text-nt-gold border border-nt-gold/30',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
    danger: 'bg-red-950/40 text-red-300 border border-red-800/40',
    outline: 'bg-transparent text-nt-muted border border-nt-border',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full',
  }

  return (
    <span
      className={clsx('inline-flex items-center gap-1 select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
