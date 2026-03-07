import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm',
        outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900',
        ghost: 'hover:bg-slate-100 text-slate-700',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
});

Button.displayName = 'Button';

export default Button;
