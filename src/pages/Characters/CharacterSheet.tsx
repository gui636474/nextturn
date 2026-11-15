import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  UserCheck,
  Edit2,
  Flag,
  Calendar,
  Lock,
  Globe,
  ArrowLeft,
  ScrollText,
  User,
  Shield,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Character, Profile, CommunitySheetSubmission } from '../../types'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { formatDateTime } from '../../utils/formatters'
import { ReportModal } from '../../components/reports/ReportModal'

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [character, setCharacter] = useState<Character | null>(null)
  const [author, setAuthor] = useState<Profile | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [activeCommunityTab, setActiveCommunityTab] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const isOwnCharacter = user?.id && character?.user_id === user.id

  useEffect(() => {
    async function fetchCharacterDetails() {
      if (!id) return
      setIsLoading(true)

      try {
        // 1. Carregar personagem
        const { data: charData, error: charErr } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .single()

        if (charErr || !charData) {
          setCharacter(null)
          setIsLoading(false)
          return
        }

        setCharacter(charData)

        // 2. Carregar perfil do autor
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', charData.user_id)
          .single()

        setAuthor(profData)

        // 3. Carregar submissões deste personagem em comunidades
        const { data: subData } = await supabase
          .from('community_sheet_submissions')
          .select(`
            *,
            community:communities(id, name, slug, avatar_url, category)
          `)
          .eq('character_id', id)

        if (subData && subData.length > 0) {
          setSubmissions(subData)
          setActiveCommunityTab(subData[0].community_id)
        }
      } catch (err) {
        console.error('Erro ao carregar ficha do personagem:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCharacterDetails()
  }, [id])

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando ficha...</span>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold font-reading mb-2">Personagem não encontrado</h2>
        <p className="text-xs text-nt-muted mb-6">Esta ficha não existe ou foi excluída.</p>
        <Link to="/app/characters">
          <Button variant="secondary">Meus Personagens</Button>
        </Link>
      </div>
    )
  }

  const selectedSubmission = submissions.find((s) => s.community_id === activeCommunityTab)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Botão Voltar e Ações */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors flex items-center gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          {isOwnCharacter ? (
            <Link to={`/app/characters/${character.id}/edit`}>
              <Button variant="secondary" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
                Editar Ficha
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
              leftIcon={<Flag className="w-3.5 h-3.5" />}
            >
              Denunciar
            </Button>
          )}
        </div>
      </div>

      {/* Cartão de Apresentação do Personagem */}
      <Card bordered className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-nt-border pb-6">
          <Avatar
            src={character.avatar_url}
            alt={character.name}
            fallbackText={character.name}
            size="2xl"
          />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-reading text-nt-text leading-tight">
                  {character.name}{' '}
                  {character.surname && <span className="opacity-90">{character.surname}</span>}
                </h1>
                {character.nickname && (
                  <p className="text-sm text-nt-gold font-reading italic mt-0.5">
                    "{character.nickname}"
                  </p>
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs text-nt-dim px-2.5 py-1 bg-nt-surface2 rounded-full border border-nt-border self-center sm:self-auto">
                {character.is_public ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Público
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Privado
                  </>
                )}
              </span>
            </div>

            {/* Atributos Básicos */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3">
              <Badge variant="primary" size="md">
                {character.pronoun}
              </Badge>
              <Badge variant="default" size="md">
                {character.age} anos de idade
              </Badge>
            </div>

            {/* Criado por */}
            {author && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 text-xs text-nt-muted">
                <span>Intérprete:</span>
                <Link
                  to={`/app/profile/${author.username}`}
                  className="font-medium text-nt-text hover:text-nt-bordeaux transition-colors flex items-center gap-1.5"
                >
                  <Avatar
                    src={author.avatar_url}
                    alt={author.display_name || author.username}
                    fallbackText={author.display_name || author.username}
                    size="xs"
                  />
                  <span>@{author.username}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Campos Descritivos da Ficha Base */}
        <div className="pt-6 space-y-6">
          {character.appearance && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nt-gold" /> Aparência Física
              </h3>
              <p className="text-sm sm:text-base text-nt-text/90 font-reading leading-relaxed whitespace-pre-line bg-nt-surface2/60 p-4 rounded-xl border border-nt-border">
                {character.appearance}
              </p>
            </div>
          )}

          {character.personality && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nt-gold" /> Personalidade & Comportamento
              </h3>
              <p className="text-sm sm:text-base text-nt-text/90 font-reading leading-relaxed whitespace-pre-line bg-nt-surface2/60 p-4 rounded-xl border border-nt-border">
                {character.personality}
              </p>
            </div>
          )}

          {character.biography && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nt-gold" /> Biografia
              </h3>
              <p className="text-sm sm:text-base text-nt-text/90 font-reading leading-relaxed whitespace-pre-line bg-nt-surface2/60 p-4 rounded-xl border border-nt-border">
                {character.biography}
              </p>
            </div>
          )}

          {character.history && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nt-gold" /> História & Trajetória
              </h3>
              <p className="text-sm sm:text-base text-nt-text/90 font-reading leading-relaxed whitespace-pre-line bg-nt-surface2/60 p-4 rounded-xl border border-nt-border">
                {character.history}
              </p>
            </div>
          )}

          {character.extra_info && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-nt-gold mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-nt-gold" /> Informações Adicionais
              </h3>
              <p className="text-sm text-nt-text/90 font-reading leading-relaxed whitespace-pre-line bg-nt-surface2/60 p-4 rounded-xl border border-nt-border">
                {character.extra_info}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* SEÇÃO DIFERENCIAL: Fichas Customizadas em Comunidades */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-reading text-nt-text flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-nt-bordeaux" />
            Fichas Customizadas por Comunidade ({submissions.length})
          </h2>
        </div>

        {submissions.length === 0 ? (
          <Card bordered className="text-center py-8">
            <p className="text-xs text-nt-muted">
              Este personagem ainda não possui fichas submetidas em nenhuma comunidade.
            </p>
            <p className="text-[11px] text-nt-dim mt-1">
              Ao entrar em uma comunidade com construtor de fichas ativo, você poderá preenchê-la
              diretamente.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Abas das Comunidades */}
            <div className="flex flex-wrap gap-2 border-b border-nt-border pb-2">
              {submissions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveCommunityTab(sub.community_id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCommunityTab === sub.community_id
                      ? 'bg-nt-bordeaux text-white shadow-glow-bordeaux'
                      : 'bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border'
                  }`}
                >
                  <Avatar
                    src={sub.community?.avatar_url}
                    alt={sub.community?.name}
                    fallbackText={sub.community?.name}
                    size="xs"
                  />
                  <span>{sub.community?.name}</span>
                </button>
              ))}
            </div>

            {/* Ficha Dinâmica Renderizada com base no Snapshot do Esquema */}
            {selectedSubmission && (
              <Card bordered className="p-6 bg-nt-surface">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-nt-border">
                  <div>
                    <h3 className="font-bold text-base text-nt-text">
                      Ficha do Universo: {selectedSubmission.community?.name}
                    </h3>
                    <p className="text-xs text-nt-dim">
                      Versão do Esquema #{selectedSubmission.schema_version} • Atualizada em{' '}
                      {formatDateTime(selectedSubmission.updated_at)}
                    </p>
                  </div>
                  <Link to={`/app/communities/${selectedSubmission.community?.slug}`}>
                    <Button variant="ghost" size="sm">
                      Ver Comunidade
                    </Button>
                  </Link>
                </div>

                {/* Renderização de Campos do Snapshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedSubmission.schema_snapshot || []).map((field: any) => {
                    const val = selectedSubmission.data?.[field.name]
                    if (val === undefined || val === null || val === '') return null

                    return (
                      <div
                        key={field.id}
                        className={`p-3 rounded-lg bg-nt-surface2 border border-nt-border ${
                          field.type === 'textarea' ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <span className="block text-xs font-medium text-nt-gold mb-1">
                          {field.label}
                        </span>
                        {field.type === 'image' ? (
                          <img
                            src={val}
                            alt={field.label}
                            className="max-h-48 rounded-lg object-cover mt-1"
                          />
                        ) : field.type === 'url' ? (
                          <a
                            href={val}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-nt-bordeaux hover:underline break-all"
                          >
                            {val}
                          </a>
                        ) : Array.isArray(val) ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {val.map((item: string, i: number) => (
                              <Badge key={i} variant="outline" size="sm">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-nt-text font-reading whitespace-pre-line leading-relaxed">
                            {String(val)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="character"
        targetId={character.id}
        targetName={`Personagem: ${character.name}`}
      />
    </div>
  )
}
