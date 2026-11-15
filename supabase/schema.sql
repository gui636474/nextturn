-- =====================================================================
-- NEXTTURN — PLATAFORMA SOCIAL DE RPG TEXTUAL
-- SCHEMA POSTGRESQL / SUPABASE COMPLETO E EXECUTÁVEL
-- =====================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE room_type AS ENUM ('public', 'private', 'restricted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('active', 'expired', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner', 'admin', 'moderator', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE message_mode AS ENUM ('character', 'narrator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE field_type AS ENUM ('text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox', 'url', 'image');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_target AS ENUM ('user', 'character', 'message', 'room', 'community', 'content');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABELAS PRINCIPAIS

-- PROFILES (Vinculado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  display_name TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  avatar_url TEXT,
  banner_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  suspended_until TIMESTAMPTZ,
  suspend_reason TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REGISTROS DE CONTA (Proteção anti-multicontas por hash HMAC de IP)
CREATE TABLE IF NOT EXISTS public.account_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ip_hash, user_id)
);
CREATE INDEX IF NOT EXISTS idx_account_registrations_ip_hash ON public.account_registrations(ip_hash);

-- WHITELIST DE IP (Redes compartilhadas / Exceções administrativas)
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PERSONAGENS (Independentes de comunidades)
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  surname TEXT CHECK (char_length(surname) <= 100),
  nickname TEXT CHECK (char_length(nickname) <= 100),
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 10000),
  pronoun TEXT NOT NULL,
  avatar_url TEXT,
  personality TEXT CHECK (char_length(personality) <= 2000),
  appearance TEXT CHECK (char_length(appearance) <= 2000),
  history TEXT CHECK (char_length(history) <= 5000),
  biography TEXT CHECK (char_length(biography) <= 5000),
  extra_info TEXT CHECK (char_length(extra_info) <= 2000),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);

-- COMUNIDADES
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  description TEXT CHECK (char_length(description) <= 1000),
  avatar_url TEXT,
  cover_url TEXT,
  category TEXT NOT NULL,
  fandom TEXT,
  rules TEXT CHECK (char_length(rules) <= 5000),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  member_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_communities_owner_id ON public.communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);

-- MEMBROS DA COMUNIDADE
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);

-- ESQUEMAS DE FICHAS DA COMUNIDADE (Versionamento para evitar corromper fichas antigas)
CREATE TABLE IF NOT EXISTS public.community_sheet_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(community_id, version)
);
CREATE INDEX IF NOT EXISTS idx_schemas_community_id ON public.community_sheet_schemas(community_id);

-- SUBMISSÕES DE FICHAS PERSONALIZADAS (Personagem + Comunidade)
CREATE TABLE IF NOT EXISTS public.community_sheet_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  schema_id UUID NOT NULL REFERENCES public.community_sheet_schemas(id) ON DELETE RESTRICT,
  schema_version INTEGER NOT NULL,
  schema_snapshot JSONB NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(character_id, community_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_character_id ON public.community_sheet_submissions(character_id);
CREATE INDEX IF NOT EXISTS idx_submissions_community_id ON public.community_sheet_submissions(community_id);

-- SALAS DE INTERPRETAÇÃO (Expiração automática após 24h)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  cover_url TEXT,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  type room_type NOT NULL DEFAULT 'public',
  status room_status NOT NULL DEFAULT 'active',
  max_participants INTEGER NOT NULL DEFAULT 20 CHECK (max_participants >= 2 AND max_participants <= 100),
  participant_count INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rooms_type_status ON public.rooms(type, status);
CREATE INDEX IF NOT EXISTS idx_rooms_community_id ON public.rooms(community_id);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON public.rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON public.rooms(owner_id);

-- CÓDIGOS DE ACESSO EXCLUSIVOS PARA SALAS PRIVADAS (Nunca expostos publicamente)
CREATE TABLE IF NOT EXISTS public.room_access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PARTICIPANTES DA SALA (Vinculados a um personagem específico)
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE RESTRICT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- MENSAGENS EM TEMPO REAL
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  mode message_mode NOT NULL DEFAULT 'character',
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 3000),
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  mentions UUID[] DEFAULT '{}',
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(room_id, created_at DESC);

-- REAÇÕES DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read, created_at DESC);

-- DENÚNCIAS E MODERAÇÃO
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type report_target NOT NULL,
  target_id UUID NOT NULL,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT CHECK (char_length(description) <= 2000),
  status report_status NOT NULL DEFAULT 'pending',
  priority report_priority NOT NULL DEFAULT 'medium',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reporter_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- EVIDÊNCIAS DE DENÚNCIAS
CREATE TABLE IF NOT EXISTS public.report_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  evidence_url TEXT,
  evidence_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AÇÕES DE MODERAÇÃO
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mod_actions_target ON public.moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_moderator ON public.moderation_actions(moderator_id);

-- BLOQUEIOS ENTRE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- CONVITES
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON public.invitations(invitee_id, is_used);


-- 4. FUNÇÕES AUXILIARES E VERIFICAÇÕES DE PAPÉIS

-- Verifica se usuário é administrador da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verifica se usuário é administrador ou dono de uma comunidade
CREATE OR REPLACE FUNCTION public.is_community_admin(p_user_id UUID, p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = p_user_id AND community_id = p_community_id
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_characters_updated_at ON public.characters;
CREATE TRIGGER trg_characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_communities_updated_at ON public.communities;
CREATE TRIGGER trg_communities_updated_at BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_schemas_updated_at ON public.community_sheet_schemas;
CREATE TRIGGER trg_schemas_updated_at BEFORE UPDATE ON public.community_sheet_schemas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.community_sheet_submissions;
CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON public.community_sheet_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Criação automática do perfil ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', v_username);

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, v_username, v_display_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualização do contador de membros na comunidade
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_community_member_count ON public.community_members;
CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- 5. TRANSAÇÕES E OPERAÇÕES ATÔMICAS

-- Entrada atômica na sala (impede ultrapassar max_participants em concorrência)
CREATE OR REPLACE FUNCTION public.join_room_atomic(
  p_room_id UUID,
  p_user_id UUID,
  p_character_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_room public.rooms%ROWTYPE;
  v_is_already_member BOOLEAN;
BEGIN
  -- Lock exclusivo na linha da sala
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'room_not_found');
  END IF;

  IF v_room.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'room_not_active');
  END IF;

  IF v_room.expires_at < NOW() THEN
    UPDATE public.rooms SET status = 'expired' WHERE id = p_room_id;
    RETURN jsonb_build_object('success', false, 'error', 'room_expired');
  END IF;

  -- Se já é membro, apenas atualiza personagem se necessário
  SELECT EXISTS(SELECT 1 FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id)
  INTO v_is_already_member;

  IF v_is_already_member THEN
    UPDATE public.room_members SET character_id = p_character_id WHERE room_id = p_room_id AND user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'already_member', true);
  END IF;

  -- Verifica limite de participantes
  IF v_room.participant_count >= v_room.max_participants THEN
    RETURN jsonb_build_object('success', false, 'error', 'room_full');
  END IF;

  -- Insere membro e incrementa contador
  INSERT INTO public.room_members (room_id, user_id, character_id)
  VALUES (p_room_id, p_user_id, p_character_id);

  UPDATE public.rooms
  SET participant_count = participant_count + 1
  WHERE id = p_room_id;

  RETURN jsonb_build_object('success', true, 'already_member', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Saída atômica de sala
CREATE OR REPLACE FUNCTION public.leave_room(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id;
  UPDATE public.rooms SET participant_count = GREATEST(0, participant_count - 1) WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expiração de salas (chamado pelo pg_cron ou Edge Function)
CREATE OR REPLACE FUNCTION public.expire_rooms()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.rooms
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geração segura de código exclusivo para sala privada
CREATE OR REPLACE FUNCTION public.generate_room_code(p_room_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_owner UUID;
BEGIN
  SELECT owner_id INTO v_owner FROM public.rooms WHERE id = p_room_id;
  IF v_owner != auth.uid() AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas o proprietário pode gerar o código da sala';
  END IF;

  v_code := upper(encode(gen_random_bytes(4), 'hex')); -- 8 caracteres hexadecimais seguros

  INSERT INTO public.room_access_codes (room_id, code)
  VALUES (p_room_id, v_code)
  ON CONFLICT (room_id) DO UPDATE SET code = v_code, is_active = TRUE;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validação de código de acesso exclusivo no servidor
CREATE OR REPLACE FUNCTION public.validate_room_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_room_id UUID;
BEGIN
  SELECT rac.room_id INTO v_room_id
  FROM public.room_access_codes rac
  JOIN public.rooms r ON r.id = rac.room_id
  WHERE rac.code = upper(trim(p_code))
    AND rac.is_active = TRUE
    AND r.status = 'active'
    AND r.expires_at > NOW();

  RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Versionamento de esquemas de fichas (preserva dados de fichas anteriores)
CREATE OR REPLACE FUNCTION public.create_schema_version(
  p_community_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_fields JSONB
)
RETURNS UUID AS $$
DECLARE
  v_next_version INTEGER;
  v_schema_id UUID;
BEGIN
  IF NOT public.is_community_admin(auth.uid(), p_community_id) AND NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada para gerenciar fichas da comunidade';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM public.community_sheet_schemas
  WHERE community_id = p_community_id;

  -- Desativa versões anteriores ativas
  UPDATE public.community_sheet_schemas
  SET is_active = FALSE
  WHERE community_id = p_community_id AND is_active = TRUE;

  -- Insere nova versão ativa
  INSERT INTO public.community_sheet_schemas (
    community_id, version, name, description, fields, is_active
  )
  VALUES (
    p_community_id, v_next_version, p_name, p_description, p_fields, TRUE
  )
  RETURNING id INTO v_schema_id;

  RETURN v_schema_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_sheet_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_sheet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: PROFILES
DROP POLICY IF EXISTS "Perfis públicos visíveis" ON public.profiles;
CREATE POLICY "Perfis públicos visíveis" ON public.profiles
  FOR SELECT USING (NOT is_banned OR auth.uid() = id OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- impede elevar próprio cargo
  );

DROP POLICY IF EXISTS "Admins gerenciam perfis" ON public.profiles;
CREATE POLICY "Admins gerenciam perfis" ON public.profiles
  FOR UPDATE USING (public.is_platform_admin(auth.uid()));

-- POLÍTICAS: ACCOUNT_REGISTRATIONS & IP_WHITELIST (Protegidos)
DROP POLICY IF EXISTS "Registros de IP visíveis apenas por admins" ON public.account_registrations;
CREATE POLICY "Registros de IP visíveis apenas por admins" ON public.account_registrations
  FOR ALL USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Whitelist de IP visível apenas por admins" ON public.ip_whitelist;
CREATE POLICY "Whitelist de IP visível apenas por admins" ON public.ip_whitelist
  FOR ALL USING (public.is_platform_admin(auth.uid()));

-- POLÍTICAS: CHARACTERS
DROP POLICY IF EXISTS "Personagens públicos ou próprios visíveis" ON public.characters;
CREATE POLICY "Personagens públicos ou próprios visíveis" ON public.characters
  FOR SELECT USING (is_public = TRUE OR user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuário cria seus personagens" ON public.characters;
CREATE POLICY "Usuário cria seus personagens" ON public.characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário edita seus personagens" ON public.characters;
CREATE POLICY "Usuário edita seus personagens" ON public.characters
  FOR UPDATE USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuário exclui seus personagens" ON public.characters;
CREATE POLICY "Usuário exclui seus personagens" ON public.characters
  FOR DELETE USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

-- POLÍTICAS: COMMUNITIES
DROP POLICY IF EXISTS "Comunidades ativas visíveis para todos" ON public.communities;
CREATE POLICY "Comunidades ativas visíveis para todos" ON public.communities
  FOR SELECT USING (is_active = TRUE OR owner_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados criam comunidades" ON public.communities;
CREATE POLICY "Usuários autenticados criam comunidades" ON public.communities
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Dono ou admin atualiza comunidade" ON public.communities;
CREATE POLICY "Dono ou admin atualiza comunidade" ON public.communities
  FOR UPDATE USING (public.is_community_admin(auth.uid(), id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Apenas admin exclui comunidade" ON public.communities;
CREATE POLICY "Apenas admin exclui comunidade" ON public.communities
  FOR DELETE USING (public.is_platform_admin(auth.uid()) OR owner_id = auth.uid());

-- POLÍTICAS: COMMUNITY_MEMBERS
DROP POLICY IF EXISTS "Membros visíveis para todos" ON public.community_members;
CREATE POLICY "Membros visíveis para todos" ON public.community_members
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Usuário entra em comunidade" ON public.community_members;
CREATE POLICY "Usuário entra em comunidade" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário sai ou admin remove membro" ON public.community_members;
CREATE POLICY "Usuário sai ou admin remove membro" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id OR public.is_community_admin(auth.uid(), community_id) OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins alteram cargos de membros" ON public.community_members;
CREATE POLICY "Admins alteram cargos de membros" ON public.community_members
  FOR UPDATE USING (public.is_community_admin(auth.uid(), community_id) OR public.is_platform_admin(auth.uid()));

-- POLÍTICAS: COMMUNITY_SHEET_SCHEMAS
DROP POLICY IF EXISTS "Esquemas de fichas públicos para leitura" ON public.community_sheet_schemas;
CREATE POLICY "Esquemas de fichas públicos para leitura" ON public.community_sheet_schemas
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins da comunidade gerenciam esquemas" ON public.community_sheet_schemas;
CREATE POLICY "Admins da comunidade gerenciam esquemas" ON public.community_sheet_schemas
  FOR ALL USING (public.is_community_admin(auth.uid(), community_id) OR public.is_platform_admin(auth.uid()));

-- POLÍTICAS: COMMUNITY_SHEET_SUBMISSIONS
DROP POLICY IF EXISTS "Fichas públicas visíveis" ON public.community_sheet_submissions;
CREATE POLICY "Fichas públicas visíveis" ON public.community_sheet_submissions
  FOR SELECT USING (
    is_public = TRUE OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid()) OR
    public.is_community_admin(auth.uid(), community_id) OR
    public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Dono do personagem gerencia sua ficha na comunidade" ON public.community_sheet_submissions;
CREATE POLICY "Dono do personagem gerencia sua ficha na comunidade" ON public.community_sheet_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND user_id = auth.uid())
  );

-- POLÍTICAS: ROOMS
DROP POLICY IF EXISTS "Salas públicas visíveis" ON public.rooms;
CREATE POLICY "Salas públicas visíveis" ON public.rooms
  FOR SELECT USING (
    type = 'public' OR
    owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = id AND user_id = auth.uid()) OR
    public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Usuário autenticado cria sala" ON public.rooms;
CREATE POLICY "Usuário autenticado cria sala" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Proprietário edita sala" ON public.rooms;
CREATE POLICY "Proprietário edita sala" ON public.rooms
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Proprietário ou admin encerra sala" ON public.rooms;
CREATE POLICY "Proprietário ou admin encerra sala" ON public.rooms
  FOR DELETE USING (owner_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- POLÍTICAS: ROOM_ACCESS_CODES
DROP POLICY IF EXISTS "Apenas dono da sala visualiza código privado" ON public.room_access_codes;
CREATE POLICY "Apenas dono da sala visualiza código privado" ON public.room_access_codes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()) OR
    public.is_platform_admin(auth.uid())
  );

-- POLÍTICAS: ROOM_MEMBERS
DROP POLICY IF EXISTS "Membros da sala visíveis para participantes e salas públicas" ON public.room_members;
CREATE POLICY "Membros da sala visíveis para participantes e salas públicas" ON public.room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE id = room_id AND (type = 'public' OR owner_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
    ) OR
    public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participantes saem ou dono expulsa" ON public.room_members;
CREATE POLICY "Participantes saem ou dono expulsa" ON public.room_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND owner_id = auth.uid()) OR
    public.is_platform_admin(auth.uid())
  );

-- POLÍTICAS: MESSAGES
DROP POLICY IF EXISTS "Mensagens visíveis para membros da sala" ON public.messages;
CREATE POLICY "Mensagens visíveis para membros da sala" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.rooms WHERE id = messages.room_id AND type = 'public') OR
    public.is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Membros enviam mensagens" ON public.messages;
CREATE POLICY "Membros enviam mensagens" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Autor ou admin edita mensagem" ON public.messages;
CREATE POLICY "Autor ou admin edita mensagem" ON public.messages
  FOR UPDATE USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Autor ou admin apaga mensagem" ON public.messages;
CREATE POLICY "Autor ou admin apaga mensagem" ON public.messages
  FOR DELETE USING (auth.uid() = user_id OR public.is_platform_admin(auth.uid()));

-- POLÍTICAS: MESSAGE_REACTIONS
DROP POLICY IF EXISTS "Reações visíveis" ON public.message_reactions;
CREATE POLICY "Reações visíveis" ON public.message_reactions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Usuário adiciona reação" ON public.message_reactions;
CREATE POLICY "Usuário adiciona reação" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário remove sua reação" ON public.message_reactions;
CREATE POLICY "Usuário remove sua reação" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: NOTIFICATIONS
DROP POLICY IF EXISTS "Usuário acessa suas notificações" ON public.notifications;
CREATE POLICY "Usuário acessa suas notificações" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuário atualiza suas notificações" ON public.notifications;
CREATE POLICY "Usuário atualiza suas notificações" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- POLÍTICAS: REPORTS
DROP POLICY IF EXISTS "Denúncias acessíveis pelo autor ou admins" ON public.reports;
CREATE POLICY "Denúncias acessíveis pelo autor ou admins" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuários autenticados criam denúncias" ON public.reports;
CREATE POLICY "Usuários autenticados criam denúncias" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins atualizam status de denúncias" ON public.reports;
CREATE POLICY "Admins atualizam status de denúncias" ON public.reports
  FOR UPDATE USING (public.is_platform_admin(auth.uid()));

-- POLÍTICAS: REPORT_EVIDENCE
DROP POLICY IF EXISTS "Evidências acessíveis por admins e autor" ON public.report_evidence;
CREATE POLICY "Evidências acessíveis por admins e autor" ON public.report_evidence
  FOR SELECT USING (
    public.is_platform_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND reporter_id = auth.uid())
  );

DROP POLICY IF EXISTS "Autor insere evidências" ON public.report_evidence;
CREATE POLICY "Autor insere evidências" ON public.report_evidence
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND reporter_id = auth.uid() AND status = 'pending')
  );

-- POLÍTICAS: MODERATION_ACTIONS
DROP POLICY IF EXISTS "Ações administrativas visíveis apenas por admins" ON public.moderation_actions;
CREATE POLICY "Ações administrativas visíveis apenas por admins" ON public.moderation_actions
  FOR ALL USING (public.is_platform_admin(auth.uid()));

-- POLÍTICAS: USER_BLOCKS
DROP POLICY IF EXISTS "Bloqueios privados por usuário" ON public.user_blocks;
CREATE POLICY "Bloqueios privados por usuário" ON public.user_blocks
  FOR ALL USING (blocker_id = auth.uid());

-- POLÍTICAS: INVITATIONS
DROP POLICY IF EXISTS "Convites visíveis para remetente e destinatário" ON public.invitations;
CREATE POLICY "Convites visíveis para remetente e destinatário" ON public.invitations
  FOR SELECT USING (invitee_id = auth.uid() OR inviter_id = auth.uid() OR public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Usuário envia convite" ON public.invitations;
CREATE POLICY "Usuário envia convite" ON public.invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

DROP POLICY IF EXISTS "Destinatário aceita convite" ON public.invitations;
CREATE POLICY "Destinatário aceita convite" ON public.invitations
  FOR UPDATE USING (invitee_id = auth.uid());


-- 7. CONFIGURAÇÃO DE BUCKETS DO SUPABASE STORAGE (Instruções e Políticas)
/*
Execute no Supabase Studio -> Storage ou configure os seguintes buckets:

1. Bucket 'avatars':
   - Público: SIM
   - Limite por arquivo: 2MB (2097152 bytes)
   - Tipos MIME permitidos: image/jpeg, image/png, image/webp, image/gif

2. Bucket 'covers':
   - Público: SIM
   - Limite por arquivo: 5MB (5242880 bytes)
   - Tipos MIME permitidos: image/jpeg, image/png, image/webp

3. Bucket 'attachments':
   - Público: SIM
   - Limite por arquivo: 2MB (2097152 bytes)
   - Tipos MIME permitidos: image/jpeg, image/png, image/webp, image/gif

Políticas RLS recomendadas no storage.objects para cada um dos buckets:
-- Leitura pública:
CREATE POLICY "Objetos públicos visíveis" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'covers', 'attachments'));

-- Upload restrito à pasta do próprio usuário (ex: avatars/user_id/avatar.png):
CREATE POLICY "Upload restrito ao próprio usuário" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id IN ('avatars', 'covers', 'attachments') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Atualização e remoção apenas do proprietário do arquivo:
CREATE POLICY "Edição pelo próprio usuário" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('avatars', 'covers', 'attachments') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Exclusão pelo próprio usuário" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('avatars', 'covers', 'attachments') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
*/

-- 8. PUBLICAÇÃO REALTIME
-- Habilitar tabelas no Supabase Realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =====================================================================
-- FIM DO SCRIPT SQL
-- =====================================================================
