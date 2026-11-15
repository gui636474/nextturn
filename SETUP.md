# NEXTTURN — GUIA DE CONFIGURAÇÃO E INSTALAÇÃO COMPLETA

Este documento detalha o passo a passo para configurar a infraestrutura de banco de dados, storage, segurança e hospedagem da plataforma **NextTurn**.

---

## 1. REQUISITOS PRÉVIOS

- **Node.js** v18+ instalado.
- Conta gratuita ou paga no [Supabase](https://supabase.com).
- Git.
- Supabase CLI (opcional, para deploy de Edge Functions via terminal).

---

## 2. BANCO DE DADOS (SUPABASE POSTGRESQL)

1. Acesse o painel do seu projeto no Supabase: `https://supabase.com/dashboard/project/<seu-projeto>`.
2. No menu lateral esquerdo, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo localizado em `supabase/schema.sql` deste projeto, copie todo o seu conteúdo e cole no editor do Supabase.
5. Clique em **Run** (ou pressione `Ctrl + Enter`).
6. Verifique se todas as tabelas foram criadas com sucesso navegando até o **Table Editor**:
   - `profiles`
   - `account_registrations`
   - `ip_whitelist`
   - `characters`
   - `communities`
   - `community_members`
   - `community_sheet_schemas`
   - `community_sheet_submissions`
   - `rooms`
   - `room_access_codes`
   - `room_members`
   - `messages`
   - `message_reactions`
   - `notifications`
   - `reports`
   - `report_evidence`
   - `moderation_actions`
   - `user_blocks`
   - `invitations`

---

## 3. CRIANDO O PRIMEIRO SUPERADMINISTRADOR

Para ter acesso irrestrito ao painel administrativo (`/app/admin`), estatísticas e moderação:

1. Cadastre-se normalmente na plataforma pela tela de registro (`/register`) com seu nome de usuário (ex: `admin_mestre`).
2. Acesse o **SQL Editor** no painel do Supabase e execute o comando:

```sql
UPDATE public.profiles
SET role = 'superadmin'
WHERE username = 'admin_mestre';
```

3. Pronto! Ao recarregar a aplicação ou navegar até `/app/admin`, você terá acesso à Central de Moderação e Gestão de Usuários.

---

## 4. STORAGE (BUCKETS DE IMAGENS)

O NextTurn utiliza o Supabase Storage otimizado no lado do cliente (com compressão automática de imagem para WebP e limitação de dimensões para poupar espaço).

No painel do Supabase, acesse **Storage** e crie os três buckets públicos:

### Bucket 1: `avatars`
- **Nome**: `avatars`
- **Public Bucket**: **SIM (Habilitado)**
- **File size limit**: `2MB`
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Bucket 2: `covers`
- **Nome**: `covers`
- **Public Bucket**: **SIM (Habilitado)**
- **File size limit**: `5MB`
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### Bucket 3: `attachments`
- **Nome**: `attachments`
- **Public Bucket**: **SIM (Habilitado)**
- **File size limit**: `2MB`
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

> As políticas RLS do Storage já estão documentadas e comentadas no final de `supabase/schema.sql`.

---

## 5. SUPABASE AUTH & SEGURANÇA

1. No painel do Supabase, acesse **Authentication** -> **Providers** -> **Email**.
2. **Confirm email**: Como especificado no projeto, desmarque a opção inicial de confirmação obrigatória de e-mail se desejar que os jogadores comecem a interpretar imediatamente após o cadastro.
3. Em **Authentication** -> **URL Configuration**:
   - **Site URL**: Insira a URL do seu frontend (ex: `http://localhost:5173` ou `https://nextturn.vercel.app`).
   - **Redirect URLs**: Adicione `http://localhost:5173/**` e sua URL de produção.

---

## 6. EDGE FUNCTIONS & PROTEÇÃO ANTI-MULTICONTAS (HMAC IP)

O NextTurn protege a plataforma contra abusos e bots através de uma Edge Function que calcula um hash criptográfico (HMAC-SHA256) do IP do usuário no backend sem expor nem armazenar o IP puro no banco.

### Como realizar o Deploy:

1. Instale a CLI do Supabase (se ainda não possuir):
   ```bash
   npm install -g supabase
   ```

2. Faça login na sua conta:
   ```bash
   supabase login
   ```

3. Vincule ao seu projeto:
   ```bash
   supabase link --project-ref <id-do-seu-projeto>
   ```

4. Defina o segredo de hashing do IP:
   ```bash
   supabase secrets set IP_HASH_SECRET="sua-chave-secreta-hmac-com-mais-de-32-caracteres"
   ```

5. Faça o deploy da Edge Function de registro seguro:
   ```bash
   supabase functions deploy register --no-verify-jwt
   ```

6. Faça o deploy da rotina de expiração de salas:
   ```bash
   supabase functions deploy expire-rooms
   ```

*(Nota: Caso você não realize o deploy da Edge Function durante o desenvolvimento local, o NextTurn possui fallback automático e gracioso para o Supabase Auth direto, permitindo testar todas as funcionalidades).*

---

## 7. EXPIRAÇÃO AUTOMÁTICA DE SALAS EM 24 HORAS

Todas as salas de RPG possuem o campo `expires_at` gravado com 24h a partir do momento de criação.

Além da validação em tempo real e atômica nas operações do banco (`join_room_atomic`), existem duas formas automáticas de limpeza periódica:

### Opção A: Via Supabase pg_cron (Planos com pg_cron ativo)
Execute no SQL Editor do Supabase:
```sql
SELECT cron.schedule('expire-rooms-task', '*/30 * * * *', 'SELECT public.expire_rooms()');
```

### Opção B: Agendador Externo Gratuito (cron-job.org / GitHub Actions)
Se estiver no plano gratuito do Supabase sem pg_cron:
1. Acesse [cron-job.org](https://cron-job.org) (gratuito).
2. Crie um agendamento a cada 30 minutos chamando:
   - **URL**: `https://<seu-projeto>.supabase.co/functions/v1/expire-rooms`
   - **Método**: `POST`
   - **Header**: `Authorization: Bearer <SUA_SERVICE_ROLE_KEY>`

---

## 8. EXECUTANDO A APLICAÇÃO LOCALMENTE

1. Navegue até a pasta do projeto:
   ```bash
   cd nextturn
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Preencha `.env` com as credenciais do seu Supabase:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Instale as dependências:
   ```bash
   npm install
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

6. Abra no navegador: `http://localhost:5173`.

---

## 9. DEPLOY EM PRODUÇÃO

### Deploy na Vercel (Recomendado)
1. Instale a CLI da Vercel (`npm i -g vercel`) ou conecte seu repositório no dashboard da [Vercel](https://vercel.com).
2. O arquivo `vercel.json` incluso no projeto já garante o rewrite SPA correto (`/* -> /index.html`).
3. Adicione as variáveis de ambiente no dashboard da Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Execute `vercel --prod` ou acione o deploy pelo Git.

### Deploy na Netlify
1. Conecte o repositório na [Netlify](https://netlify.com).
2. O arquivo `netlify.toml` incluso no projeto já configura o redirecionamento `status = 200`.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações de Environment Variables.
4. Comando de build: `npm run build` | Diretório de publicação: `dist`.
