import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ScrollText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Layers,
  Settings2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { FieldType, SchemaField, CommunitySheetSchema } from '../../types'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

const FIELD_TYPES: { label: string; value: FieldType }[] = [
  { label: 'Texto Curto (Input)', value: 'text' },
  { label: 'Texto Longo (Textarea)', value: 'textarea' },
  { label: 'Número', value: 'number' },
  { label: 'Data', value: 'date' },
  { label: 'Seleção Única (Dropdown)', value: 'select' },
  { label: 'Múltipla Escolha / Checkbox', value: 'checkbox' },
  { label: 'Link / URL', value: 'url' },
  { label: 'Imagem / Foto', value: 'image' },
]

export function SchemaBuilder() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [communityName, setCommunityName] = useState('')
  const [schemaName, setSchemaName] = useState('Ficha de Personagem Padrão')
  const [schemaDescription, setSchemaDescription] = useState('')
  const [fields, setFields] = useState<SchemaField[]>([])
  const [activeVersion, setActiveVersion] = useState<number>(1)

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadCommunityAndSchema() {
      if (!slug || !user?.id) return
      setIsLoading(true)

      try {
        // 1. Carregar comunidade
        const { data: comm, error: commErr } = await supabase
          .from('communities')
          .select('id, name, owner_id')
          .eq('slug', slug)
          .single()

        if (commErr || !comm) throw new Error('Comunidade não encontrada')

        setCommunityId(comm.id)
        setCommunityName(comm.name)

        // 2. Verificar se usuário é dono ou admin da comunidade
        const { data: mem } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', comm.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (comm.owner_id !== user.id && mem?.role !== 'admin') {
          throw new Error('Você não possui permissão para gerenciar as fichas desta comunidade.')
        }

        // 3. Carregar esquema ativo (se existir)
        const { data: schemaData } = await supabase
          .from('community_sheet_schemas')
          .select('*')
          .eq('community_id', comm.id)
          .eq('is_active', true)
          .maybeSingle()

        if (schemaData) {
          setSchemaName(schemaData.name)
          setSchemaDescription(schemaData.description || '')
          setFields(schemaData.fields || [])
          setActiveVersion(schemaData.version)
          if (schemaData.fields?.length > 0) {
            setSelectedFieldId(schemaData.fields[0].id)
          }
        } else {
          // Inicializar com campos padrão de exemplo
          const initialFields: SchemaField[] = [
            {
              id: 'f1',
              name: 'classe_ou_ocupacao',
              label: 'Classe ou Ocupação',
              type: 'text',
              required: true,
              description: 'Ex: Guerreiro, Feiticeiro, Investigador, Médico...',
              placeholder: 'Informe a ocupação no universo',
              options: null,
              max_length: 100,
              section: 'Identidade',
              order: 0,
            },
            {
              id: 'f2',
              name: 'habilidades_principais',
              label: 'Habilidades & Poderes',
              type: 'textarea',
              required: false,
              description: 'Liste magias, técnicas marciais ou talentos singulares.',
              placeholder: 'Descreva os dons e perícias do personagem...',
              options: null,
              max_length: 1500,
              section: 'Capacidades',
              order: 1,
            },
          ]
          setFields(initialFields)
          setSelectedFieldId('f1')
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Erro ao carregar construtor.' })
      } finally {
        setIsLoading(false)
      }
    }

    loadCommunityAndSchema()
  }, [slug, user?.id])

  // Adicionar novo campo
  const handleAddField = () => {
    const newId = `f_${Date.now()}`
    const newField: SchemaField = {
      id: newId,
      name: `campo_${fields.length + 1}`,
      label: `Novo Campo ${fields.length + 1}`,
      type: 'text',
      required: false,
      description: null,
      placeholder: null,
      options: null,
      max_length: 200,
      section: 'Geral',
      order: fields.length,
    }

    setFields([...fields, newField])
    setSelectedFieldId(newId)
  }

  // Atualizar campo selecionado
  const handleUpdateSelectedField = (updates: Partial<SchemaField>) => {
    if (!selectedFieldId) return
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === selectedFieldId) {
          const updated = { ...f, ...updates }
          // Se alterou a label e o name ainda era genérico, gera slug automático para name
          if (updates.label && f.name.startsWith('campo_')) {
            updated.name = updates.label
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9_]+/g, '_')
              .slice(0, 40)
          }
          return updated
        }
        return f
      })
    )
  }

  // Excluir campo
  const handleDeleteField = (fieldId: string) => {
    const remaining = fields.filter((f) => f.id !== fieldId)
    setFields(remaining)
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  // Mover campo para cima/baixo na ordem
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const reordered = [...fields]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    // Reatribui order
    reordered.forEach((f, idx) => {
      f.order = idx
    })

    setFields(reordered)
  }

  // Salvar nova versão do esquema no banco usando a RPC atômica
  const handleSaveSchema = async () => {
    if (!communityId) return
    setMessage(null)

    if (fields.length === 0) {
      setMessage({ type: 'error', text: 'Adicione pelo menos um campo à ficha.' })
      return
    }

    // Validação de nomes internos duplicados
    const names = new Set<string>()
    for (const f of fields) {
      if (!f.label.trim()) {
        setMessage({ type: 'error', text: 'Todos os campos devem ter um rótulo (label).' })
        return
      }
      if (names.has(f.name)) {
        setMessage({
          type: 'error',
          text: `Nome de identificador duplicado: "${f.name}". Ajuste para que cada campo tenha um nome único.`,
        })
        return
      }
      names.add(f.name)
    }

    setIsSaving(true)

    try {
      const { data, error: rpcErr } = await supabase.rpc('create_schema_version', {
        p_community_id: communityId,
        p_name: schemaName.trim() || 'Ficha do Universo',
        p_description: schemaDescription.trim() || null,
        p_fields: fields,
      })

      if (rpcErr) throw rpcErr

      setActiveVersion((prev) => prev + 1)
      setMessage({
        type: 'success',
        text: `Ficha salva com sucesso como Versão #${activeVersion + 1}! Nenhuma ficha antiga foi corrompida.`,
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar esquema.' })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Abrindo construtor de fichas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto text-left">
      {/* Topo / Barra de Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-nt-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/app/communities/${slug}`)}
            className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-reading text-nt-text">
                Construtor de Fichas
              </h1>
              <Badge variant="gold" size="sm">
                Versão #{activeVersion}
              </Badge>
            </div>
            <p className="text-xs text-nt-muted">
              Comunidade: <strong className="text-nt-text">{communityName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={isPreviewMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {isPreviewMode ? 'Modo de Edição' : 'Visualizar Prévia'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            loading={isSaving}
            onClick={handleSaveSchema}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Publicar Versão
          </Button>
        </div>
      </div>

      {message && (
        <Alert
          variant={message.type}
          onDismiss={() => setMessage(null)}
          title={message.type === 'success' ? 'Publicado' : 'Atenção'}
        >
          {message.text}
        </Alert>
      )}

      {/* Identificação Geral da Ficha */}
      <Card bordered className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Título do Formulário de Ficha"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            required
            maxLength={100}
          />
          <Input
            label="Instruções Gerais para os Intérpretes"
            placeholder="ex: Preencha com os atributos reais do personagem neste universo..."
            value={schemaDescription}
            onChange={(e) => setSchemaDescription(e.target.value)}
            maxLength={300}
          />
        </div>
      </Card>

      {/* MODO PRÉVIA: O que o usuário verá ao preencher */}
      {isPreviewMode ? (
        <Card bordered className="p-6 sm:p-8 bg-nt-surface/90">
          <div className="border-b border-nt-border pb-4 mb-6">
            <Badge variant="gold" size="sm" className="mb-2">
              Prévia do Formulário do Jogador
            </Badge>
            <h2 className="text-xl font-bold font-reading text-nt-text">{schemaName}</h2>
            {schemaDescription && (
              <p className="text-xs text-nt-muted mt-1 leading-relaxed">{schemaDescription}</p>
            )}
          </div>

          <div className="space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-xs font-medium text-nt-muted">
                  {field.label} {field.required && <span className="text-nt-bordeaux">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    disabled
                    placeholder={field.placeholder || ''}
                    className="w-full bg-nt-surface2 border border-nt-border rounded-lg p-3 text-xs sm:text-sm text-nt-text opacity-70 cursor-not-allowed"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    disabled
                    className="w-full bg-nt-surface2 border border-nt-border rounded-lg px-3 py-2 text-xs sm:text-sm text-nt-text opacity-70 cursor-not-allowed"
                  >
                    <option>{field.placeholder || 'Selecione uma opção...'}</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2 pt-1">
                    {(field.options && field.options.length > 0
                      ? field.options
                      : ['Opção de exemplo']
                    ).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-nt-text opacity-70">
                        <input type="checkbox" disabled className="rounded bg-nt-surface2" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    disabled
                    placeholder={field.placeholder || ''}
                    className="w-full bg-nt-surface2 border border-nt-border rounded-lg px-3 py-2 text-xs sm:text-sm text-nt-text opacity-70 cursor-not-allowed"
                  />
                )}

                {field.description && (
                  <span className="block text-[11px] text-nt-dim">{field.description}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* MODO EDIÇÃO: Layout 2 Colunas (Lista de Campos à esquerda, Configurações à direita) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Lista de Campos e Reordenação (5 colunas) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-nt-muted flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-nt-bordeaux" /> Campos ({fields.length})
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddField}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Novo Campo
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedFieldId === field.id
                      ? 'bg-nt-bordeaux/15 border-nt-bordeaux text-white shadow-glow-bordeaux'
                      : 'bg-nt-surface border-nt-border hover:border-nt-border2 text-nt-text'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs truncate">{field.label}</span>
                      {field.required && <span className="text-nt-bordeaux text-xs">*</span>}
                    </div>
                    <span className="text-[10px] text-nt-dim block capitalize">
                      {field.type} • {field.section || 'Geral'}
                    </span>
                  </div>

                  {/* Controles de Ordem e Exclusão */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveField(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-nt-dim hover:text-nt-text disabled:opacity-20"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveField(idx, 'down')}
                      disabled={idx === fields.length - 1}
                      className="p-1 text-nt-dim hover:text-nt-text disabled:opacity-20"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 text-nt-dim hover:text-red-400 ml-1"
                      title="Remover campo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna da Direita: Editor de Propriedades do Campo Selecionado (7 colunas) */}
          <div className="lg:col-span-7">
            {selectedField ? (
              <Card bordered className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-nt-border pb-3">
                  <h3 className="text-sm font-semibold text-nt-text flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-nt-gold" />
                    Configuração do Campo
                  </h3>
                  <Badge variant="outline" size="sm">
                    ID: {selectedField.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Rótulo Visível (Label)"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateSelectedField({ label: e.target.value })}
                    required
                  />

                  <Select
                    label="Tipo do Campo"
                    value={selectedField.type}
                    onChange={(e) =>
                      handleUpdateSelectedField({ type: e.target.value as FieldType })
                    }
                    options={FIELD_TYPES}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Identificador Interno (Nome no Banco)"
                    value={selectedField.name}
                    onChange={(e) => handleUpdateSelectedField({ name: e.target.value })}
                    helperText="Apenas letras minúsculas e _"
                  />

                  <Input
                    label="Seção / Grupo"
                    placeholder="ex: Magias, Biografia, Combate"
                    value={selectedField.section || ''}
                    onChange={(e) => handleUpdateSelectedField({ section: e.target.value })}
                  />
                </div>

                <Input
                  label="Texto Placeholder (Exemplo)"
                  placeholder="ex: Digite aqui o clã..."
                  value={selectedField.placeholder || ''}
                  onChange={(e) => handleUpdateSelectedField({ placeholder: e.target.value })}
                />

                <Textarea
                  label="Instruções / Descrição de Ajuda"
                  placeholder="Orientações detalhadas de preenchimento para o jogador..."
                  value={selectedField.description || ''}
                  onChange={(e) => handleUpdateSelectedField({ description: e.target.value })}
                  rows={2}
                />

                {/* Opções para Select ou Checkbox */}
                {(selectedField.type === 'select' || selectedField.type === 'checkbox') && (
                  <div>
                    <label className="block text-xs font-medium text-nt-muted mb-1">
                      Opções da Lista (uma por linha)
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Gryffindor&#10;Slytherin&#10;Ravenclaw&#10;Hufflepuff"
                      value={(selectedField.options || []).join('\n')}
                      onChange={(e) => {
                        const opts = e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                        handleUpdateSelectedField({ options: opts })
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <Checkbox
                    label="Campo Obrigatório"
                    checked={selectedField.required}
                    onChange={(e) => handleUpdateSelectedField({ required: e.target.checked })}
                  />

                  {(selectedField.type === 'text' || selectedField.type === 'textarea') && (
                    <div className="w-36">
                      <Input
                        label="Limite de Caracteres"
                        type="number"
                        value={selectedField.max_length || ''}
                        onChange={(e) =>
                          handleUpdateSelectedField({
                            max_length: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card bordered className="text-center py-16">
                <p className="text-xs text-nt-muted">
                  Selecione um campo na coluna à esquerda ou crie um novo para configurar suas
                  propriedades.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
