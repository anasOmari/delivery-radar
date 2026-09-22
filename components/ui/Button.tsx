'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'whatsapp' | 'danger' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  icon: 'btn-icon',
};

/** Single button for the whole product. Colors come from globals.css tokens. */
export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  type = 'button',
  className,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${SIZE_CLASS[size]}${className ? ` ${className}` : ''}`.trim().replace(/\s+/g, ' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="spin" /> : icon}
      {children}
    </button>
  );
};
