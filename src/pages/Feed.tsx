import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Compass,
  MessageSquare,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Room, Community, Character } from '../types'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { formatExpiryCountdown } from '../utils/formatters'

export function Feed() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const { profile } = useAuth()

  const [activeRooms, setActiveRooms] = useState<Room[]>([])
  const [trendingCommunities, setTrendingCommunities] = useState<Community[]>([])
  const [recentCharacters, setRecentCharacters] = useState<Character[]>([])
  const [feedFilter, setFeedFilter] = useState<'all' | 'rooms' | 'communities'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true)

      try {
        // 1. Carregar salas públicas ativas
        let roomQuery = supabase
          .from('rooms')
          .select('*, community:communities(name, slug)')
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(8)

        if (searchQuery) {
          roomQuery = roomQuery.ilike('name', `%${searchQuery}%`)
        }

        const { data: roomData } = await roomQuery
        setActiveRooms(roomData || [])

        // 2. Carregar comunidades em destaque
        let commQuery = supabase
          .from('communities')
          .select('*')
          .eq('is_active', true)
          .order('member_count', { ascending: false })
          .limit(6)

        if (searchQuery) {
          commQuery = commQuery.ilike('name', `%${searchQuery}%`)
        }

        const { data: commData } = await commQuery
        setTrendingCommunities(commData || [])

        // 3. Personagens recentes públicos
        const { data: charData } = await supabase
          .from('characters')
          .select('*, profile:profiles(username)')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6)

        setRecentCharacters(charData || [])
      } catch (err) {
        console.error('Erro ao carregar feed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeed()
  }, [searchQuery])

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-6xl mx-auto">
      {/* Banner de Boas-Vindas */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-nt-surface via-nt-bordeaux-deep/40 to-nt-surface border border-nt-border relative overflow-hidden shadow-subtle">
        <div className="relative z-10 max-w-xl">
          <Badge variant="gold" size="sm" className="mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Olá, {profile?.display_name || profile?.username}
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold font-reading text-nt-text leading-tight">
            Pronto para o seu próximo turno?
          </h1>
          <p className="text-xs sm:text-sm text-nt-muted mt-1 leading-relaxed">
            Descubra salas de interpretação ao vivo, participe de comunidades temáticas ou crie novas
            aventuras para seus personagens.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link to="/app/rooms/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Nova Sala de RPG
              </Button>
            </Link>
            <Link to="/app/communities">
              <Button variant="secondary" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
                Explorar Universos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros do Feed */}
      <div className="flex items-center justify-between border-b border-nt-border pb-2">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'Tudo' },
            { key: 'rooms', label: `Salas Abertas (${activeRooms.length})` },
            { key: 'communities', label: `Comunidades (${trendingCommunities.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFeedFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                feedFilter === tab.key
                  ? 'bg-nt-bordeaux text-white shadow-glow-bordeaux'
                  : 'bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-nt-muted">Carregando feed de aventuras...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Principal: Salas Ativas (8 colunas) */}
          {(feedFilter === 'all' || feedFilter === 'rooms') && (
            <div className={feedFilter === 'rooms' ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-nt-text flex items-center gap-2">
                  <Flame className="w-4 h-4 text-nt-bordeaux" />
                  Salas ao Vivo Agora
                </h2>
                <Link
                  to="/app/rooms"
                  className="text-xs text-nt-bordeaux hover:underline font-semibold"
                >
                  Ver todas as salas →
                </Link>
              </div>

              {activeRooms.length === 0 ? (
                <Card bordered className="text-center py-10">
                  <p className="text-xs text-nt-muted">Nenhuma sala aberta no momento.</p>
                  <Link to="/app/rooms/new" className="mt-3 inline-block">
                    <Button variant="primary" size="sm">
                      Abrir uma Sala
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeRooms.map((room) => {
                    const expiry = formatExpiryCountdown(room.expires_at)
                    return (
                      <Link key={room.id} to={`/app/rooms/${room.id}`} className="group">
                        <Card hover bordered className="p-4 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" size="sm">
                                {room.category}
                              </Badge>
                              <span
                                className={`text-[11px] ${
                                  expiry.isImminent ? 'text-red-400 font-semibold' : 'text-nt-dim'
                                }`}
                              >
                                {expiry.text}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-nt-text group-hover:text-nt-bordeaux transition-colors truncate">
                              {room.name}
                            </h3>
                            {room.community && (
                              <p className="text-[11px] text-nt-gold truncate font-reading italic">
                                Universo: {room.community.name}
                              </p>
                            )}
                            <p className="text-xs text-nt-muted line-clamp-2 mt-1.5 font-reading">
                              {room.description || 'Interpretação textual em tempo real.'}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-nt-border flex items-center justify-between text-xs text-nt-dim">
                            <span>
                              {room.participant_count}/{room.max_participants} intérpretes
                            </span>
                            <span className="text-nt-bordeaux font-semibold group-hover:translate-x-1 transition-transform">
                              Entrar →
                            </span>
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Coluna Lateral: Comunidades em Destaque & Novos Personagens (4 colunas) */}
          {(feedFilter === 'all' || feedFilter === 'communities') && (
            <div
              className={
                feedFilter === 'communities' ? 'lg:col-span-12 space-y-6' : 'lg:col-span-4 space-y-6'
              }
            >
              {/* Comunidades Populares */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-nt-text flex items-center gap-2">
                    <Users className="w-4 h-4 text-nt-gold" />
                    Comunidades em Alta
                  </h3>
                  <Link
                    to="/app/communities"
                    className="text-xs text-nt-dim hover:text-nt-text transition-colors"
                  >
                    Ver todas
                  </Link>
                </div>

                <div className="space-y-2">
                  {trendingCommunities.map((comm) => (
                    <Link key={comm.id} to={`/app/communities/${comm.slug}`}>
                      <div className="p-3 rounded-xl bg-nt-surface border border-nt-border hover:border-nt-border2 hover:bg-nt-surface2 transition-all flex items-center gap-3">
                        <Avatar
                          src={comm.avatar_url}
                          alt={comm.name}
                          fallbackText={comm.name}
                          size="md"
                          className="rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs text-nt-text truncate leading-tight">
                            {comm.name}
                          </h4>
                          <p className="text-[10px] text-nt-dim truncate mt-0.5">
                            {comm.member_count} membros • {comm.category}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Personagens Recentes */}
              {recentCharacters.length > 0 && feedFilter === 'all' && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-nt-text flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-nt-bordeaux" />
                    Novos Personagens
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {recentCharacters.map((char) => (
                      <Link key={char.id} to={`/app/characters/${char.id}`}>
                        <div className="p-2.5 rounded-xl bg-nt-surface border border-nt-border hover:border-nt-border2 text-center group transition-colors">
                          <Avatar
                            src={char.avatar_url}
                            alt={char.name}
                            fallbackText={char.name}
                            size="md"
                            className="mx-auto mb-1.5"
                          />
                          <p className="font-semibold text-xs text-nt-text truncate group-hover:text-nt-bordeaux transition-colors">
                            {char.name}
                          </p>
                          <p className="text-[10px] text-nt-dim truncate">
                            @{char.profile?.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
