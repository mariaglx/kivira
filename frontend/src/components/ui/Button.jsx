export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-coral text-white rounded-xl p-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
