import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MessageSquare,
  Globe,
  Lock,
  ShieldAlert,
  ArrowLeft,
  Users,
  Copy,
  Check,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Character, Community, RoomType } from '../../types'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'

const CATEGORIES = [
  { label: 'Aventura & Combate', value: 'Aventura & Combate' },
  { label: 'Mistério & Investigação', value: 'Mistério & Investigação' },
  { label: 'Terror & Sobrenatural', value: 'Terror & Sobrenatural' },
  { label: 'Romance & Drama', value: 'Romance & Drama' },
  { label: 'Fantasia & Magia', value: 'Fantasia & Magia' },
  { label: 'Sci-Fi & Cyberpunk', value: 'Sci-Fi & Cyberpunk' },
  { label: 'Geral', value: 'Geral' },
]

export function RoomCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preSelectedCommunityId = searchParams.get('community')
  const { user } = useAuth()

  // Campos do Formulário
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [communityId, setCommunityId] = useState(preSelectedCommunityId || '')
  const [category, setCategory] = useState('Aventura & Combate')
  const [type, setType] = useState<RoomType>('public')
  const [maxParticipants, setMaxParticipants] = useState(20)
  const [selectedCharacterId, setSelectedCharacterId] = useState('')

  // Listagens auxiliares
  const [userCharacters, setUserCharacters] = useState<Character[]>([])
  const [communities, setCommunities] = useState<Community[]>([])

  // Estados de Interface
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal de Sucesso com Código Privado
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ id: string; code?: string } | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    async function loadAuxiliaryData() {
      if (!user?.id) return
      setIsLoadingData(true)

      try {
        // 1. Carregar personagens do usuário
        const { data: chars } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        setUserCharacters(chars || [])
        if (chars && chars.length > 0) {
          setSelectedCharacterId(chars[0].id)
        }

        // 2. Carregar comunidades em que o usuário participa
        const { data: memData } = await supabase
          .from('community_members')
          .select('community:communities(*)')
          .eq('user_id', user.id)

        const comms = (memData || [])
          .map((m: any) => m.community)
          .filter(Boolean) as Community[]

        setCommunities(comms)
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadAuxiliaryData()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome da sala é obrigatório.')
      return
    }

    if (!selectedCharacterId) {
      setError('Selecione o personagem que você utilizará nesta sala.')
      return
    }

    if (!user?.id) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Criar sala (expires_at é definido no banco como NOW() + INTERVAL '24 hours')
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          community_id: communityId || null,
          category,
          type,
          max_participants: Number(maxParticipants),
          owner_id: user.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // 2. Inserir criador na sala atomicamente usando join_room_atomic
      const { data: joinResult, error: joinErr } = await supabase.rpc('join_room_atomic', {
        p_room_id: newRoom.id,
        p_user_id: user.id,
        p_character_id: selectedCharacterId,
      })

      if (joinErr) throw joinErr

      // 3. Se a sala for privada, gerar código exclusivo via RPC backend
      let generatedCode: string | undefined = undefined
      if (type === 'private') {
        const { data: codeData, error: codeErr } = await supabase.rpc('generate_room_code', {
          p_room_id: newRoom.id,
        })
        if (!codeErr && codeData) {
          generatedCode = codeData
        }
      }

      if (generatedCode) {
        setCreatedRoomInfo({ id: newRoom.id, code: generatedCode })
      } else {
        navigate(`/app/rooms/${newRoom.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao criar sala.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    if (createdRoomInfo?.code) {
      navigator.clipboard.writeText(createdRoomInfo.code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  if (isLoadingData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Preparando criação de sala...</span>
      </div>
    )
  }

  if (userCharacters.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <Users className="w-12 h-12 text-nt-gold mx-auto" />
        <h2 className="text-xl font-bold font-reading">Crie um personagem antes de abrir uma sala</h2>
        <p className="text-xs text-nt-muted leading-relaxed">
          Para entrar ou criar uma sala, você precisa de uma identidade de personagem.
        </p>
        <Button variant="primary" onClick={() => navigate('/app/characters/new')}>
          Criar Personagem Agora
        </Button>
      </div>
    )
  }

  const selectedChar = userCharacters.find((c) => c.id === selectedCharacterId)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-nt-text font-reading">Criar Sala de RPG</h1>
          <p className="text-xs text-nt-muted flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-nt-gold" />
            Todas as salas expiram 24 horas após sua criação para manter sessões dinâmicas
          </p>
        </div>
      </div>

      <Card bordered className="p-6 sm:p-8">
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Personagem para entrar na sala */}
          <div className="p-4 bg-nt-surface2 rounded-xl border border-nt-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedChar && (
                <Avatar
                  src={selectedChar.avatar_url}
                  alt={selectedChar.name}
                  fallbackText={selectedChar.name}
                  size="lg"
                />
              )}
              <div>
                <span className="text-xs font-semibold text-nt-gold uppercase tracking-wider block">
                  Seu Personagem nesta Sessão *
                </span>
                <span className="font-bold text-sm text-nt-text">{selectedChar?.name}</span>
              </div>
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                options={userCharacters.map((c) => ({
                  label: `${c.name} (${c.pronoun})`,
                  value: c.id,
                }))}
              />
            </div>
          </div>

          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da Sala"
              placeholder="ex: A Taverna do Javali Negro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />

            <Select
              label="Categoria da Sessão"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              required
            />
          </div>

          {/* Comunidade Vinculada (Opcional) */}
          <Select
            label="Vincular a uma Comunidade (Opcional)"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            helperText="Salas vinculadas a comunidades utilizam o universo e as fichas personalizadas daquela comunidade."
            options={[
              { label: 'Nenhuma comunidade (Sessão Independente / Geral)', value: '' },
              ...communities.map((c) => ({ label: c.name, value: c.id })),
            ]}
          />

          {/* Descrição e Premissa */}
          <Textarea
            label="Premissa da Sessão & Sinopse"
            placeholder="Descreva o cenário inicial, o clima, clima de tensão e objetivo da cena..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            showCount
            rows={3}
          />

          {/* Tipo de Acesso e Limite de Participantes */}
          <div className="border-t border-nt-border pt-5 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-nt-gold">
              Tipo de Acesso
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'public',
                  title: 'Pública',
                  desc: 'Aparece no feed e na lista de salas abertas para todos.',
                  icon: Globe,
                },
                {
                  id: 'private',
                  title: 'Privada (Código)',
                  desc: 'Apenas quem possuir o código exclusivo de 8 dígitos.',
                  icon: Lock,
                },
                {
                  id: 'restricted',
                  title: 'Restrita',
                  desc: 'Apenas convidados autorizados pelo criador.',
                  icon: ShieldAlert,
                },
              ].map((opt) => {
                const Icon = opt.icon
                const isSelected = type === opt.id

                return (
                  <div
                    key={opt.id}
                    onClick={() => setType(opt.id as RoomType)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-nt-bordeaux/15 border-nt-bordeaux text-white shadow-glow-bordeaux'
                        : 'bg-nt-surface2 border-nt-border hover:border-nt-border2 text-nt-muted hover:text-nt-text'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-semibold text-sm">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-nt-bordeaux' : 'text-nt-dim'}`} />
                      <span>{opt.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-80">{opt.desc}</p>
                  </div>
                )
              })}
            </div>

            <div className="w-full sm:w-48 pt-2">
              <Input
                label="Limite de Vagas (2 a 100)"
                type="number"
                min={2}
                max={100}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-6 border-t border-nt-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Iniciar Sala de RPG
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal de Sucesso com Código Privado */}
      {createdRoomInfo && (
        <Modal
          isOpen={true}
          onClose={() => navigate(`/app/rooms/${createdRoomInfo.id}`)}
          title="Sala Privada Criada!"
        >
          <div className="space-y-4 text-center py-2">
            <p className="text-xs sm:text-sm text-nt-muted leading-relaxed">
              Sua sala foi gerada com segurança no servidor. Compartilhe o código exclusivo abaixo com
              seus amigos para que eles possam ingressar:
            </p>

            <div className="p-4 bg-nt-surface2 border border-nt-bordeaux/40 rounded-xl flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-nt-gold">
                {createdRoomInfo.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-nt-surface3 hover:bg-nt-border text-nt-text transition-colors"
                title="Copiar Código"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-nt-dim">
              O código não é exibido em listagens públicas e expira junto com a sala em 24h.
            </p>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-4"
              onClick={() => navigate(`/app/rooms/${createdRoomInfo.id}`)}
            >
              Entrar na Sala Agora
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
