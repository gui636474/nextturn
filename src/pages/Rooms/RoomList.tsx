import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Plus,
  KeyRound,
  Search,
  Clock,
  Users,
  Flame,
  Globe,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Room } from '../../types'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { formatExpiryCountdown } from '../../utils/formatters'

const ROOM_CATEGORIES = [
  'Todas',
  'Aventura & Combate',
  'Mistério & Investigação',
  'Terror & Sobrenatural',
  'Romance & Drama',
  'Fantasia & Magia',
  'Sci-Fi & Cyberpunk',
  'Geral',
]

export function RoomList() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [isLoading, setIsLoading] = useState(true)

  // Modal para Entrar em Sala Privada com Código
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [privateCode, setPrivateCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [isValidatingCode, setIsValidatingCode] = useState(false)

  useEffect(() => {
    async function loadRooms() {
      setIsLoading(true)
      try {
        let query = supabase
          .from('rooms')
          .select('*, community:communities(name, slug)')
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (category !== 'Todas') {
          query = query.eq('category', category)
        }

        if (search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`)
        }

        const { data, error } = await query
        if (error) throw error
        setRooms(data || [])
      } catch (err) {
        console.error('Erro ao carregar salas:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadRooms, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  const handleValidatePrivateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError(null)

    if (!privateCode.trim()) {
      setCodeError('Digite o código de acesso exclusivo.')
      return
    }

    setIsValidatingCode(true)

    try {
      // Chama a função atômica segura no PostgreSQL (não expõe códigos aos clientes)
      const { data: roomId, error } = await supabase.rpc('validate_room_code', {
        p_code: privateCode.trim().toUpperCase(),
      })

      if (error || !roomId) {
        setCodeError('Código inválido ou a sala já expirou/encerrou.')
        return
      }

      setIsCodeModalOpen(false)
      navigate(`/app/rooms/${roomId}`)
    } catch (err: any) {
      setCodeError(err.message || 'Erro ao validar código.')
    } finally {
      setIsValidatingCode(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-nt-border">
        <div>
          <h1 className="text-2xl font-bold font-reading text-nt-text flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-nt-bordeaux" />
            Salas de Interpretação
          </h1>
          <p className="text-xs sm:text-sm text-nt-muted mt-0.5">
            Sessões temporárias em tempo real • Todas as salas expiram automaticamente em 24h
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsCodeModalOpen(true)}
            leftIcon={<KeyRound className="w-4 h-4 text-nt-gold" />}
          >
            Código de Acesso
          </Button>

          <Link to="/app/rooms/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Criar Sala
            </Button>
          </Link>
        </div>
      </div>

      {/* Busca e Categorias */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar salas abertas pelo nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {ROOM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-nt-bordeaux text-white shadow-glow-bordeaux'
                  : 'bg-nt-surface2 text-nt-muted hover:text-nt-text hover:bg-nt-surface3 border border-nt-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Salas */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-nt-muted">Carregando salas ativas...</span>
        </div>
      ) : rooms.length === 0 ? (
        <Card bordered className="text-center py-16 px-4">
          <MessageSquare className="w-12 h-12 text-nt-dim mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-nt-text font-reading">Nenhuma sala ativa encontrada</h3>
          <p className="text-xs text-nt-muted mt-1 mb-6 max-w-md mx-auto leading-relaxed">
            Todas as salas antigas expiraram ou nenhuma foi criada com este filtro. Inicie uma nova
            sessão agora e convide outros jogadores!
          </p>
          <Link to="/app/rooms/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Abrir Nova Sala
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const expiry = formatExpiryCountdown(room.expires_at)
            const isFull = room.participant_count >= room.max_participants

            return (
              <Link key={room.id} to={`/app/rooms/${room.id}`} className="group">
                <Card bordered hover className="p-5 flex flex-col justify-between h-full relative">
                  <div>
                    {/* Cabeçalho do Card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {room.category}
                        </Badge>
                        {room.community && (
                          <Badge variant="gold" size="sm">
                            {room.community.name}
                          </Badge>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          expiry.isImminent
                            ? 'bg-red-950/40 text-red-300 border border-red-800/40 animate-pulse'
                            : 'text-nt-dim bg-nt-surface2'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {expiry.text}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-nt-text group-hover:text-nt-bordeaux transition-colors line-clamp-1 mb-1.5">
                      {room.name}
                    </h3>

                    <p className="text-xs text-nt-muted line-clamp-3 leading-relaxed font-reading mb-4">
                      {room.description || 'Sessão de RPG textual em tempo real.'}
                    </p>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-3 border-t border-nt-border flex items-center justify-between text-xs">
                    <span
                      className={`flex items-center gap-1.5 font-medium ${
                        isFull ? 'text-amber-400' : 'text-nt-dim'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {room.participant_count} / {room.max_participants} jogadores{' '}
                      {isFull && '(Lotada)'}
                    </span>

                    <span className="text-nt-bordeaux font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Entrar <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal: Entrar com Código de Acesso Exclusivo */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="Acessar Sala Privada"
        description="Digite o código exclusivo compartilhado com você pelo criador da sala."
      >
        <form onSubmit={handleValidatePrivateCode} className="space-y-4">
          {codeError && (
            <div className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">
              {codeError}
            </div>
          )}

          <Input
            placeholder="Ex: 8A4F19C2"
            value={privateCode}
            onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
            required
            className="uppercase tracking-widest font-mono text-center text-lg py-2.5"
            maxLength={16}
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCodeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isValidatingCode}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Validar e Entrar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
