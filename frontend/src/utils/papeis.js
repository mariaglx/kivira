// Opções e estilos de "papel" (tipo de usuário) — compartilhados entre as
// telas de admin (Usuários e Logs de auditoria), que antes tinham cada uma
// sua própria cópia dessas mesmas 3 constantes.
export const OPCOES_PAPEL = [
  { value: "", label: "Todos os papéis" },
  { value: "admin", label: "Admin" },
  { value: "professor", label: "Professor" },
  { value: "estudante", label: "Aluno" },
];

export const BADGE_POR_PAPEL = {
  admin: "bg-azul/10 text-azul",
  professor: "bg-blue-100 text-blue-600",
  estudante: "bg-green-100 text-green-600",
};

export const LABEL_POR_PAPEL = {
  admin: "Admin",
  professor: "Professor",
  estudante: "Aluno",
};
