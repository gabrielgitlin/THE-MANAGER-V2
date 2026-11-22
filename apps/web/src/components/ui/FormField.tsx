import React from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function FormField({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('form-field', className)}>
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--status-red)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <span className="error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}
