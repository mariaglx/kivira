import { Input } from "kivira";
import { Search, Mail } from "lucide-react";

export const Padrao = () => (
  <div className="flex flex-col gap-3 p-4 max-w-sm">
    <Input placeholder="Nome da turma" className="w-full" />
  </div>
);

export const ComIcone = () => (
  <div className="flex flex-col gap-3 p-4 max-w-sm">
    <Input icone={Search} placeholder="Buscar aluno pelo nome" />
    <Input icone={Mail} type="email" placeholder="professor@escola.com.br" />
  </div>
);

export const ComRotulo = () => (
  <div className="flex flex-col gap-1.5 p-4 max-w-sm">
    <label className="rotulo">Título da atividade</label>
    <Input defaultValue="Frações do dia a dia" className="w-full" />
  </div>
);

export const Desabilitado = () => (
  <div className="p-4 max-w-sm">
    <Input value="5º ano B" disabled readOnly className="w-full bg-cinza-claro/40" />
  </div>
);
