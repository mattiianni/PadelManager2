
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className,
    ...props
}) => {
    const baseStyles = 'inline-flex min-h-10 items-center justify-center gap-2 font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-300/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

    const variantStyles = {
        primary: 'bg-sky-500 text-[#00344d] border-sky-300/40 hover:bg-sky-400 shadow-[0_14px_34px_rgba(14,165,233,0.32)]',
        secondary: 'bg-white/70 text-app border-[var(--app-border)] hover:bg-white/85 dark:bg-[rgba(34,42,61,0.88)] dark:text-slate-100 dark:hover:bg-[rgba(45,52,73,0.95)]',
        danger: 'bg-red-500/90 text-white border-red-400/35 hover:bg-red-500 shadow-[0_14px_30px_rgba(239,68,68,0.18)]',
        ghost: 'bg-transparent text-sky-500 border-transparent hover:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-white/5',
        outline: 'bg-slate-50/70 text-app border-slate-200/45 hover:bg-slate-100/80 dark:bg-white/[0.03] dark:text-slate-200 dark:border-white/5 dark:hover:bg-white/[0.06]',
    };

    const sizeStyles = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`;

    return (
        <button className={combinedClassName} {...props}>
            {children}
        </button>
    );
};

export default Button;
