import React, { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9)

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-nt-muted">
            {label} {props.required && <span className="text-nt-bordeaux">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-nt-dim pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full bg-nt-surface2 border rounded-lg px-3.5 py-2 text-sm text-nt-text placeholder:text-nt-dim transition-colors focus:outline-none focus:ring-1',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-red-800/80 focus:border-red-600 focus:ring-red-600'
                : 'border-nt-border hover:border-nt-border2 focus:border-nt-bordeaux focus:ring-nt-bordeaux',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-nt-dim flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && helperText && <span className="text-xs text-nt-dim">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
