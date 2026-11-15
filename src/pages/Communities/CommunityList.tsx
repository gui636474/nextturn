import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Search, Filter, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Community } from '../../types'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

const CATEGORIES = [
  'Todas',
  'Fantasia Medieval',
  'Horror & Sobrenatural',
  'Sci-Fi & Cyberpunk',
  'Fandom & Universos Populares',
  'Aventura & Exploração',
  'Romance & Drama',
  'Histórico',
  'Geral',
]

export function CommunityList() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCommunities() {
      setIsLoading(true)
      try {
        let query = supabase
          .from('communities')
          .select('*, owner:profiles(username, display_name)')
          .eq('is_active', true)
          .order('member_count', { ascending: false })

        if (selectedCategory !== 'Todas') {
          query = query.eq('category', selectedCategory)
        }

        if (search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`)
        }

        const { data, error } = await query
        if (error) throw error
        setCommunities(data || [])
      } catch (err) {
        console.error('Erro ao buscar comunidades:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadCommunities, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-nt-border">
        <div>
          <h1 className="text-2xl font-bold font-reading text-nt-text flex items-center gap-2.5">
            <Users className="w-6 h-6 text-nt-bordeaux" />
            Comunidades de RPG
          </h1>
          <p className="text-xs sm:text-sm text-nt-muted mt-0.5">
            Participe de universos temáticos, interprete e preencha fichas exclusivas
          </p>
        </div>

        <Link to="/app/communities/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Criar Comunidade
          </Button>
        </Link>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome da comunidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Categorias Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-nt-bordeaux text-white shadow-glow-bordeaux'
                  : 'bg-nt-surface2 text-nt-muted hover:text-nt-text hover:bg-nt-surface3 border border-nt-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Comunidades */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-nt-muted">Buscando comunidades...</span>
        </div>
      ) : communities.length === 0 ? (
        <Card bordered className="text-center py-16 px-4">
          <Users className="w-12 h-12 text-nt-dim mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-nt-text font-reading">Nenhuma comunidade encontrada</h3>
          <p className="text-xs text-nt-muted mt-1 mb-6">
            Não encontramos comunidades correspondentes a esta busca. Que tal fundar a sua própria?
          </p>
          <Link to="/app/communities/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Criar Nova Comunidade
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((comm) => (
            <Link key={comm.id} to={`/app/communities/${comm.slug}`} className="group">
              <Card bordered hover className="overflow-hidden p-0 h-full flex flex-col">
                {/* Capa */}
                <div className="h-28 w-full bg-gradient-to-r from-nt-surface3 via-nt-bordeaux-deep to-nt-surface2 relative">
                  {comm.cover_url && (
                    <img
                      src={comm.cover_url}
                      alt={comm.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="gold" size="sm">
                      {comm.category}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5 pt-0 flex-1 flex flex-col justify-between relative -mt-7">
                  <div>
                    <div className="flex items-end gap-3 mb-3">
                      <div className="p-0.5 rounded-xl bg-nt-surface border border-nt-border shadow-md">
                        <Avatar
                          src={comm.avatar_url}
                          alt={comm.name}
                          fallbackText={comm.name}
                          size="lg"
                          className="rounded-lg"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <h3 className="font-bold text-base text-nt-text group-hover:text-nt-bordeaux transition-colors truncate">
                          {comm.name}
                        </h3>
                        {comm.fandom && (
                          <p className="text-xs text-nt-dim truncate font-reading italic">
                            {comm.fandom}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-nt-muted line-clamp-3 leading-relaxed font-reading mb-4">
                      {comm.description || 'Comunidade dedicada à interpretação textual imersiva.'}
                    </p>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-3 border-t border-nt-border flex items-center justify-between text-xs text-nt-dim">
                    <span className="flex items-center gap-1.5 font-medium text-nt-text">
                      <Users className="w-3.5 h-3.5 text-nt-gold" />
                      {comm.member_count} {comm.member_count === 1 ? 'membro' : 'membros'}
                    </span>
                    <span className="text-nt-bordeaux font-semibold group-hover:translate-x-1 transition-transform">
                      Entrar →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
