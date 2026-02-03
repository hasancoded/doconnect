import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Button Component
 *
 * Consistent button component with medical-themed styling and states
 *
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' (default: 'primary')
 * @param {string} props.size - 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Take full width of container
 * @param {ReactNode} props.icon - Icon component (Lucide React)
 * @param {string} props.iconPosition - 'left' | 'right' (default: 'left')
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - 'button' | 'submit' | 'reset' (default: 'button')
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.children - Button text/content
 */
const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  iconPosition = "left",
  onClick,
  type = "button",
  className = "",
  children,
  ...rest
}) => {
  // Size configurations
  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
  };

  // Variant styles updated with medical theme colors
  const variantClasses = {
    primary: `
      bg-[#3B82F6] text-white 
      hover:bg-blue-600 active:bg-blue-700
      focus:ring-4 focus:ring-blue-200
      disabled:bg-blue-300 disabled:cursor-not-allowed
      shadow-sm hover:shadow-md
      transition-all duration-200
    `,
    secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200 active:bg-gray-300
      focus:ring-4 focus:ring-gray-200
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      transition-all duration-200
    `,
    danger: `
      bg-[#EF4444] text-white
      hover:bg-red-600 active:bg-red-700
      focus:ring-4 focus:ring-red-200
      disabled:bg-red-300 disabled:cursor-not-allowed
      shadow-sm hover:shadow-md
      transition-all duration-200
    `,
    success: `
      bg-[#10B981] text-white
      hover:bg-emerald-600 active:bg-emerald-700
      focus:ring-4 focus:ring-emerald-200
      disabled:bg-emerald-300 disabled:cursor-not-allowed
      shadow-sm hover:shadow-md
      transition-all duration-200
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100 active:bg-gray-200
      focus:ring-4 focus:ring-gray-200
      disabled:text-gray-400 disabled:cursor-not-allowed
      transition-all duration-200
    `,
    outline: `
      bg-transparent border-2 border-[#3B82F6] text-[#3B82F6]
      hover:bg-blue-50 active:bg-blue-100
      focus:ring-4 focus:ring-blue-200
      disabled:border-blue-300 disabled:text-blue-300 disabled:cursor-not-allowed
      transition-all duration-200
    `,
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    focus:outline-none
    transition-all duration-200
    ${fullWidth ? "w-full" : ""}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const isDisabled = disabled || loading;

  const iconSize = iconSizes[size];
  const iconGap = size === "xs" ? "gap-1" : size === "sm" ? "gap-1.5" : "gap-2";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <Loader2
          size={iconSize}
          className="animate-spin"
          aria-label="Loading"
        />
      )}

      {!loading && icon && iconPosition === "left" && (
        <span className={children ? iconGap : ""}>
          {React.cloneElement(icon, { size: iconSize })}
        </span>
      )}

      {children && (
        <span className={icon && !loading ? iconGap : ""}>{children}</span>
      )}

      {!loading && icon && iconPosition === "right" && (
        <span className={children ? iconGap : ""}>
          {React.cloneElement(icon, { size: iconSize })}
        </span>
      )}
    </button>
  );
};

/**
 * Specialized button variants
 */
export const IconButton = ({
  icon,
  variant = "ghost",
  size = "md",
  ariaLabel,
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    icon={icon}
    aria-label={ariaLabel}
    className="!p-2"
    {...props}
  />
);

export const LinkButton = ({ children, ...props }) => (
  <Button
    variant="ghost"
    className="!p-0 !bg-transparent hover:!bg-transparent text-[#3B82F6] hover:text-blue-600 underline hover:no-underline"
    {...props}
  >
    {children}
  </Button>
);

export const ButtonGroup = ({ children, className = "" }) => (
  <div className={`inline-flex rounded-lg shadow-sm ${className}`} role="group">
    {React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const isFirst = index === 0;
      const isLast = index === React.Children.count(children) - 1;

      return React.cloneElement(child, {
        className: `
          ${child.props.className || ""}
          ${!isFirst ? "!rounded-l-none -ml-px" : ""}
          ${!isLast ? "!rounded-r-none" : ""}
        `,
      });
    })}
  </div>
);

export default Button;
