import React, { forwardRef, SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: SelectOption[]
  helperText?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, helperText, children, className, id, ...props }, ref) => {
    const selectId = id || props.name || Math.random().toString(36).substring(2, 9)

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-nt-muted">
            {label} {props.required && <span className="text-nt-bordeaux">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={clsx(
            'w-full bg-nt-surface2 border rounded-lg px-3.5 py-2 text-sm text-nt-text transition-colors focus:outline-none focus:ring-1 appearance-none cursor-pointer',
            error
              ? 'border-red-800/80 focus:border-red-600 focus:ring-red-600'
              : 'border-nt-border hover:border-nt-border2 focus:border-nt-bordeaux focus:ring-nt-bordeaux',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-nt-surface2 text-nt-text">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && helperText && <span className="text-xs text-nt-dim">{helperText}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'
