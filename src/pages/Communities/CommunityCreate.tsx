import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Camera, Image as ImageIcon, ArrowLeft, Save, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadImageToStorage } from '../../utils/imageUtils'
import { generateSlug } from '../../utils/formatters'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'

const CATEGORIES = [
  { label: 'Fantasia Medieval', value: 'Fantasia Medieval' },
  { label: 'Horror & Sobrenatural', value: 'Horror & Sobrenatural' },
  { label: 'Sci-Fi & Cyberpunk', value: 'Sci-Fi & Cyberpunk' },
  { label: 'Fandom & Universos Populares', value: 'Fandom & Universos Populares' },
  { label: 'Aventura & Exploração', value: 'Aventura & Exploração' },
  { label: 'Romance & Drama', value: 'Romance & Drama' },
  { label: 'Histórico', value: 'Histórico' },
  { label: 'Geral', value: 'Geral' },
]

export function CommunityCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Fantasia Medieval')
  const [fandom, setFandom] = useState('')
  const [rules, setRules] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    setSlug(generateSlug(newName))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingAvatar(true)
    setError(null)
    const { url, error: uploadErr } = await uploadImageToStorage(file, 'avatars', user.id, 400, 400)
    setIsUploadingAvatar(false)

    if (uploadErr) {
      setError(`Erro no avatar: ${uploadErr}`)
      return
    }
    if (url) setAvatarUrl(url)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingCover(true)
    setError(null)
    const { url, error: uploadErr } = await uploadImageToStorage(file, 'covers', user.id, 1400, 500)
    setIsUploadingCover(false)

    if (uploadErr) {
      setError(`Erro na capa: ${uploadErr}`)
      return
    }
    if (url) setCoverUrl(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || name.length < 3) {
      setError('O nome da comunidade deve possuir no mínimo 3 caracteres.')
      return
    }

    if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
      setError('O slug da URL deve conter entre 3 e 50 caracteres (apenas letras minúsculas, números e hífens).')
      return
    }

    if (!user?.id) {
      setError('Você precisa estar autenticado para criar uma comunidade.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Inserir comunidade
      const { data: newComm, error: commError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          category,
          fandom: fandom.trim() || null,
          rules: rules.trim() || null,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
          owner_id: user.id,
          member_count: 1,
        })
        .select()
        .single()

      if (commError) {
        if (commError.code === '23505') {
          throw new Error('Já existe uma comunidade com este nome ou slug. Escolha outro identificador.')
        }
        throw commError
      }

      // 2. Inserir criador como 'owner' na tabela community_members
      await supabase.from('community_members').insert({
        community_id: newComm.id,
        user_id: user.id,
        role: 'owner',
      })

      navigate(`/app/communities/${newComm.slug}`)
    } catch (err: any) {
      setError(err.message || 'Falha ao criar comunidade.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <h1 className="text-xl sm:text-2xl font-bold text-nt-text font-reading">Fundar Nova Comunidade</h1>
          <p className="text-xs text-nt-muted">
            Crie seu universo, defina regras e monte o construtor de fichas personalizado
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
          {/* Capa & Avatar */}
          <div>
            <label className="block text-xs font-medium text-nt-muted mb-2">Capa da Comunidade</label>
            <div className="h-36 w-full rounded-xl bg-nt-surface2 border border-dashed border-nt-border overflow-hidden relative flex items-center justify-center group">
              {coverUrl ? (
                <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-nt-dim">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Clique para adicionar uma imagem de capa</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer text-xs font-medium text-white">
                <Camera className="w-4 h-4" />
                {isUploadingCover ? 'Enviando...' : 'Carregar Capa'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar
                src={avatarUrl}
                alt={name}
                fallbackText={name || 'C'}
                size="xl"
                className="rounded-2xl"
              />
              <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-nt-text">Ícone da Comunidade</h3>
              <p className="text-xs text-nt-dim mt-0.5">
                Representará o universo nas listagens e salas.
              </p>
              <label className="inline-block mt-2 text-xs text-nt-bordeaux hover:underline cursor-pointer font-medium">
                {isUploadingAvatar ? 'Processando...' : 'Carregar Ícone'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
          </div>

          {/* Nome e Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da Comunidade"
              placeholder="ex: Hogwarts: Crônicas Mágicas"
              value={name}
              onChange={handleNameChange}
              required
              maxLength={100}
            />

            <Input
              label="URL Amigável (slug)"
              placeholder="ex: hogwarts-cronicas-magicas"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              required
              helperText={`Acessível em: /app/communities/${slug || 'slug'}`}
            />
          </div>

          {/* Categoria e Fandom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria Principal"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              required
            />

            <Input
              label="Fandom / Universo (Opcional)"
              placeholder="ex: Harry Potter, Vampire: The Masquerade, D&D"
              value={fandom}
              onChange={(e) => setFandom(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Descrição */}
          <Textarea
            label="Apresentação & Sinopse"
            placeholder="Apresente a proposta do seu universo, o tom das interpretações e o que os jogadores encontrarão aqui..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            showCount
            rows={3}
          />

          {/* Regras */}
          <Textarea
            label="Regras da Comunidade"
            placeholder="Diretrizes de convivência, regras de postagem, limites temáticos e conduta..."
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={5000}
            showCount
            rows={4}
          />

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
              Fundar Comunidade
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
