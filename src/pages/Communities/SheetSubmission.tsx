import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ScrollText, ArrowLeft, Save, Sparkles, Check, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Character, Community, CommunitySheetSchema } from '../../types'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'

export function SheetSubmission() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [community, setCommunity] = useState<Community | null>(null)
  const [schema, setSchema] = useState<CommunitySheetSchema | null>(null)
  const [userCharacters, setUserCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')

  // Valores dinâmicos preenchidos no formulário: chave = field.name
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!slug || !user?.id) return
      setIsLoading(true)

      try {
        // 1. Carregar comunidade
        const { data: comm, error: commErr } = await supabase
          .from('communities')
          .select('*')
          .eq('slug', slug)
          .single()

        if (commErr || !comm) throw new Error('Comunidade não encontrada')
        setCommunity(comm)

        // 2. Carregar esquema ativo da comunidade
        const { data: schemaData, error: schemaErr } = await supabase
          .from('community_sheet_schemas')
          .select('*')
          .eq('community_id', comm.id)
          .eq('is_active', true)
          .maybeSingle()

        if (!schemaData) {
          throw new Error('Esta comunidade ainda não possui um formulário de ficha ativo.')
        }

        setSchema(schemaData)

        // 3. Carregar personagens do usuário
        const { data: chars, error: charsErr } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (charsErr) throw charsErr

        setUserCharacters(chars || [])
        if (chars && chars.length > 0) {
          setSelectedCharacterId(chars[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [slug, user?.id])

  // Quando o personagem selecionado muda, carregar submissão anterior se já existir
  useEffect(() => {
    async function checkExistingSubmission() {
      if (!community?.id || !selectedCharacterId) return

      try {
        const { data: sub } = await supabase
          .from('community_sheet_submissions')
          .select('*')
          .eq('community_id', community.id)
          .eq('character_id', selectedCharacterId)
          .maybeSingle()

        if (sub && sub.data) {
          setFormData(sub.data)
        } else {
          setFormData({})
        }
      } catch (err) {
        console.error('Erro ao verificar ficha existente:', err)
      }
    }

    checkExistingSubmission()
  }, [community?.id, selectedCharacterId])

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!community || !schema || !selectedCharacterId) return
    setError(null)

    // Validação de campos obrigatórios
    for (const field of schema.fields) {
      if (field.required) {
        const val = formData[field.name]
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setError(`O campo "${field.label}" é obrigatório.`)
          return
        }
      }
    }

    setIsSubmitting(true)

    try {
      // Salva ou atualiza a submissão, incluindo o snapshot do esquema para versionamento
      const { error: upsertErr } = await supabase
        .from('community_sheet_submissions')
        .upsert(
          {
            character_id: selectedCharacterId,
            community_id: community.id,
            schema_id: schema.id,
            schema_version: schema.version,
            schema_snapshot: schema.fields,
            data: formData,
            is_public: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'character_id,community_id',
          }
        )

      if (upsertErr) throw upsertErr

      setSuccess(true)
      setTimeout(() => {
        navigate(`/app/characters/${selectedCharacterId}`)
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar ficha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando formulário de ficha...</span>
      </div>
    )
  }

  if (!community || !schema) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <Alert variant="warning" className="mb-4">
          {error || 'Formulário indisponível.'}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    )
  }

  if (userCharacters.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <UserCheck className="w-12 h-12 text-nt-gold mx-auto" />
        <h2 className="text-xl font-bold font-reading">Você ainda não tem personagens</h2>
        <p className="text-xs text-nt-muted leading-relaxed">
          Para preencher a ficha de um universo, você precisa criar um personagem base primeiro.
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
          <h1 className="text-xl sm:text-2xl font-bold font-reading text-nt-text">
            Ficha para o Universo: {community.name}
          </h1>
          <p className="text-xs text-nt-muted">
            {schema.name} • Versão #{schema.version}
          </p>
        </div>
      </div>

      <Card bordered className="p-6 sm:p-8">
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            Ficha salva com sucesso para este universo! Redirecionando...
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor do Personagem que usará esta ficha */}
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
                  Personagem Vinculado
                </span>
                <span className="font-bold text-sm text-nt-text">
                  {selectedChar?.name} ({selectedChar?.pronoun}, {selectedChar?.age} anos)
                </span>
              </div>
            </div>

            <div className="w-full sm:w-56">
              <Select
                label="Trocar Personagem"
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                options={userCharacters.map((c) => ({
                  label: `${c.name} (${c.pronoun})`,
                  value: c.id,
                }))}
              />
            </div>
          </div>

          {schema.description && (
            <p className="text-xs text-nt-dim leading-relaxed italic bg-nt-surface3/40 p-3 rounded-lg border border-nt-border">
              {schema.description}
            </p>
          )}

          {/* Renderização Dinâmica dos Campos do Esquema */}
          <div className="space-y-5 pt-2">
            {schema.fields.map((field) => {
              const currentValue = formData[field.name] ?? ''

              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-nt-muted">
                      {field.label} {field.required && <span className="text-nt-bordeaux">*</span>}
                    </label>
                    {field.max_length && (
                      <span className="text-[11px] text-nt-dim">
                        Máx {field.max_length} caracteres
                      </span>
                    )}
                  </div>

                  {field.type === 'textarea' ? (
                    <Textarea
                      placeholder={field.placeholder || ''}
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      maxLength={field.max_length || undefined}
                      rows={4}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      required={field.required}
                      options={[
                        { label: field.placeholder || 'Selecione uma opção...', value: '' },
                        ...(field.options || []).map((opt) => ({ label: opt, value: opt })),
                      ]}
                    />
                  ) : field.type === 'checkbox' ? (
                    <div className="space-y-2 p-3 bg-nt-surface2 rounded-lg border border-nt-border">
                      {(field.options || []).map((opt, i) => {
                        const checkedList = Array.isArray(currentValue) ? currentValue : []
                        const isChecked = checkedList.includes(opt)

                        return (
                          <Checkbox
                            key={i}
                            label={opt}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange(field.name, [...checkedList, opt])
                              } else {
                                handleInputChange(
                                  field.name,
                                  checkedList.filter((item: string) => item !== opt)
                                )
                              }
                            }}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      placeholder={field.placeholder || ''}
                      value={currentValue}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      maxLength={field.max_length || undefined}
                      required={field.required}
                    />
                  )}

                  {field.description && (
                    <span className="text-[11px] text-nt-dim block">{field.description}</span>
                  )}
                </div>
              )
            })}
          </div>

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
              Salvar Ficha do Personagem
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
