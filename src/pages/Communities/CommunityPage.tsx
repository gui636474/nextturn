import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Users,
  MessageSquare,
  ScrollText,
  Shield,
  Plus,
  Settings,
  UserPlus,
  UserMinus,
  Flag,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Community, CommunityMember, Room, CommunitySheetSchema } from '../../types'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { formatExpiryCountdown } from '../../utils/formatters'
import { ReportModal } from '../../components/reports/ReportModal'

export function CommunityPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [community, setCommunity] = useState<Community | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeSchema, setActiveSchema] = useState<CommunitySheetSchema | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)

  const [activeTab, setActiveTab] = useState<'home' | 'rooms' | 'members' | 'rules' | 'sheets'>('home')
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  useEffect(() => {
    async function loadCommunity() {
      if (!slug) return
      setIsLoading(true)

      try {
        // 1. Carregar comunidade
        const { data: comm, error: commErr } = await supabase
          .from('communities')
          .select('*, owner:profiles(id, username, display_name)')
          .eq('slug', slug)
          .single()

        if (commErr || !comm) {
          setCommunity(null)
          setIsLoading(false)
          return
        }

        setCommunity(comm)

        // 2. Verificar se o usuário atual é membro
        if (user?.id) {
          const { data: mem } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', comm.id)
            .eq('user_id', user.id)
            .maybeSingle()

          if (mem) {
            setIsMember(true)
            setUserRole(mem.role)
          } else {
            setIsMember(false)
            setUserRole(null)
          }
        }

        // 3. Carregar salas vinculadas a esta comunidade
        const { data: roomData } = await supabase
          .from('rooms')
          .select('*')
          .eq('community_id', comm.id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        setRooms(roomData || [])

        // 4. Carregar membros da comunidade
        const { data: memList } = await supabase
          .from('community_members')
          .select('*, profile:profiles(*)')
          .eq('community_id', comm.id)
          .order('joined_at', { ascending: false })
          .limit(50)

        setMembers(memList || [])

        // 5. Carregar esquema de ficha ativo
        const { data: schemaData } = await supabase
          .from('community_sheet_schemas')
          .select('*')
          .eq('community_id', comm.id)
          .eq('is_active', true)
          .maybeSingle()

        setActiveSchema(schemaData)
      } catch (err) {
        console.error('Erro ao carregar dados da comunidade:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCommunity()
  }, [slug, user?.id])

  const handleJoinLeave = async () => {
    if (!community || !user?.id) return
    setIsJoining(true)

    try {
      if (isMember) {
        // Sair da comunidade (se não for o proprietário)
        if (userRole === 'owner') {
          alert('O proprietário não pode sair da comunidade. Transfira a posse antes.')
          setIsJoining(false)
          return
        }

        const { error } = await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsMember(false)
        setUserRole(null)
        setCommunity((prev) => prev && { ...prev, member_count: Math.max(0, prev.member_count - 1) })
      } else {
        // Entrar na comunidade
        const { error } = await supabase.from('community_members').insert({
          community_id: community.id,
          user_id: user.id,
          role: 'member',
        })

        if (error) throw error
        setIsMember(true)
        setUserRole('member')
        setCommunity((prev) => prev && { ...prev, member_count: prev.member_count + 1 })
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando comunidade...</span>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-reading mb-2">Comunidade não encontrada</h2>
        <p className="text-xs text-nt-muted mb-6">Esta comunidade não existe ou foi arquivada.</p>
        <Link to="/app/communities">
          <Button variant="secondary">Explorar Comunidades</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-left">
      {/* Capa e Cabeçalho da Comunidade */}
      <div className="bg-nt-surface border border-nt-border rounded-2xl overflow-hidden relative shadow-subtle">
        <div className="h-44 sm:h-60 w-full bg-gradient-to-r from-nt-surface3 via-nt-bordeaux-deep to-nt-surface relative">
          {community.cover_url && (
            <img src={community.cover_url} alt="Capa" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-nt-surface via-transparent to-transparent opacity-90" />
        </div>

        {/* Linha de Apresentação e Ações */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="p-1 rounded-2xl bg-nt-surface border-2 border-nt-border shadow-lg">
              <Avatar
                src={community.avatar_url}
                alt={community.name}
                fallbackText={community.name}
                size="2xl"
                className="rounded-2xl"
              />
            </div>

            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-bold font-reading text-nt-text">
                  {community.name}
                </h1>
                <Badge variant="gold" size="sm">
                  {community.category}
                </Badge>
              </div>
              {community.fandom && (
                <p className="text-xs text-nt-dim mt-0.5 font-reading italic">
                  Universo: {community.fandom}
                </p>
              )}
            </div>
          </div>

          {/* Botões de Membro e Gestão */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={isMember ? 'secondary' : 'primary'}
              size="sm"
              loading={isJoining}
              onClick={handleJoinLeave}
              leftIcon={isMember ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            >
              {isMember ? 'Sair da Comunidade' : 'Fazer Parte'}
            </Button>

            {isOwnerOrAdmin && (
              <Link to={`/app/communities/${community.slug}/edit`}>
                <Button variant="secondary" size="sm" title="Gerenciar Comunidade">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              className="text-red-400 hover:text-red-300"
              title="Denunciar Comunidade"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-t border-nt-border px-6 overflow-x-auto no-scrollbar">
          {[
            { key: 'home', label: 'Início', icon: Users },
            { key: 'rooms', label: `Salas (${rooms.length})`, icon: MessageSquare },
            { key: 'sheets', label: 'Fichas do Universo', icon: ScrollText },
            { key: 'members', label: `Membros (${community.member_count})`, icon: Shield },
            { key: 'rules', label: 'Regras', icon: CheckCircle },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-nt-bordeaux text-nt-text'
                    : 'border-transparent text-nt-muted hover:text-nt-text hover:border-nt-border2'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card bordered className="p-6">
              <h3 className="text-base font-semibold text-nt-text mb-3">Sobre esta Comunidade</h3>
              <p className="text-sm text-nt-text/90 font-reading leading-relaxed whitespace-pre-line">
                {community.description || 'Nenhuma descrição fornecida.'}
              </p>
            </Card>

            {/* Destaque de Salas Recentes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-nt-text flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-nt-bordeaux" />
                  Salas Ativas neste Universo
                </h3>
                <Link
                  to={`/app/rooms/new?community=${community.id}`}
                  className="text-xs text-nt-bordeaux hover:underline font-semibold"
                >
                  + Nova Sala
                </Link>
              </div>

              {rooms.length === 0 ? (
                <Card bordered className="text-center py-8">
                  <p className="text-xs text-nt-muted">Nenhuma sala ativa no momento.</p>
                  <Link to={`/app/rooms/new?community=${community.id}`} className="mt-3 inline-block">
                    <Button variant="outline" size="sm">
                      Criar a Primeira Sala
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.slice(0, 4).map((room) => {
                    const expiry = formatExpiryCountdown(room.expires_at)
                    return (
                      <Link key={room.id} to={`/app/rooms/${room.id}`}>
                        <Card hover bordered className="p-4">
                          <h4 className="font-bold text-sm text-nt-text truncate">{room.name}</h4>
                          <p className="text-xs text-nt-muted line-clamp-2 mt-1 font-reading">
                            {room.description || 'Sessão de RPG textual.'}
                          </p>
                          <div className="flex items-center justify-between mt-3 text-[11px] text-nt-dim">
                            <span>
                              {room.participant_count}/{room.max_participants} jogadores
                            </span>
                            <span className={expiry.isImminent ? 'text-red-400 font-semibold' : ''}>
                              {expiry.text}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Informações & Fichas */}
          <div className="space-y-5">
            <Card bordered className="p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-nt-gold mb-3">
                Sistema de Fichas
              </h4>
              {activeSchema ? (
                <div>
                  <p className="text-xs text-nt-text font-medium">{activeSchema.name}</p>
                  <p className="text-[11px] text-nt-dim mt-0.5">
                    {activeSchema.fields.length} campos personalizados (Versão #{activeSchema.version})
                  </p>
                  <Link
                    to={`/app/communities/${community.slug}/submit-sheet`}
                    className="block mt-4"
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      Preencher Ficha de Personagem
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-nt-muted leading-relaxed">
                    Nenhum formulário de ficha personalizado ativo no momento.
                  </p>
                  {isOwnerOrAdmin && (
                    <Link
                      to={`/app/communities/${community.slug}/schema`}
                      className="block mt-3"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        Criar Formulário de Ficha
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </Card>

            <Card bordered className="p-5 text-xs text-nt-dim space-y-2">
              <div className="flex justify-between">
                <span>Fundador:</span>
                <span className="text-nt-text font-medium">@{community.owner?.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Criada em:</span>
                <span className="text-nt-text">{new Date(community.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Membros Ativos:</span>
                <span className="text-nt-text font-semibold">{community.member_count}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Aba Salas */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-nt-text font-reading">Salas de RPG no Universo</h3>
            <Link to={`/app/rooms/new?community=${community.id}`}>
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Criar Sala
              </Button>
            </Link>
          </div>

          {rooms.length === 0 ? (
            <Card bordered className="text-center py-12">
              <p className="text-xs text-nt-muted">Nenhuma sala criada nesta comunidade ainda.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const expiry = formatExpiryCountdown(room.expires_at)
                return (
                  <Link key={room.id} to={`/app/rooms/${room.id}`}>
                    <Card hover bordered className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" size="sm">
                            {room.category}
                          </Badge>
                          <span className={`text-[11px] ${expiry.isImminent ? 'text-red-400 font-semibold' : 'text-nt-dim'}`}>
                            {expiry.text}
                          </span>
                        </div>
                        <h4 className="font-bold text-base text-nt-text mb-1 truncate">{room.name}</h4>
                        <p className="text-xs text-nt-muted line-clamp-3 font-reading">
                          {room.description || 'Sem descrição.'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-nt-border flex items-center justify-between text-xs text-nt-dim">
                        <span>{room.participant_count}/{room.max_participants} participantes</span>
                        <span className="text-nt-bordeaux font-semibold">Entrar →</span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Aba Fichas do Universo */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-nt-text font-reading">
                Construtor & Fichas da Comunidade
              </h3>
              <p className="text-xs text-nt-muted">
                Preencha a ficha para seu personagem participar das histórias deste universo
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSchema && (
                <Link to={`/app/communities/${community.slug}/submit-sheet`}>
                  <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                    Preencher para Personagem
                  </Button>
                </Link>
              )}

              {isOwnerOrAdmin && (
                <Link to={`/app/communities/${community.slug}/schema`}>
                  <Button variant="secondary" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                    Editar Formulário
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {activeSchema ? (
            <Card bordered className="p-6">
              <div className="mb-6 pb-4 border-b border-nt-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-nt-text">{activeSchema.name}</h4>
                  <Badge variant="gold" size="sm">
                    Versão Ativa #{activeSchema.version}
                  </Badge>
                </div>
                {activeSchema.description && (
                  <p className="text-xs text-nt-muted mt-1 leading-relaxed">
                    {activeSchema.description}
                  </p>
                )}
              </div>

              {/* Prévia dos campos que o administrador configurou */}
              <div className="space-y-4">
                <h5 className="text-xs uppercase font-semibold text-nt-dim tracking-wider">
                  Campos Configurados no Formulário:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSchema.fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-3 bg-nt-surface2 rounded-lg border border-nt-border flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-nt-text block">
                          {field.label} {field.required && <span className="text-nt-bordeaux">*</span>}
                        </span>
                        <span className="text-[10px] text-nt-dim capitalize">
                          Tipo: {field.type} {field.max_length ? `(máx ${field.max_length} caracteres)` : ''}
                        </span>
                      </div>
                      {field.required && (
                        <Badge variant="primary" size="sm">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card bordered className="text-center py-12">
              <ScrollText className="w-10 h-10 text-nt-dim mx-auto mb-2 opacity-50" />
              <h4 className="text-base font-semibold text-nt-text">Nenhum formulário ativo</h4>
              <p className="text-xs text-nt-muted mt-1 max-w-md mx-auto">
                Os administradores desta comunidade ainda não publicaram um formulário de ficha.
              </p>
              {isOwnerOrAdmin && (
                <Link to={`/app/communities/${community.slug}/schema`} className="inline-block mt-4">
                  <Button variant="primary" size="sm">
                    Abrir Construtor de Fichas
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Aba Membros */}
      {activeTab === 'members' && (
        <Card bordered className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-nt-text">Membros ({members.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-nt-surface2 border border-nt-border"
              >
                <Link
                  to={`/app/profile/${mem.profile?.username}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar
                    src={mem.profile?.avatar_url}
                    alt={mem.profile?.display_name || mem.profile?.username}
                    fallbackText={mem.profile?.display_name || mem.profile?.username}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-nt-text">
                      {mem.profile?.display_name || mem.profile?.username}
                    </h4>
                    <span className="text-xs text-nt-dim">@{mem.profile?.username}</span>
                  </div>
                </Link>

                <Badge
                  variant={
                    mem.role === 'owner' ? 'gold' : mem.role === 'admin' ? 'primary' : 'default'
                  }
                  size="sm"
                >
                  {mem.role === 'owner' ? 'Proprietário' : mem.role === 'admin' ? 'Admin' : 'Membro'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Aba Regras */}
      {activeTab === 'rules' && (
        <Card bordered className="p-6">
          <h3 className="text-base font-semibold text-nt-text mb-3">Diretrizes & Regras</h3>
          <p className="text-sm text-nt-text/90 font-reading leading-relaxed whitespace-pre-line">
            {community.rules || 'Nenhuma regra específica registrada. Siga as diretrizes gerais de convivência do NextTurn.'}
          </p>
        </Card>
      )}

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="community"
        targetId={community.id}
        targetName={`Comunidade: ${community.name}`}
      />
    </div>
  )
}
