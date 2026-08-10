import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, fullWidth = true, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase()

    return (
      <div className={cn('space-y-1', { 'w-full': fullWidth })}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              {
                'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
                'pr-10': icon,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, type InputProps }
