import React, { useState } from 'react'
import { clsx } from 'clsx'

export interface AvatarProps {
  src?: string | null
  alt?: string
  fallbackText?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  isOnline?: boolean
  className?: string
  onClick?: () => void
}

export function Avatar({
  src,
  alt = 'Avatar',
  fallbackText = '?',
  size = 'md',
  isOnline,
  className,
  onClick,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-2xl font-bold',
  }

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const initials = (fallbackText || alt || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full bg-nt-surface3 text-nt-text border border-nt-border flex-shrink-0 select-none overflow-hidden',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:border-nt-bordeaux transition-colors',
        className
      )}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-medium text-nt-muted">{initials}</span>
      )}

      {typeof isOnline === 'boolean' && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-nt-bg',
            isOnline ? 'bg-emerald-500' : 'bg-nt-dim',
            indicatorSizes[size]
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  )
}
