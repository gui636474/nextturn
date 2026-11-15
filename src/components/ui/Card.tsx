import React from 'react'
import { clsx } from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  bordered?: boolean
  glow?: boolean
}

export function Card({
  hover = false,
  bordered = true,
  glow = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-nt-surface rounded-xl p-4 sm:p-5 transition-all duration-200',
        bordered && 'border border-nt-border',
        hover && 'hover:border-nt-border2 hover:bg-nt-surface2 hover:shadow-subtle cursor-pointer',
        glow && 'shadow-glow-bordeaux border-nt-bordeaux/40',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
