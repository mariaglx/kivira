// Ícone estático (sem animação) pra nav de "Logs de Auditoria" do painel admin.
// Os demais ícones em components/icons/ vêm da lib animateicons (motion/react);
// esse aqui é só um SVG simples porque o Sidebar sempre usa isAnimated={false}.

interface ClipboardListIconProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
}

export function ClipboardListIcon({ size = 24, className = "" }: ClipboardListIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
