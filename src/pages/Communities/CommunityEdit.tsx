import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, Image as ImageIcon, ArrowLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadImageToStorage } from '../../utils/imageUtils'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'

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

export function CommunityEdit() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Fantasia Medieval')
  const [fandom, setFandom] = useState('')
  const [rules, setRules] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCommunity() {
      if (!slug || !user?.id) return
      setIsLoading(true)

      try {
        const { data, error: fetchErr } = await supabase
          .from('communities')
          .select('*')
          .eq('slug', slug)
          .single()

        if (fetchErr) throw fetchErr

        setCommunityId(data.id)
        setName(data.name)
        setDescription(data.description || '')
        setCategory(data.category)
        setFandom(data.fandom || '')
        setRules(data.rules || '')
        setAvatarUrl(data.avatar_url || '')
        setCoverUrl(data.cover_url || '')
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar comunidade.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCommunity()
  }, [slug, user?.id])

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!communityId) return
    setError(null)

    if (!name.trim() || name.length < 3) {
      setError('O nome da comunidade deve possuir no mínimo 3 caracteres.')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateErr } = await supabase
        .from('communities')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category,
          fandom: fandom.trim() || null,
          rules: rules.trim() || null,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
        })
        .eq('id', communityId)

      if (updateErr) throw updateErr

      navigate(`/app/communities/${slug}`)
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar comunidade.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!communityId) return
    setIsDeleting(true)

    try {
      const { error: delErr } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

      if (delErr) throw delErr

      navigate('/app/communities')
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir comunidade.')
      setIsDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando dados da comunidade...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-nt-text font-reading">Editar Comunidade</h1>
            <p className="text-xs text-nt-muted">Atualize as informações públicas e regras</p>
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Excluir
        </Button>
      </div>

      <Card bordered className="p-6 sm:p-8">
        {error && (
          <Alert variant="error" className="mb-6" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Capa */}
          <div>
            <label className="block text-xs font-medium text-nt-muted mb-2">Imagem de Capa</label>
            <div className="h-36 w-full rounded-xl bg-nt-surface2 border border-dashed border-nt-border overflow-hidden relative flex items-center justify-center group">
              {coverUrl ? (
                <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-nt-dim">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Nenhuma capa</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer text-xs font-medium text-white">
                <Camera className="w-4 h-4" />
                {isUploadingCover ? 'Enviando...' : 'Alterar Capa'}
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

          {/* Avatar */}
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
              <label className="inline-block mt-2 text-xs text-nt-bordeaux hover:underline cursor-pointer font-medium">
                {isUploadingAvatar ? 'Processando...' : 'Trocar Ícone'}
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

          <Input
            label="Nome da Comunidade"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORIES}
              required
            />
            <Input
              label="Fandom / Universo"
              value={fandom}
              onChange={(e) => setFandom(e.target.value)}
              maxLength={100}
            />
          </div>

          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            showCount
            rows={3}
          />

          <Textarea
            label="Regras"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={5000}
            showCount
            rows={4}
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-nt-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Comunidade"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-red-200 bg-red-950/30 p-3 rounded-lg border border-red-800/40">
            Atenção: Excluir a comunidade removerá todos os vínculos de salas, membros e fichas.
            Deseja continuar?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
