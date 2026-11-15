import React, { forwardRef, TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  maxLength?: number
  showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, maxLength, showCount = false, value, className, id, ...props }, ref) => {
    const textareaId = id || props.name || Math.random().toString(36).substring(2, 9)
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        <div className="flex justify-between items-center">
          {label && (
            <label htmlFor={textareaId} className="text-xs font-medium text-nt-muted">
              {label} {props.required && <span className="text-nt-bordeaux">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-[11px] text-nt-dim">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={clsx(
            'w-full bg-nt-surface2 border rounded-lg p-3 text-sm text-nt-text placeholder:text-nt-dim transition-colors focus:outline-none focus:ring-1 resize-y min-h-[90px]',
            error
              ? 'border-red-800/80 focus:border-red-600 focus:ring-red-600'
              : 'border-nt-border hover:border-nt-border2 focus:border-nt-bordeaux focus:ring-nt-bordeaux',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && helperText && <span className="text-xs text-nt-dim">{helperText}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
