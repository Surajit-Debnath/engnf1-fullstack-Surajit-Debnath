import type { ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variants = 'primary' | 'secondary';

export interface ButtonProps {
  variant: Variants;
  size: 'sm' | 'md' | 'lg' | 'fullWidth';
  text: string;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
  fullWidth: 'w-full px-6 py-3.5 text-base',
};

const defaultStyles = `
    rounded-xl
    flex
    items-center
    justify-center
    gap-2
    font-semibold
    transition-all
    duration-200
    cursor-pointer
    active:scale-[0.98]
    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-indigo-200
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:active:scale-100
`;

export const Button = (props: ButtonProps) => {
  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.loading || props.disabled}
      aria-busy={props.loading}
      className={`
                ${variantStyles[props.variant]}
                ${sizeStyles[props.size]}
                ${defaultStyles}
                ${props.className || ''}
            `}
    >
      {props.loading ? (
        <>
          <LoaderCircle size={20} className="animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {props.startIcon}
          <span>{props.text}</span>
          {props.endIcon}
        </>
      )}
    </button>
  );
};
