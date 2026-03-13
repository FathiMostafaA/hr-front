import React, { useId } from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, label, error, id: propId, ...props }, ref) => {
    const autoId = useId();
    const inputId = propId || autoId;
    const errorId = `${inputId}-error`;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
                >
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    error && "border-destructive focus-visible:ring-destructive",
                    className
                )}
                {...props}
            />
            {error && (
                <p id={errorId} className="text-xs font-medium text-destructive" role="alert">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
