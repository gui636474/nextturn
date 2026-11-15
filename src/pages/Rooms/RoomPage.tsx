import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Users,
  Clock,
  Send,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Smile,
  LogOut,
  UserX,
  Flag,
  Sparkles,
  ChevronRight,
  Shield,
  CornerDownRight,
  X,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  Room,
  RoomMember,
  Message,
  Character,
  MessageMode,
} from '../../types'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { formatExpiryCountdown, formatTime } from '../../utils/formatters'
import { parseRPGMarkdown } from '../../utils/textFormatting'
import { CharacterSheetModal } from '../../components/chat/CharacterSheetModal'
import { ReportModal } from '../../components/reports/ReportModal'

export function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // Estados da Sala
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [isMember, setIsMember] = useState(false)
  const [currentUserCharacter, setCurrentUserCharacter] = useState<Character | null>(null)

  // Estados de Mensagens e Chat
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [messageMode, setMessageMode] = useState<MessageMode>('character')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)

  // Modais e Seleções
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [userCharacters, setUserCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [inspectedCharacterId, setInspectedCharacterId] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

  // Status
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const isOwner = user?.id && room?.owner_id === user.id
  const expiryInfo = room ? formatExpiryCountdown(room.expires_at) : null
  const isRoomExpired = expiryInfo?.isExpired || room?.status === 'expired'

  // Rolagem suave para o fim do chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Carregamento inicial da sala, membros e histórico de mensagens
  useEffect(() => {
    async function loadRoomData() {
      if (!id || !user?.id) return
      setIsLoading(true)

      try {
        // Carregar sala
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms')
          .select('*, community:communities(id, name, slug)')
          .eq('id', id)
          .single()

        if (roomErr || !roomData) throw new Error('Sala não encontrada')
        setRoom(roomData)

        // Carregar participantes
        const { data: memData } = await supabase
          .from('room_members')
          .select('*, profile:profiles(*), character:characters(*)')
          .eq('room_id', id)

        setMembers(memData || [])

        // Verificar se usuário atual já é membro e qual personagem está usando
        const currentMem = (memData || []).find((m: any) => m.user_id === user.id)
        if (currentMem) {
          setIsMember(true)
          setCurrentUserCharacter(currentMem.character)
        } else {
          setIsMember(false)
          // Carregar personagens do usuário para seleção
          const { data: chars } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', user.id)

          setUserCharacters(chars || [])
          if (chars && chars.length > 0) {
            setSelectedCharacterId(chars[0].id)
          }
          setIsJoinModalOpen(true)
        }

        // Carregar histórico de mensagens (últimas 50)
        const { data: msgData } = await supabase
          .from('messages')
          .select('*, character:characters(*), profile:profiles(*)')
          .eq('room_id', id)
          .order('created_at', { ascending: true })
          .limit(60)

        setMessages(msgData || [])
      } catch (err: any) {
        console.error('Erro ao carregar sala:', err)
      } finally {
        setIsLoading(false)
        setTimeout(scrollToBottom, 200)
      }
    }

    loadRoomData()
  }, [id, user?.id])

  // 2. Inscrição em Tempo Real (Supabase Realtime) para Mensagens e Presença
  useEffect(() => {
    if (!id || !user?.id) return

    // Canal Realtime para Mensagens e Presença
    const channel = supabase.channel(`room:${id}`)

    // Escuta novas mensagens (INSERT)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${id}`,
      },
      async (payload) => {
        const newMsgId = payload.new.id
        // Busca com relacionamentos para obter o avatar do personagem e nome do profile
        const { data: fullMsg } = await supabase
          .from('messages')
          .select('*, character:characters(*), profile:profiles(*)')
          .eq('id', newMsgId)
          .single()

        if (fullMsg) {
          setMessages((prev) => {
            // Evita duplicação caso já exista no estado
            if (prev.some((m) => m.id === fullMsg.id)) return prev
            return [...prev, fullMsg]
          })
          setTimeout(scrollToBottom, 100)
        }
      }
    )

    // Escuta edições ou exclusões de mensagens (UPDATE)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${id}`,
      },
      (payload) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
        )
      }
    )

    // Presença Online (Realtime Presence)
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const userIds = new Set<string>()
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) userIds.add(p.user_id)
          })
        })
        setOnlineUserIds(userIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            character_id: currentUserCharacter?.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, user?.id, currentUserCharacter?.id])

  // Entrar na sala utilizando a função atômica (join_room_atomic)
  const handleJoinRoom = async () => {
    if (!id || !user?.id || !selectedCharacterId) return
    setIsJoining(true)

    try {
      const { data: joinRes, error: joinErr } = await supabase.rpc('join_room_atomic', {
        p_room_id: id,
        p_user_id: user.id,
        p_character_id: selectedCharacterId,
      })

      if (joinErr) throw joinErr

      if (!joinRes.success) {
        if (joinRes.error === 'room_full') {
          alert('Esta sala atingiu o limite máximo de participantes.')
        } else if (joinRes.error === 'room_expired') {
          alert('Esta sala já expirou.')
        } else {
          alert('Não foi possível entrar na sala.')
        }
        setIsJoining(false)
        return
      }

      // Atualiza estado local
      const selectedChar = userCharacters.find((c) => c.id === selectedCharacterId) || null
      setCurrentUserCharacter(selectedChar)
      setIsMember(true)
      setIsJoinModalOpen(false)

      // Atualiza lista de membros
      const { data: memData } = await supabase
        .from('room_members')
        .select('*, profile:profiles(*), character:characters(*)')
        .eq('room_id', id)
      setMembers(memData || [])
    } catch (err: any) {
      alert(`Erro ao entrar: ${err.message}`)
    } finally {
      setIsJoining(false)
    }
  }

  // Sair da Sala (leave_room)
  const handleLeaveRoom = async () => {
    if (!id || !user?.id) return
    if (confirm('Deseja realmente sair desta sala de RPG?')) {
      await supabase.rpc('leave_room', {
        p_room_id: id,
        p_user_id: user.id,
      })
      navigate('/app/rooms')
    }
  }

  // Expulsar membro (apenas dono da sala)
  const handleKickMember = async (targetUserId: string) => {
    if (!id || !isOwner) return
    if (confirm('Deseja expulsar este participante da sala?')) {
      await supabase.rpc('leave_room', {
        p_room_id: id,
        p_user_id: targetUserId,
      })
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId))
    }
  }

  // Enviar Mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !id || !user?.id || isRoomExpired) return

    // Se estiver em modo edição
    if (editingMessage) {
      setIsSending(true)
      try {
        await supabase
          .from('messages')
          .update({
            content: messageInput.trim(),
            is_edited: true,
          })
          .eq('id', editingMessage.id)

        setEditingMessage(null)
        setMessageInput('')
      } catch (err) {
        console.error('Erro ao editar mensagem:', err)
      } finally {
        setIsSending(false)
      }
      return
    }

    setIsSending(true)

    try {
      const payload: any = {
        room_id: id,
        user_id: user.id,
        character_id: messageMode === 'narrator' ? null : currentUserCharacter?.id,
        mode: messageMode,
        content: messageInput.trim(),
        reply_to_id: replyingTo?.id || null,
      }

      const { error: sendError } = await supabase.from('messages').insert(payload)
      if (sendError) throw sendError

      setMessageInput('')
      setReplyingTo(null)
    } catch (err: any) {
      console.error('Falha ao enviar mensagem:', err.message)
    } finally {
      setIsSending(false)
    }
  }

  // Excluir Mensagem Própria
  const handleDeleteMessage = async (msgId: string) => {
    if (confirm('Deseja apagar esta mensagem?')) {
      await supabase
        .from('messages')
        .update({
          content: '[Mensagem removida pelo autor]',
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', msgId)
    }
  }

  // Inserir formatação textual no cursor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    setMessageInput((prev) => `${prev}${prefix}${suffix}`)
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Conectando à sala de interpretação...</span>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-reading mb-2">Sala não encontrada</h2>
        <Link to="/app/rooms">
          <Button variant="secondary">Voltar às Salas</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col bg-nt-surface border border-nt-border rounded-2xl overflow-hidden shadow-subtle animate-fade-in relative text-left">
      {/* 1. TOPO DA SALA: Informações, Expiração, Controles */}
      <div className="px-4 py-3 bg-nt-surface2 border-b border-nt-border flex items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/app/rooms')}
            className="p-1.5 text-nt-muted hover:text-nt-text hover:bg-nt-surface rounded-lg transition-colors"
            title="Voltar para as salas"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-nt-text truncate leading-tight">{room.name}</h2>
              {room.community && (
                <Link to={`/app/communities/${room.community.slug}`} target="_blank">
                  <Badge variant="gold" size="sm">
                    {room.community.name}
                  </Badge>
                </Link>
              )}
            </div>
            <p className="text-[11px] text-nt-dim truncate font-reading">{room.category}</p>
          </div>
        </div>

        {/* Temporizador de Expiração 24h & Participantes */}
        <div className="flex items-center gap-2 shrink-0">
          {expiryInfo && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                expiryInfo.isExpired
                  ? 'bg-red-950/60 text-red-300 border border-red-800'
                  : expiryInfo.isImminent
                  ? 'bg-amber-950/50 text-amber-300 border border-amber-800 animate-pulse'
                  : 'bg-nt-surface3 text-nt-dim border border-nt-border'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{expiryInfo.text}</span>
            </div>
          )}

          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nt-surface hover:bg-nt-surface3 border border-nt-border text-xs font-medium text-nt-text transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-nt-gold" />
            <span>
              {members.length}/{room.max_participants}
            </span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="p-1.5 text-nt-muted hover:text-red-400 rounded-lg hover:bg-nt-surface transition-colors"
            title="Denunciar Sala"
          >
            <Flag className="w-4 h-4" />
          </button>

          {isMember && (
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 text-nt-muted hover:text-red-400 rounded-lg hover:bg-nt-surface transition-colors"
              title="Sair da Sala"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Banner de Expiração */}
      {isRoomExpired && (
        <div className="bg-red-950/80 border-b border-red-800 px-4 py-2 text-center text-xs text-red-200 font-semibold flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            Esta sala de 24 horas expirou. O envio de novas mensagens foi bloqueado.
          </span>
        </div>
      )}

      {/* 2. ÁREA CENTRAL: Chat + Painel de Participantes */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* CHAT CONTAINER */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Mensagens com Rolagem */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Mensagem de Boas-vindas / Contexto */}
            <div className="text-center py-6 px-4 max-w-lg mx-auto bg-nt-surface2/60 rounded-xl border border-nt-border">
              <h3 className="font-bold text-sm text-nt-text font-reading">{room.name}</h3>
              <p className="text-xs text-nt-muted mt-1 leading-relaxed font-reading">
                {room.description || 'Sessão aberta para interpretação textual.'}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-nt-dim">
                <span>Criada por @{room.owner?.username || 'anfitrião'}</span>
                <span>•</span>
                <span>Limite: {room.max_participants} intérpretes</span>
              </div>
            </div>

            {/* Listagem de Mensagens */}
            {messages.map((msg) => {
              const isOwnMessage = user?.id && msg.user_id === user.id
              const isNarrator = msg.mode === 'narrator'

              // MENSAGEM DO NARRADOR: Apresentação Nobre e Destacada
              if (isNarrator) {
                return (
                  <div
                    key={msg.id}
                    className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-nt-surface2 via-nt-surface3/80 to-nt-surface2 border border-nt-gold/30 text-center max-w-3xl mx-auto shadow-glow-gold relative group"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2 text-xs font-semibold uppercase tracking-widest text-nt-gold font-narrator">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Narrador • {formatTime(msg.created_at)}</span>
                    </div>

                    <div
                      className="rpg-text text-nt-text/95 leading-relaxed text-sm sm:text-base italic px-2 sm:px-6"
                      dangerouslySetInnerHTML={{ __html: parseRPGMarkdown(msg.content) }}
                    />

                    {isOwnMessage && !msg.is_deleted && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMessage(msg)
                            setMessageInput(msg.content)
                          }}
                          className="p-1 text-nt-dim hover:text-nt-text rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 text-nt-dim hover:text-red-400 rounded"
                          title="Apagar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              }

              // MENSAGEM DO PERSONAGEM
              return (
                <div key={msg.id} className="flex items-start gap-3.5 group max-w-4xl">
                  {/* Avatar do Personagem (Clicável -> abre ficha) */}
                  <div
                    onClick={() => {
                      if (msg.character_id) {
                        setInspectedCharacterId(msg.character_id)
                      }
                    }}
                    className="cursor-pointer transition-transform hover:scale-105 shrink-0 pt-0.5"
                    title="Clique para ver a ficha completa"
                  >
                    <Avatar
                      src={msg.character?.avatar_url}
                      alt={msg.character?.name || 'Personagem'}
                      fallbackText={msg.character?.name || '?'}
                      size="md"
                    />
                  </div>

                  {/* Corpo da Mensagem */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <button
                        onClick={() => {
                          if (msg.character_id) {
                            setInspectedCharacterId(msg.character_id)
                          }
                        }}
                        className="font-bold text-sm text-nt-text hover:text-nt-bordeaux transition-colors"
                      >
                        {msg.character?.name || 'Personagem Desconhecido'}
                      </button>

                      {msg.character?.nickname && (
                        <span className="text-[11px] text-nt-dim font-reading italic hidden sm:inline">
                          "{msg.character.nickname}"
                        </span>
                      )}

                      <span className="text-[11px] text-nt-dim">
                        @{msg.profile?.username} • {formatTime(msg.created_at)}
                      </span>

                      {msg.is_edited && (
                        <span className="text-[10px] text-nt-dim italic">(editada)</span>
                      )}
                    </div>

                    {/* Resposta a outra mensagem */}
                    {msg.reply_to && (
                      <div className="mb-1.5 p-2 rounded-lg bg-nt-surface2 border-l-2 border-nt-bordeaux text-xs text-nt-dim flex items-center gap-1.5">
                        <CornerDownRight className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Em resposta a <strong>{msg.reply_to.character?.name || 'Narrador'}</strong>:{' '}
                          {msg.reply_to.content}
                        </span>
                      </div>
                    )}

                    {/* Conteúdo com Formatação Segura */}
                    <div
                      className="rpg-text text-sm sm:text-base text-nt-text leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: parseRPGMarkdown(msg.content) }}
                    />
                  </div>

                  {/* Ações ao Passar o Mouse */}
                  {!isRoomExpired && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1.5 text-nt-dim hover:text-nt-text hover:bg-nt-surface2 rounded-lg transition-colors"
                        title="Responder"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                      </button>

                      {isOwnMessage && !msg.is_deleted && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessage(msg)
                              setMessageInput(msg.content)
                            }}
                            className="p-1.5 text-nt-dim hover:text-nt-text hover:bg-nt-surface2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 text-nt-dim hover:text-red-400 hover:bg-nt-surface2 rounded-lg transition-colors"
                            title="Apagar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 3. BARRA DE ENTRADA / EDITOR TEXTUAL */}
          <div className="p-3 sm:p-4 bg-nt-surface2 border-t border-nt-border z-10 shrink-0">
            {/* Aviso de Resposta */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-nt-surface rounded-lg border border-nt-border flex items-center justify-between text-xs text-nt-muted">
                <span className="truncate">
                  Respondendo a <strong>{replyingTo.character?.name || 'Narrador'}</strong>:{' '}
                  {replyingTo.content}
                </span>
                <button onClick={() => setReplyingTo(null)} className="p-1 text-nt-dim hover:text-nt-text">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Aviso de Edição */}
            {editingMessage && (
              <div className="mb-2 p-2 bg-amber-950/30 rounded-lg border border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
                <span>Editando mensagem anterior...</span>
                <button
                  onClick={() => {
                    setEditingMessage(null)
                    setMessageInput('')
                  }}
                  className="p-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Toolbar de Formatação Rica e Seleção de Modo */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-nt-border/60">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 rounded hover:bg-nt-surface text-nt-muted hover:text-nt-text"
                  title="Negrito (**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 rounded hover:bg-nt-surface text-nt-muted hover:text-nt-text"
                  title="Itálico (*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('~~', '~~')}
                  className="p-1.5 rounded hover:bg-nt-surface text-nt-muted hover:text-nt-text"
                  title="Tachado (~~)"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="p-1.5 rounded hover:bg-nt-surface text-nt-muted hover:text-nt-text"
                  title="Citação (>)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Seletor de Modo: Personagem vs Narrador */}
              <div className="flex items-center gap-1 bg-nt-surface p-0.5 rounded-lg border border-nt-border">
                <button
                  type="button"
                  onClick={() => setMessageMode('character')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    messageMode === 'character'
                      ? 'bg-nt-bordeaux text-white shadow-sm'
                      : 'text-nt-muted hover:text-nt-text'
                  }`}
                >
                  {currentUserCharacter && (
                    <Avatar
                      src={currentUserCharacter.avatar_url}
                      alt={currentUserCharacter.name}
                      fallbackText={currentUserCharacter.name}
                      size="xs"
                    />
                  )}
                  <span>{currentUserCharacter?.name || 'Personagem'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMessageMode('narrator')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    messageMode === 'narrator'
                      ? 'bg-nt-gold text-nt-bg font-bold shadow-sm'
                      : 'text-nt-muted hover:text-nt-gold'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Narrador</span>
                </button>
              </div>
            </div>

            {/* Input e Botão de Enviar */}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                disabled={isRoomExpired || !isMember}
                placeholder={
                  isRoomExpired
                    ? 'Sala expirada. Envio bloqueado.'
                    : !isMember
                    ? 'Escolha seu personagem para ingressar na conversa...'
                    : messageMode === 'narrator'
                    ? 'Descreva a cena como Narrador (ambiente, sons, eventos)...'
                    : `Interprete como ${currentUserCharacter?.name || 'seu personagem'}... (Shift+Enter para quebra)`
                }
                className="flex-1 bg-nt-surface border border-nt-border rounded-xl p-3 text-xs sm:text-sm text-nt-text placeholder:text-nt-dim focus:outline-none focus:border-nt-bordeaux focus:ring-1 focus:ring-nt-bordeaux resize-none min-h-[46px] max-h-36 disabled:opacity-50"
                rows={1}
                maxLength={3000}
              />

              <Button
                type="submit"
                variant={messageMode === 'narrator' ? 'gold' : 'primary'}
                size="md"
                disabled={!messageInput.trim() || isRoomExpired || !isMember}
                loading={isSending}
                className="h-[46px] px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* 4. PAINEL LATERAL: Participantes da Sala */}
        {isParticipantsOpen && (
          <aside className="w-64 sm:w-72 bg-nt-surface border-l border-nt-border flex flex-col justify-between p-4 z-20 shrink-0 animate-fade-in">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-nt-border pb-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Participantes ({members.length})
                </h3>
                <button
                  onClick={() => setIsParticipantsOpen(false)}
                  className="p-1 text-nt-dim hover:text-nt-text"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {members.map((mem) => {
                  const isOnline = onlineUserIds.has(mem.user_id)
                  const isMemOwner = mem.user_id === room.owner_id

                  return (
                    <div
                      key={mem.id}
                      className="p-2.5 rounded-xl bg-nt-surface2 border border-nt-border/60 flex items-center justify-between group"
                    >
                      <div
                        onClick={() => {
                          if (mem.character_id) {
                            setInspectedCharacterId(mem.character_id)
                          }
                        }}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                        title="Ver ficha do personagem"
                      >
                        <Avatar
                          src={mem.character?.avatar_url}
                          alt={mem.character?.name || 'Membro'}
                          fallbackText={mem.character?.name || '?'}
                          size="sm"
                          isOnline={isOnline}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-nt-text truncate leading-tight hover:text-nt-bordeaux transition-colors">
                            {mem.character?.name}
                          </p>
                          <p className="text-[10px] text-nt-dim truncate">
                            @{mem.profile?.username} {isMemOwner && '• Dono'}
                          </p>
                        </div>
                      </div>

                      {/* Botão de Expulsar para o Dono */}
                      {isOwner && mem.user_id !== user?.id && (
                        <button
                          onClick={() => handleKickMember(mem.user_id)}
                          className="p-1 text-nt-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Expulsar participante"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rodapé do Painel */}
            <div className="pt-3 border-t border-nt-border text-[11px] text-nt-dim">
              <span>Máximo suportado: {room.max_participants} intérpretes</span>
            </div>
          </aside>
        )}
      </div>

      {/* Modal: Seleção de Personagem ao Entrar na Sala */}
      <Modal
        isOpen={isJoinModalOpen && !isMember}
        onClose={() => {
          if (!isMember) navigate('/app/rooms')
        }}
        title="Escolha seu Personagem"
        description="Selecione com qual identidade você interpretará nesta sala."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {userCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => setSelectedCharacterId(char.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedCharacterId === char.id
                    ? 'bg-nt-bordeaux/15 border-nt-bordeaux shadow-glow-bordeaux'
                    : 'bg-nt-surface2 border-nt-border hover:border-nt-border2'
                }`}
              >
                <Avatar
                  src={char.avatar_url}
                  alt={char.name}
                  fallbackText={char.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-nt-text truncate">{char.name}</h4>
                  <p className="text-[11px] text-nt-dim">
                    {char.pronoun} • {char.age} anos
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-nt-border">
            <Button variant="secondary" size="sm" onClick={() => navigate('/app/rooms')}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isJoining}
              disabled={!selectedCharacterId}
              onClick={handleJoinRoom}
            >
              Ingressar na Sala
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Ficha Completa do Personagem */}
      <CharacterSheetModal
        isOpen={Boolean(inspectedCharacterId)}
        onClose={() => setInspectedCharacterId(null)}
        characterId={inspectedCharacterId}
        communityId={room.community_id}
      />

      {/* Modal: Denúncia da Sala */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="room"
        targetId={room.id}
        targetName={`Sala: ${room.name}`}
      />
    </div>
  )
}
