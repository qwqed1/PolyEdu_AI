export default function Input({ 
  label, 
  error, 
  className = '',
  type = 'text',
  ...props 
}) {
  const inputStyles = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-default
    ${error 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-neutral-300 dark:border-neutral-600 focus:border-primary-500'
    }
    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
    placeholder:text-neutral-400 dark:placeholder:text-neutral-500`;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={inputStyles}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
