import React, { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode
  helperText?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, className, id, ...props }, ref) => {
    const checkId = id || props.name || Math.random().toString(36).substring(2, 9)

    return (
      <div className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          id={checkId}
          ref={ref}
          type="checkbox"
          className={clsx(
            'w-4 h-4 mt-0.5 rounded bg-nt-surface2 border-nt-border text-nt-bordeaux focus:ring-nt-bordeaux focus:ring-offset-nt-bg cursor-pointer',
            className
          )}
          {...props}
        />
        <div className="flex flex-col text-left">
          <label htmlFor={checkId} className="text-sm font-medium text-nt-text cursor-pointer">
            {label}
          </label>
          {helperText && <span className="text-xs text-nt-dim">{helperText}</span>}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
