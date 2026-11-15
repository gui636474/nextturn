import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Image as ImageIcon, Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { uploadImageToStorage } from '../../utils/imageUtils'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'

export function EditProfile() {
  const navigate = useNavigate()
  const { profile, user, updateProfile } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '')

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingAvatar(true)
    setError(null)

    const { url, error: uploadErr } = await uploadImageToStorage(file, 'avatars', user.id, 400, 400)
    setIsUploadingAvatar(false)

    if (uploadErr) {
      setError(`Erro no upload do avatar: ${uploadErr}`)
      return
    }

    if (url) {
      setAvatarUrl(url)
    }
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploadingBanner(true)
    setError(null)

    const { url, error: uploadErr } = await uploadImageToStorage(file, 'covers', user.id, 1400, 500)
    setIsUploadingBanner(false)

    if (uploadErr) {
      setError(`Erro no upload da capa: ${uploadErr}`)
      return
    }

    if (url) {
      setBannerUrl(url)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    const { error: updateErr } = await updateProfile({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
    })

    setIsSaving(false)

    if (updateErr) {
      setError(updateErr)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      navigate(`/app/profile/${profile?.username}`)
    }, 1000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-nt-text font-reading">Editar Perfil</h1>
          <p className="text-xs text-nt-muted">Personalize sua apresentação na plataforma</p>
        </div>
      </div>

      <Card bordered className="p-6">
        {error && (
          <Alert variant="error" className="mb-4" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            Perfil atualizado com sucesso! Redirecionando...
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Banner de Capa */}
          <div>
            <label className="block text-xs font-medium text-nt-muted mb-2">
              Imagem de Capa (Recomendado 1200x400, máx 5MB)
            </label>
            <div className="h-36 w-full rounded-xl bg-nt-surface2 border border-dashed border-nt-border overflow-hidden relative flex items-center justify-center group">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-nt-dim">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Nenhuma capa selecionada</span>
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer text-xs font-medium text-white">
                <Camera className="w-4 h-4" />
                {isUploadingBanner ? 'Enviando...' : 'Alterar Imagem de Capa'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerChange}
                  disabled={isUploadingBanner}
                />
              </label>
            </div>
          </div>

          {/* Avatar com Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar
                src={avatarUrl}
                alt={displayName || profile?.username}
                fallbackText={displayName || profile?.username}
                size="xl"
              />
              <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-nt-text">Foto de Perfil</h3>
              <p className="text-xs text-nt-dim mt-0.5">
                Formatos JPG, PNG, WEBP ou GIF animados (máx 2MB).
              </p>
              <label className="inline-block mt-2 text-xs text-nt-bordeaux hover:underline cursor-pointer font-medium">
                {isUploadingAvatar ? 'Otimizando e enviando...' : 'Carregar nova foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
          </div>

          {/* Nome de Exibição */}
          <Input
            label="Nome de Exibição"
            placeholder="Como você deseja ser chamado"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />

          {/* Handle / Username (Fixo) */}
          <Input
            label="Nome de Usuário (@handle)"
            value={`@${profile?.username || ''}`}
            disabled
            helperText="O identificador exclusivo da sua conta não pode ser alterado diretamente."
          />

          {/* Biografia */}
          <Textarea
            label="Biografia"
            placeholder="Conte um pouco sobre você, seus gostos no RPG, horários disponíveis..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            showCount
            rows={4}
          />

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-nt-border">
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
    </div>
  )
}
