'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, onChange, label, ...props }, ref) => {
    // Accessibility check (development only)
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        if (!label && !props['aria-label'] && !props['aria-labelledby']) {
          console.warn('Switch component requires an accessible label (use label prop, aria-label, or aria-labelledby).');
        }
      }
    }, [label, props]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={handleChange}
          ref={ref}
          aria-label={label}
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary",
          className
        )}></div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };

