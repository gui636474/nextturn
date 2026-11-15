import React, { useState } from 'react'
import { Flag, Send, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ReportTarget } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTarget
  targetId: string
  targetName: string
}

const REPORT_CATEGORIES = [
  { label: 'Assédio / Bullying', value: 'Assédio' },
  { label: 'Discurso de Ódio / Discriminação', value: 'Discurso de ódio' },
  { label: 'Spam / Divulgação Excessiva', value: 'Spam' },
  { label: 'Conteúdo Sexual Inadequado', value: 'Conteúdo sexual inadequado' },
  { label: 'Ameaças ou Intimidação', value: 'Ameaças' },
  { label: 'Fraude / Falsa Identidade', value: 'Fraude' },
  { label: 'Personagem ou Conteúdo Impróprio', value: 'Personagem ou conteúdo impróprio' },
  { label: 'Violação das Regras da Comunidade/Sala', value: 'Violação das regras' },
  { label: 'Outro Motivo', value: 'Outros' },
]

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const { user } = useAuth()
  const [category, setCategory] = useState('Assédio')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceText, setEvidenceText] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      setError('Você precisa estar autenticado para enviar uma denúncia.')
      return
    }

    if (!reason.trim()) {
      setError('Informe um motivo sucinto para a denúncia.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Inserir denúncia (com constraint UNIQUE(reporter_id, target_type, target_id) para evitar duplicatas abusivas)
      const { data: newReport, error: reportErr } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          category,
          reason: reason.trim(),
          description: description.trim() || null,
          priority: category === 'Ameaças' || category === 'Discurso de ódio' ? 'high' : 'medium',
        })
        .select()
        .single()

      if (reportErr) {
        if (reportErr.code === '23505') {
          throw new Error('Você já enviou uma denúncia contra este item. Nossa equipe já está analisando.')
        }
        throw reportErr
      }

      // 2. Se houver evidência textual, registrar na tabela report_evidence
      if (evidenceText.trim() && newReport) {
        await supabase.from('report_evidence').insert({
          report_id: newReport.id,
          evidence_text: evidenceText.trim(),
        })
      }

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar denúncia.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Denúncia à Moderação"
      description={`Alvo: ${targetName}`}
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h4 className="text-base font-semibold text-nt-text">Denúncia Recebida com Sucesso</h4>
          <p className="text-xs text-nt-muted leading-relaxed max-w-sm mx-auto">
            A equipe de administradores foi notificada e avaliará as evidências e o histórico de
            ocorrências com prioridade.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <Alert variant="error" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="p-3 bg-nt-surface2 rounded-xl border border-nt-border flex items-start gap-2.5 text-xs text-nt-dim">
            <ShieldAlert className="w-4 h-4 text-nt-gold shrink-0 mt-0.5" />
            <span>
              Todas as denúncias são confidenciais e avaliadas exclusivamente por moderadores e
              superadministradores do NextTurn.
            </span>
          </div>

          <Select
            label="Categoria da Infração"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={REPORT_CATEGORIES}
            required
          />

          <Input
            label="Motivo Sucinto"
            placeholder="ex: Mensagens ofensivas no chat ou foto de perfil explícita"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            maxLength={100}
          />

          <Textarea
            label="Descrição Detalhada do Ocorrido"
            placeholder="Forneça contexto, horários aproximados ou detalhes que facilitem a apuração..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            showCount
            rows={3}
          />

          <Textarea
            label="Evidências ou Trechos Copiados (Opcional)"
            placeholder="Cole mensagens, links ou trechos relevantes..."
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-nt-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar Denúncia
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
