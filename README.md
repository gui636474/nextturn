# NextTurn — Plataforma Social de RPG Textual

NextTurn é uma plataforma web completa e imersiva especializada em **RPG textual**, comunidades criativas, personagens versáteis e salas de interpretação temporárias com chat em tempo real.

Construída com **React + TypeScript + Vite + Tailwind CSS**, integrada nativamente ao **Supabase (PostgreSQL, Auth, Realtime, Storage e Edge Functions)**.

---

## Principais Diferenciais e Funcionalidades

### 1. Sistema de Fichas Customizadas por Comunidade (Key Feature)
- Cada comunidade possui seu próprio **Construtor de Fichas** visual e dinâmico.
- Tipos de campos: texto curto, texto longo, números, datas, listas de seleção única, múltipla escolha/checkbox, URLs e imagens.
- **Versionamento de Esquemas**: As alterações nos formulários feitas pelos administradores nunca corrompem fichas antigas salvas.
- **Multiverso sem duplicação**: Um mesmo personagem pode participar de múltiplos universos (ex: Hogwarts, Vampiro a Máscara, Fantasia Medieval) tendo uma ficha específica para cada universo.

### 2. Personagens Vivos (Bots de Intérprete)
- Personagens com identidade profunda: nome, pronome, idade, avatar, personalidade, aparência, biografia, história e informações adicionais.
- Controle total de privacidade (público/privado) e gerenciamento completo.

### 3. Salas de RPG Temporárias (Expiração em 24 Horas)
- Salas públicas, privadas (via código exclusivo) e restritas.
- **Expiração automática após 24 horas**: Foco em sessões ágeis e ativas, evitando salas abandonadas e limpando dados desnecessários.
- Códigos de salas privadas gerados criptograficamente no backend e validados via RPC seguro sem expor códigos em listagens públicas.
- Controle de lotação atômico (`join_room_atomic`) que impede ultrapassar o limite em concorrência.

### 4. Chat em Tempo Real com Supabase Realtime
- Troca de mensagens instantânea sem polling.
- **Dois Modos de Interpretação**:
  - **Personagem**: Mensagem enviada com avatar e identidade do personagem selecionado.
  - **Narrador**: Mensagem especial independente de personagem, com tipografia nobre (Cinzel), estilo pergaminho e centralizado.
- Editor textual com formatação segura (**negrito**, *itálico*, ~~tachado~~, citações, menções `@handle`, códigos) e sanitização completa contra XSS.
- Inspeção de fichas ao vivo ao clicar no avatar de qualquer mensagem.
- Presença online de jogadores na sala via Supabase Realtime Presence.

### 5. Moderação Completa e Painel Administrativo
- Denúncias integradas para usuários, personagens, mensagens, salas e comunidades.
- Central administrativa protegida com papéis no backend (`user`, `admin`, `superadmin`).
- Histórico de auditoria, suspensão e banimento real de usuários.

### 6. Segurança e Proteção Anti-Multicontas
- Registro do identificador criptográfico **HMAC-SHA256 do IP do cliente** no backend através de Supabase Edge Functions.
- Não armazena IP puro, preservando a privacidade dos usuários.
- Políticas completas de Row Level Security (RLS) habilitadas em todas as 18 tabelas.

---

## Arquitetura do Projeto

```
nextturn/
├── src/
│   ├── components/
│   │   ├── chat/         # ChatContainer, CharacterSheetModal
│   │   ├── layout/       # AppLayout, Header, Sidebar, MobileNav
│   │   ├── reports/      # ReportModal
│   │   └── ui/           # Button, Input, Textarea, Select, Modal, Avatar, etc.
│   ├── contexts/         # AuthContext (Supabase Auth & Session)
│   ├── lib/              # supabase.ts
│   ├── pages/
│   │   ├── Admin/        # AdminPanel, AdminReports, AdminUsers
│   │   ├── Auth/         # Login, Register, ForgotPassword
│   │   ├── Characters/   # CharacterList, CharacterCreate, CharacterEdit, CharacterSheet
│   │   ├── Communities/  # CommunityList, CommunityCreate, CommunityPage, SchemaBuilder, SheetSubmission
│   │   ├── Profile/      # ProfilePage, EditProfile
│   │   ├── Rooms/        # RoomList, RoomCreate, RoomPage
│   │   ├── Feed.tsx      # Feed Principal e Descoberta
│   │   ├── Landing.tsx   # Landing Page Nobre
│   │   └── Notifications.tsx # Central de Notificações
│   ├── types/            # Interfaces TypeScript de todo o sistema
│   ├── utils/            # formatters, imageUtils, textFormatting
│   ├── App.tsx           # Configuração de Rotas e Navegação
│   ├── index.css         # Tailwind & Tipografia de Leitura
│   └── main.tsx
├── supabase/
│   ├── schema.sql        # SCRIPT SQL COMPLETO E EXECUTÁVEL
│   └── functions/
│       ├── register/     # Edge Function com Verificação HMAC de IP
│       └── expire-rooms/ # Edge Function para Limpeza Periódica de Salas
├── SETUP.md              # Guia detalhado de configuração e deploy
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Início Rápido

Consulte o arquivo [SETUP.md](SETUP.md) para instruções detalhadas de configuração do Supabase, execução do script SQL, criação do primeiro superadmin e deploy na Vercel / Netlify.
