import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar,
  Edit,
  Shield,
  UserCheck,
  Flag,
  Users,
  Compass,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Profile, Character, Community } from '../../types'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { formatDateTime } from '../../utils/formatters'
import { ReportModal } from '../../components/reports/ReportModal'

export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { profile: currentProfile, user } = useAuth()

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const isOwnProfile =
    currentProfile?.username === username || (user?.id && targetProfile?.id === user.id)

  useEffect(() => {
    async function loadProfileData() {
      if (!username) return
      setIsLoading(true)

      try {
        // 1. Carregar perfil pelo username
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle()

        if (profErr || !prof) {
          setTargetProfile(null)
          setIsLoading(false)
          return
        }

        setTargetProfile(prof)

        // 2. Carregar personagens públicos (ou todos se for o dono)
        let charQuery = supabase
          .from('characters')
          .select('*')
          .eq('user_id', prof.id)
          .order('created_at', { ascending: false })

        if (!isOwnProfile) {
          charQuery = charQuery.eq('is_public', true)
        }

        const { data: charData } = await charQuery
        setCharacters(charData || [])

        // 3. Carregar comunidades em que é membro
        const { data: memberData } = await supabase
          .from('community_members')
          .select('community:communities(*)')
          .eq('user_id', prof.id)
          .limit(6)

        const comms = (memberData || [])
          .map((m: any) => m.community)
          .filter(Boolean) as Community[]

        setCommunities(comms)
      } catch (err) {
        console.error('Erro ao buscar dados do perfil:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [username, isOwnProfile])

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando perfil...</span>
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-reading mb-2">Usuário não encontrado</h2>
        <p className="text-sm text-nt-muted mb-6">
          O perfil @{username} não existe ou foi removido.
        </p>
        <Link to="/app/feed">
          <Button variant="secondary">Voltar ao Feed</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Banner & Header do Perfil */}
      <div className="bg-nt-surface border border-nt-border rounded-2xl overflow-hidden relative shadow-subtle">
        {/* Banner com Capa */}
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-nt-surface2 via-nt-bordeaux-deep to-nt-surface relative">
          {targetProfile.banner_url && (
            <img
              src={targetProfile.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-nt-surface via-transparent to-transparent opacity-80" />
        </div>

        {/* Informações Principais */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="p-1 rounded-full bg-nt-surface border-2 border-nt-border shadow-lg">
              <Avatar
                src={targetProfile.avatar_url}
                alt={targetProfile.display_name || targetProfile.username}
                fallbackText={targetProfile.display_name || targetProfile.username}
                size="2xl"
              />
            </div>

            <div className="mb-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-nt-text">
                  {targetProfile.display_name || targetProfile.username}
                </h1>
                {targetProfile.role !== 'user' && (
                  <Badge variant="gold" size="sm">
                    <Shield className="w-3 h-3 mr-1" /> {targetProfile.role}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-nt-dim">@{targetProfile.username}</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 mb-2">
            {isOwnProfile ? (
              <Link to="/app/profile/edit">
                <Button variant="secondary" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Editar Perfil
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                leftIcon={<Flag className="w-3.5 h-3.5" />}
              >
                Denunciar
              </Button>
            )}
          </div>
        </div>

        {/* Bio e Metadados */}
        <div className="px-6 pb-6 border-t border-nt-border pt-4 text-left">
          {targetProfile.bio ? (
            <p className="text-sm text-nt-text/90 leading-relaxed max-w-3xl whitespace-pre-line font-reading">
              {targetProfile.bio}
            </p>
          ) : (
            <p className="text-xs text-nt-dim italic">Nenhuma biografia fornecida.</p>
          )}

          <div className="flex flex-wrap items-center gap-6 mt-4 text-xs text-nt-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-nt-dim" />
              Membro desde {formatDateTime(targetProfile.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-nt-dim" />
              {characters.length} Personagens
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-nt-dim" />
              {communities.length} Comunidades
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Personagens do Usuário */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-nt-text flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-nt-bordeaux" />
            Personagens ({characters.length})
          </h2>
          {isOwnProfile && (
            <Link to="/app/characters/new">
              <Button variant="primary" size="sm">
                Novo Personagem
              </Button>
            </Link>
          )}
        </div>

        {characters.length === 0 ? (
          <Card bordered className="text-center py-10">
            <UserCheck className="w-8 h-8 text-nt-dim mx-auto mb-2 opacity-50" />
            <p className="text-xs text-nt-muted">Nenhum personagem público cadastrado ainda.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <Link key={char.id} to={`/app/characters/${char.id}`}>
                <Card hover bordered className="p-4 flex items-start gap-3 text-left">
                  <Avatar
                    src={char.avatar_url}
                    alt={char.name}
                    fallbackText={char.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-nt-text truncate">{char.name}</h3>
                    {char.nickname && (
                      <p className="text-xs text-nt-dim truncate font-reading">"{char.nickname}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" size="sm">
                        {char.pronoun}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {char.age} anos
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Comunidades do Usuário */}
      {communities.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-nt-text flex items-center gap-2">
            <Users className="w-5 h-5 text-nt-gold" />
            Comunidades
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {communities.map((comm) => (
              <Link key={comm.id} to={`/app/communities/${comm.slug}`}>
                <Card hover bordered className="p-3.5 flex items-center gap-3 text-left">
                  <Avatar
                    src={comm.avatar_url}
                    alt={comm.name}
                    fallbackText={comm.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-nt-text truncate">
                      {comm.name}
                    </h3>
                    <p className="text-[11px] text-nt-dim truncate">{comm.category}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="user"
        targetId={targetProfile.id}
        targetName={`@${targetProfile.username}`}
      />
    </div>
  )
}
