import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollText, User, Globe, Lock, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Character, Profile, CommunitySheetSubmission } from '../../types'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Spinner } from '../ui/Spinner'

interface CharacterSheetModalProps {
  isOpen: boolean
  onClose: () => void
  characterId: string | null
  communityId?: string | null
}

export function CharacterSheetModal({
  isOpen,
  onClose,
  characterId,
  communityId,
}: CharacterSheetModalProps) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [author, setAuthor] = useState<Profile | null>(null)
  const [submission, setSubmission] = useState<CommunitySheetSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchDetails() {
      if (!isOpen || !characterId) return
      setIsLoading(true)

      try {
        // 1. Carregar personagem
        const { data: char } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single()

        setCharacter(char)

        if (char?.user_id) {
          // 2. Carregar perfil do autor
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', char.user_id)
            .single()

          setAuthor(prof)
        }

        // 3. Se a sala estiver vinculada a uma comunidade, carregar a submissão deste personagem nela
        if (communityId) {
          const { data: sub } = await supabase
            .from('community_sheet_submissions')
            .select('*')
            .eq('character_id', characterId)
            .eq('community_id', communityId)
            .maybeSingle()

          setSubmission(sub)
        } else {
          setSubmission(null)
        }
      } catch (err) {
        console.error('Erro ao buscar ficha do personagem:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, characterId, communityId])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Spinner size="md" />
          <span className="text-xs text-nt-muted">Abrindo ficha...</span>
        </div>
      ) : !character ? (
        <div className="py-8 text-center text-xs text-nt-muted">
          Personagem não encontrado ou removido.
        </div>
      ) : (
        <div className="space-y-5 text-left">
          {/* Cabeçalho do Personagem */}
          <div className="flex items-start gap-4 pb-4 border-b border-nt-border">
            <Avatar
              src={character.avatar_url}
              alt={character.name}
              fallbackText={character.name}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold font-reading text-nt-text truncate">
                {character.name} {character.surname}
              </h3>
              {character.nickname && (
                <p className="text-xs text-nt-gold font-reading italic">"{character.nickname}"</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="primary" size="sm">
                  {character.pronoun}
                </Badge>
                <Badge variant="default" size="sm">
                  {character.age} anos
                </Badge>
              </div>

              {author && (
                <div className="flex items-center gap-2 mt-3 text-xs text-nt-muted">
                  <span>Intérprete:</span>
                  <Link
                    to={`/app/profile/${author.username}`}
                    className="font-medium text-nt-text hover:text-nt-bordeaux flex items-center gap-1.5"
                    onClick={onClose}
                  >
                    <Avatar
                      src={author.avatar_url}
                      alt={author.username}
                      fallbackText={author.username}
                      size="xs"
                    />
                    <span>@{author.username}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Dados Específicos da Comunidade (Se houver submissão) */}
          {submission && (
            <div className="p-4 rounded-xl bg-nt-surface2 border border-nt-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-nt-gold uppercase tracking-wider">
                <ScrollText className="w-4 h-4" />
                <span>Ficha Personalizada no Universo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(submission.schema_snapshot || []).map((field: any) => {
                  const val = submission.data?.[field.name]
                  if (val === undefined || val === null || val === '') return null

                  return (
                    <div key={field.id} className="p-2.5 rounded-lg bg-nt-surface3/60 border border-nt-border/60">
                      <span className="text-[11px] font-semibold text-nt-dim block">
                        {field.label}:
                      </span>
                      <span className="font-reading text-nt-text mt-0.5 block leading-relaxed">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dados Gerais da Ficha Base */}
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
            {character.appearance && (
              <div>
                <h4 className="font-semibold text-nt-gold mb-1 uppercase tracking-wider text-[11px]">
                  Aparência
                </h4>
                <p className="font-reading text-nt-text/90 leading-relaxed bg-nt-surface2 p-3 rounded-lg border border-nt-border whitespace-pre-line">
                  {character.appearance}
                </p>
              </div>
            )}

            {character.personality && (
              <div>
                <h4 className="font-semibold text-nt-gold mb-1 uppercase tracking-wider text-[11px]">
                  Personalidade
                </h4>
                <p className="font-reading text-nt-text/90 leading-relaxed bg-nt-surface2 p-3 rounded-lg border border-nt-border whitespace-pre-line">
                  {character.personality}
                </p>
              </div>
            )}

            {character.biography && (
              <div>
                <h4 className="font-semibold text-nt-gold mb-1 uppercase tracking-wider text-[11px]">
                  Biografia
                </h4>
                <p className="font-reading text-nt-text/90 leading-relaxed bg-nt-surface2 p-3 rounded-lg border border-nt-border whitespace-pre-line">
                  {character.biography}
                </p>
              </div>
            )}

            {character.history && (
              <div>
                <h4 className="font-semibold text-nt-gold mb-1 uppercase tracking-wider text-[11px]">
                  História
                </h4>
                <p className="font-reading text-nt-text/90 leading-relaxed bg-nt-surface2 p-3 rounded-lg border border-nt-border whitespace-pre-line">
                  {character.history}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
