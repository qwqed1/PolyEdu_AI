export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  loading = false,
  disabled = false,
  ...props 
}) {
  const baseStyles = 'font-medium rounded-lg transition-default focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 focus:ring-neutral-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
    ghost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Загрузка...
        </span>
      ) : children}
    </button>
  );
}
