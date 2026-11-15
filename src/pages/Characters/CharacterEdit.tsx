import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { uploadImageToStorage } from '../../utils/imageUtils'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'

export function CharacterEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Form Fields
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [pronoun, setPronoun] = useState('Ele/Dele')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [personality, setPersonality] = useState('')
  const [appearance, setAppearance] = useState('')
  const [history, setHistory] = useState('')
  const [biography, setBiography] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Status
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCharacter() {
      if (!id || !user?.id) return
      setIsLoading(true)

      try {
        const { data, error: fetchErr } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchErr) throw fetchErr

        if (data.user_id !== user.id) {
          setError('Você não tem permissão para editar este personagem.')
          setIsLoading(false)
          return
        }

        setName(data.name || '')
        setSurname(data.surname || '')
        setNickname(data.nickname || '')
        setAge(data.age)
        setPronoun(data.pronoun || 'Ele/Dele')
        setAvatarUrl(data.avatar_url || '')
        setPersonality(data.personality || '')
        setAppearance(data.appearance || '')
        setHistory(data.history || '')
        setBiography(data.biography || '')
        setExtraInfo(data.extra_info || '')
        setIsPublic(data.is_public)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar personagem.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCharacter()
  }, [id, user?.id])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    setError(null)

    const { url, error: uploadErr } = await uploadImageToStorage(file, 'avatars', user.id, 500, 500)
    setIsUploading(false)

    if (uploadErr) {
      setError(`Erro no upload do avatar: ${uploadErr}`)
      return
    }

    if (url) {
      setAvatarUrl(url)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome do personagem é obrigatório.')
      return
    }

    if (age === '' || Number(age) < 0) {
      setError('Informe uma idade válida.')
      return
    }

    if (!avatarUrl) {
      setError('O avatar do personagem é obrigatório.')
      return
    }

    setIsSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          surname: surname.trim() || null,
          nickname: nickname.trim() || null,
          age: Number(age),
          pronoun: pronoun.trim(),
          avatar_url: avatarUrl,
          personality: personality.trim() || null,
          appearance: appearance.trim() || null,
          history: history.trim() || null,
          biography: biography.trim() || null,
          extra_info: extraInfo.trim() || null,
          is_public: isPublic,
        })
        .eq('id', id)

      if (updateError) throw updateError

      navigate(`/app/characters/${id}`)
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar personagem.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setIsDeleting(true)

    try {
      const { error: delError } = await supabase
        .from('characters')
        .delete()
        .eq('id', id)

      if (delError) throw delError

      navigate('/app/characters')
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir personagem.')
      setIsDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando dados do personagem...</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Header */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-nt-text font-reading">Editar Personagem</h1>
            <p className="text-xs text-nt-muted">Atualize as informações do seu personagem</p>
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
          {/* Avatar */}
          <div className="p-4 bg-nt-surface2 rounded-xl border border-nt-border flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <Avatar src={avatarUrl} alt={name} fallbackText={name} size="2xl" />
              <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                <Camera className="w-6 h-6" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-nt-text">Avatar do Personagem</h3>
              <p className="text-xs text-nt-dim mt-1">
                Clique para alterar a imagem ou GIF animado (máx 2MB).
              </p>
              <label className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-nt-surface3 hover:bg-nt-border text-xs font-semibold text-nt-text cursor-pointer transition-colors border border-nt-border">
                {isUploading ? 'Processando...' : 'Trocar Imagem'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
            <Input
              label="Sobrenome"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Apelido / Título"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={100}
            />

            <Input
              label="Idade"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              required
              min={0}
              max={10000}
            />

            <Select
              label="Pronome"
              value={pronoun}
              onChange={(e) => setPronoun(e.target.value)}
              required
              options={[
                { label: 'Ele/Dele', value: 'Ele/Dele' },
                { label: 'Ela/Dela', value: 'Ela/Dela' },
                { label: 'Eles/Deles', value: 'Eles/Deles' },
                { label: 'Qualquer / Neutro', value: 'Qualquer / Neutro' },
              ]}
            />
          </div>

          {/* Textos Descritivos */}
          <div className="border-t border-nt-border pt-5 space-y-4">
            <Textarea
              label="Aparência Física"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              maxLength={2000}
              showCount
              rows={3}
            />

            <Textarea
              label="Personalidade & Comportamento"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              maxLength={2000}
              showCount
              rows={3}
            />

            <Textarea
              label="Biografia Resumida"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              maxLength={5000}
              showCount
              rows={4}
            />

            <Textarea
              label="História Completa"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              maxLength={5000}
              showCount
              rows={5}
            />

            <Textarea
              label="Informações Adicionais"
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              maxLength={2000}
              showCount
              rows={2}
            />
          </div>

          <div className="pt-2">
            <Checkbox
              label="Personagem Público"
              helperText="Permite que outros membros visualizem esta ficha base."
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>

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

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Personagem"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-red-200 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p>
              Tem certeza que deseja excluir <strong>{name}</strong>? Esta ação é irreversível e
              excluirá também todas as fichas vinculadas a comunidades.
            </p>
          </div>

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
