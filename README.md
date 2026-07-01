# Kivira — Plataforma Educacional Gamificada

Este repositório contém o frontend do **Projeto Kivira** (anteriormente LUK), uma plataforma educacional gamificada voltada para o auxílio no aprendizado infantil, desenvolvida como Trabalho de Conclusão de Curso (TCC) para a graduação em Ciência da Computação.

---

## 📱 Telas Implementadas Até o Momento

* **Tela de Login:** Interface de autenticação de usuários.
* **Tela de Cadastro:** Sistema de registro para novos usuários na plataforma.
* **Tela de Jogo em Andamento (Sons dos Animais):** Mecânica interativa baseada no sistema pedagógico LUK, contendo:
    * Painel lateral de perguntas.
    * Tabuleiro responsivo com animação 3D de inversão (`flipInY`) ao validar respostas.
    * Sistema híbrido de interação: suporte a **Drag and Drop** (arrastar e soltar) nativo e seleção por clique.
    * Layout responsivo otimizado para visualização completa em tela única (*dashboard mode*), sem barras de rolagem.

---

## 🛠️ Tecnologias e Bibliotecas Utilizadas

* **React** (Single Page Application)
* **Vite** (Ferramenta de build rápida)
* **Tailwind CSS & @tailwindcss/vite** (Estilização utilitária e responsiva)
* **React Router Dom** (Gerenciamento de rotas e navegação entre telas)
* **Animate.css** (Animações tridimensionais físicas e feedbacks de validação)

---

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente e executar a aplicação na sua máquina.

### Pré-requisitos
Antes de começar, você precisa ter o **Node.js** instalado em seu computador. Você pode verificar se ele já está instalado rodando os seguintes comandos no terminal:

```bash
node --version
npm --version