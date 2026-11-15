import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-nt-bg disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]'

    const variants = {
      primary:
        'bg-nt-bordeaux hover:bg-nt-bordeaux-hover text-white shadow-glow-bordeaux focus:ring-nt-bordeaux border border-nt-bordeaux',
      secondary:
        'bg-nt-surface2 hover:bg-nt-surface3 text-nt-text border border-nt-border hover:border-nt-border2 focus:ring-nt-border2',
      ghost:
        'bg-transparent hover:bg-nt-surface2 text-nt-muted hover:text-nt-text focus:ring-nt-surface3',
      danger:
        'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 focus:ring-red-700',
      outline:
        'bg-transparent border border-nt-bordeaux text-nt-text hover:bg-nt-bordeaux/20 focus:ring-nt-bordeaux',
      gold:
        'bg-nt-gold/15 hover:bg-nt-gold/25 text-nt-gold border border-nt-gold/30 shadow-glow-gold focus:ring-nt-gold',
    }

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? <Spinner size="sm" className="mr-1" /> : leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
