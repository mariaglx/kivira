export function BordaLateral({ children }) {
  return (
    <aside className="w-full lg:w-100 shrink-0 max-h-60 overflow-y-auto lg:max-h-none lg:overflow-visible bg-branco border border-coral/5 px-3">
      {children}
    </aside>
  );
}
