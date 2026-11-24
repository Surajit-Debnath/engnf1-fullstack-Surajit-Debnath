import { useId } from "react";
import type { Ref, ReactElement } from "react";

export interface InputProps {
    type: "text" | "password" | "email" | "number" | "tel";
    placeholder: string;
    reference?: Ref<HTMLInputElement>;
    label?: string;
    startIcon?: ReactElement;
    endIcon?: ReactElement;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    autoComplete?: string;
}

export function Input({
    type,
    placeholder,
    reference,
    label,
    startIcon,
    endIcon,
    error,
    disabled,
    required,
    className,
    autoComplete
}: InputProps) {

    const id = useId();

    return (
        <div className="w-full">

            {label && (
                <label
                    htmlFor={id}
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    {label}

                    {required && (
                        <span className="ml-1 text-red-500">*</span>
                    )}
                </label>
            )}

            <div className="relative">

                {startIcon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        {startIcon}
                    </div>
                )}

                <input
                    id={id}
                    ref={reference}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`
                        w-full
                        rounded-xl
                        border
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-slate-900
                        outline-none
                        transition-all
                        duration-200
                        placeholder:text-slate-400
                        disabled:cursor-not-allowed
                        disabled:bg-slate-100
                        disabled:opacity-60

                        ${startIcon ? "pl-12" : ""}
                        ${endIcon ? "pr-12" : ""}

                        ${error
                            ? "border-red-500 focus:ring-4 focus:ring-red-100"
                            : "border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
                        }

                        ${className || ""}
                    `}
                />

                {endIcon && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                        {endIcon}
                    </div>
                )}

            </div>

            {error && (
                <p
                    id={`${id}-error`}
                    className="mt-1.5 text-xs text-red-500"
                >
                    {error}
                </p>
            )}

        </div>
    );
}