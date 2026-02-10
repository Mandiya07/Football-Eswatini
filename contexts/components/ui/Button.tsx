
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'accent' | 'indigo';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      // Primary Blue - Strictly White Text
      default: 'bg-[#002B7F] text-white hover:bg-[#001e5a] font-bold',
      // Red Delete Button - Strictly White Text
      destructive: 'bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm',
      outline: 'border border-primary text-primary bg-white hover:bg-primary hover:text-white font-bold',
      secondary: 'bg-slate-200 text-[#002B7F] hover:bg-slate-300 font-bold',
      ghost: 'hover:bg-slate-100 hover:text-[#002B7F] font-bold',
      link: 'text-[#002B7F] underline-offset-4 hover:underline font-bold',
      // Yellow Accent - Strictly White Text (Per user preference for visibility on blue-ish tones)
      accent: 'bg-[#FDB913] text-white hover:bg-yellow-400 font-black uppercase tracking-widest',
      // Indigo variant - Strictly White Text
      indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 font-bold',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${className || ''} ${sizes[size]}`;

    return (
      <button
        className={combinedClassName}
        ref={ref}
        // Fix: Wrapped ...props in curly braces to correctly spread props in JSX
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
