export const DelvoLogo = ({ size = 32, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`delvo-brand-logo ${className}`}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-primary, #0075DE)" />
      <path
        d="M9 8h6.5a7.5 7.5 0 0 1 7.5 7.5v1a7.5 7.5 0 0 1-7.5 7.5H9V8zm3.5 3.5v9h3a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4h-3z"
        fill="var(--color-on-primary, #FFFFFF)"
      />
      <circle cx="21" cy="11" r="2" fill="var(--color-on-primary, #FFFFFF)" />
    </svg>
  );
};

export default DelvoLogo;
