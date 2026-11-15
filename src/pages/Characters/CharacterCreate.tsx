import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Sparkles, ArrowLeft, Save } from 'lucide-react'
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

export function CharacterCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Campos Básicos Obrigatórios
  const [name, setName] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [pronoun, setPronoun] = useState('Ele/Dele')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Campos Opcionais
  const [surname, setSurname] = useState('')
  const [nickname, setNickname] = useState('')
  const [personality, setPersonality] = useState('')
  const [appearance, setAppearance] = useState('')
  const [history, setHistory] = useState('')
  const [biography, setBiography] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Estados de Interface
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome do personagem é obrigatório.')
      return
    }

    if (age === '' || Number(age) < 0) {
      setError('Informe uma idade válida (maior ou igual a 0).')
      return
    }

    if (!pronoun.trim()) {
      setError('O pronome é obrigatório.')
      return
    }

    if (!avatarUrl) {
      setError('O avatar do personagem é obrigatório. Faça o upload de uma imagem ou GIF.')
      return
    }

    if (!user?.id) {
      setError('Sessão inválida. Faça login novamente.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error: insertError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
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
        .select()
        .single()

      if (insertError) throw insertError

      navigate(`/app/characters/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar personagem.')
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
          <h1 className="text-xl sm:text-2xl font-bold text-nt-text font-reading">Criar Personagem</h1>
          <p className="text-xs text-nt-muted">
            Campos obrigatórios: Nome, Idade, Pronome e Avatar.
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
          {/* Seção 1: Avatar Obrigatório */}
          <div className="p-4 bg-nt-surface2 rounded-xl border border-nt-border flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <Avatar
                src={avatarUrl}
                alt="Novo Personagem"
                fallbackText={name || '?'}
                size="2xl"
              />
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
              <h3 className="text-sm font-semibold text-nt-text flex items-center justify-center sm:justify-start gap-1.5">
                Avatar do Personagem <span className="text-nt-bordeaux">*</span>
              </h3>
              <p className="text-xs text-nt-dim mt-1 leading-relaxed">
                O avatar representará este personagem em salas de interpretação e nas fichas de
                comunidades. Aceita imagens e GIFs de até 2MB.
              </p>
              <label className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-nt-bordeaux/20 hover:bg-nt-bordeaux/30 border border-nt-bordeaux/50 text-xs font-semibold text-red-200 cursor-pointer transition-colors">
                {isUploading ? 'Processando imagem...' : avatarUrl ? 'Trocar Avatar' : 'Selecionar Imagem *'}
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

          {/* Seção 2: Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome Principal"
              placeholder="ex: Kaelen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />

            <Input
              label="Sobrenome"
              placeholder="ex: Ravencroft"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Apelido / Título"
              placeholder="ex: O Corvo Cinzento"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={100}
            />

            <Input
              label="Idade"
              type="number"
              placeholder="ex: 28 ou 120"
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

          {/* Seção 3: Aspectos Profundos e Narrativos */}
          <div className="border-t border-nt-border pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-nt-gold uppercase tracking-wider">
              Profundidade Interpretativa
            </h3>

            <Textarea
              label="Aparência Física"
              placeholder="Descreva altura, cabelos, olhos, cicatrizes, vestimentas e postura corporal..."
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              maxLength={2000}
              showCount
              rows={3}
            />

            <Textarea
              label="Personalidade & Comportamento"
              placeholder="Traços marcantes, manias, virtudes, falhas, temperamento em combate e em descanso..."
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              maxLength={2000}
              showCount
              rows={3}
            />

            <Textarea
              label="Biografia Resumida"
              placeholder="Origem, família, ocupação e objetivos de vida..."
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              maxLength={5000}
              showCount
              rows={4}
            />

            <Textarea
              label="História Completa (Background)"
              placeholder="Acontecimentos marcantes da trajetória do personagem antes de entrar em cena..."
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              maxLength={5000}
              showCount
              rows={5}
            />

            <Textarea
              label="Informações Adicionais / Curiosidades"
              placeholder="Segredos, medos, lemas, canções favoritas..."
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              maxLength={2000}
              showCount
              rows={2}
            />
          </div>

          {/* Seção 4: Privacidade */}
          <div className="pt-2">
            <Checkbox
              label="Personagem Público"
              helperText="Permite que outros membros visualizem a ficha base deste personagem no seu perfil."
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </div>

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
              Salvar Personagem
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
