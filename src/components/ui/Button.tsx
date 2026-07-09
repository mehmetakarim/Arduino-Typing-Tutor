import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'text-[var(--on-cyan)] font-black shadow-glow-cyan hover:brightness-110 ' +
    'bg-gradient-to-br from-[var(--accent-cyan-deep)] to-[var(--accent-cyan)] border-none',
  secondary:
    'bg-elevated border border-border text-primary font-extrabold hover:brightness-110',
  ghost:
    'bg-transparent border-none text-accent-cyan-soft font-extrabold hover:brightness-125',
  destructive:
    'bg-accent-red border-none text-[var(--on-red)] font-black hover:brightness-110',
  gold:
    'text-[var(--on-gold)] font-black shadow-glow-amber hover:brightness-105 ' +
    'bg-gradient-to-r from-[#FBBF24] to-[#FDE68A] border-none',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'text-[13px] px-4 py-2 rounded-[10px] gap-1.5',
  md: 'text-sm px-5 py-3 rounded-control gap-2',
  lg: 'text-base px-6 py-3.5 rounded-[14px] gap-2.5',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center cursor-pointer transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
