import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCheck, Plus, Sparkles, Lock, Globe, Edit2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Character } from '../../types'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

export function CharacterList() {
  const { user } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserCharacters() {
      if (!user?.id) return
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setCharacters(data || [])
      } catch (err) {
        console.error('Erro ao buscar personagens:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCharacters()
  }, [user?.id])

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Topo / Header da Página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-nt-border">
        <div>
          <h1 className="text-2xl font-bold font-reading text-nt-text flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-nt-bordeaux" />
            Meus Personagens
          </h1>
          <p className="text-xs sm:text-sm text-nt-muted mt-0.5">
            Gerencie seus personagens e use-os em qualquer sala ou comunidade
          </p>
        </div>

        <Link to="/app/characters/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Novo Personagem
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-nt-muted">Carregando seus personagens...</span>
        </div>
      ) : characters.length === 0 ? (
        /* Empty State */
        <Card bordered className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-nt-surface2 border border-nt-border flex items-center justify-center mx-auto mb-4 text-nt-gold">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-nt-text font-reading">Nenhum personagem criado ainda</h3>
          <p className="text-xs sm:text-sm text-nt-muted max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Seus personagens são suas identidades interpretativas. Crie seu primeiro herói, vilão ou
            viajante para participar de salas e comunidades!
          </p>
          <Link to="/app/characters/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              Criar Primeiro Personagem
            </Button>
          </Link>
        </Card>
      ) : (
        /* Grid de Personagens */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map((char) => (
            <Card key={char.id} bordered hover className="p-5 flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      src={char.avatar_url}
                      alt={char.name}
                      fallbackText={char.name}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-bold text-base text-nt-text group-hover:text-nt-bordeaux transition-colors leading-tight">
                        {char.name} {char.surname && <span className="opacity-90">{char.surname}</span>}
                      </h3>
                      {char.nickname && (
                        <p className="text-xs text-nt-dim font-reading italic">"{char.nickname}"</p>
                      )}
                    </div>
                  </div>

                  <span
                    title={char.is_public ? 'Público' : 'Privado'}
                    className="p-1 rounded bg-nt-surface2 text-nt-dim"
                  >
                    {char.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </span>
                </div>

                {/* Badges de Atributos Básicos */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" size="sm">
                    {char.pronoun}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {char.age} anos
                  </Badge>
                </div>

                {/* Prévia da Biografia/Personalidade */}
                <p className="text-xs text-nt-muted line-clamp-3 leading-relaxed font-reading">
                  {char.biography || char.personality || char.history || 'Sem descrição adicional.'}
                </p>
              </div>

              {/* Ações do Card */}
              <div className="pt-4 mt-4 border-t border-nt-border flex items-center justify-between gap-2">
                <Link
                  to={`/app/characters/${char.id}`}
                  className="text-xs font-semibold text-nt-text hover:text-nt-bordeaux transition-colors"
                >
                  Ver Ficha Completa →
                </Link>

                <Link to={`/app/characters/${char.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 px-2.5" leftIcon={<Edit2 className="w-3 h-3" />}>
                    Editar
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
