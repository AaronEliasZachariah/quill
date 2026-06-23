import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "primary-soft"
    | "secondary"
    | "danger"
    | "danger-ghost"
    | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) => {
  const baseClasses =
    "font-medium rounded-lg border transition-[background-color,border-color,transform,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-logo-primary/45 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 active:translate-y-[0.5px] cursor-pointer";

  const variantClasses = {
    primary:
      "text-white bg-background-ui border-background-ui shadow-sm hover:bg-background-ui/90 hover:border-background-ui/90",
    "primary-soft":
      "text-logo-primary bg-logo-primary/12 border-transparent hover:bg-logo-primary/20",
    secondary:
      "bg-surface border-mid-gray/25 hover:border-logo-primary hover:bg-logo-primary/6",
    danger:
      "text-white bg-red-600 border-red-600 shadow-sm hover:bg-red-700 hover:border-red-700",
    "danger-ghost":
      "text-red-600 dark:text-red-400 border-transparent hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10",
    ghost:
      "text-current border-transparent hover:bg-mid-gray/10 hover:border-mid-gray/20",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-[5px] text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
