export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`tatil bg-coral text-white rounded-xl p-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
