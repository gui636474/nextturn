import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { clsx } from 'clsx'

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  }

  const styles = {
    info: 'bg-sky-950/30 border-sky-800/40 text-sky-200',
    success: 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200',
    warning: 'bg-amber-950/30 border-amber-800/40 text-amber-200',
    error: 'bg-red-950/30 border-red-800/40 text-red-200',
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border text-sm',
        styles[variant],
        className
      )}
      role="alert"
    >
      {icons[variant]}
      <div className="flex-1 text-left">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-nt-muted hover:text-nt-text p-1 rounded-md transition-colors"
          aria-label="Dispensar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
