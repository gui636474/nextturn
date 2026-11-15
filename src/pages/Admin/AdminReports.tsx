import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Flag,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  UserX,
  Trash2,
  Send,
  FileText,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Report, ReportStatus } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'

export function AdminReports() {
  const { profile, user, isAdmin } = useAuth()

  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [evidenceList, setEvidenceList] = useState<any[]>([])

  // Modal de Ação Disciplinar
  const [actionType, setActionType] = useState<string>('warn')
  const [actionReason, setActionReason] = useState('')
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const [isLoading, setIsLoading] = useState(true)

  if (!isAdmin && profile?.role === 'user') {
    return <Navigate to="/app/feed" replace />
  }

  useEffect(() => {
    loadReports()
  }, [filterStatus])

  async function loadReports() {
    setIsLoading(true)
    try {
      let query = supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(username, display_name)')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Erro ao buscar denúncias:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar evidências ao selecionar uma denúncia
  const handleSelectReport = async (report: Report) => {
    setSelectedReport(report)
    try {
      const { data: evData } = await supabase
        .from('report_evidence')
        .select('*')
        .eq('report_id', report.id)

      setEvidenceList(evData || [])
    } catch (err) {
      console.error('Erro ao carregar evidências:', err)
    }
  }

  // Executar Ação Disciplinar
  const handleExecuteAction = async () => {
    if (!selectedReport || !user?.id || !actionReason.trim()) {
      alert('Informe a justificativa da ação administrativa.')
      return
    }

    setIsProcessingAction(true)

    try {
      // 1. Inserir no histórico de moderação
      await supabase.from('moderation_actions').insert({
        report_id: selectedReport.id,
        moderator_id: user.id,
        target_type: selectedReport.target_type,
        target_id: selectedReport.target_id,
        action: actionType,
        reason: actionReason.trim(),
      })

      // 2. Aplicar efeito real no alvo correspondente
      if (actionType === 'ban' && selectedReport.target_type === 'user') {
        await supabase
          .from('profiles')
          .update({ is_banned: true, ban_reason: actionReason })
          .eq('id', selectedReport.target_id)
      } else if (actionType === 'suspend' && selectedReport.target_type === 'user') {
        const suspendUntil = new Date()
        suspendUntil.setDate(suspendUntil.getDate() + 7) // 7 dias de suspensão
        await supabase
          .from('profiles')
          .update({
            is_suspended: true,
            suspended_until: suspendUntil.toISOString(),
            suspend_reason: actionReason,
          })
          .eq('id', selectedReport.target_id)
      } else if (actionType === 'close_room' && selectedReport.target_type === 'room') {
        await supabase
          .from('rooms')
          .update({ status: 'closed' })
          .eq('id', selectedReport.target_id)
      } else if (actionType === 'remove_content' && selectedReport.target_type === 'message') {
        await supabase
          .from('messages')
          .update({
            content: '[Mensagem removida pela moderação]',
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', selectedReport.target_id)
      }

      // 3. Atualizar status da denúncia para 'resolved'
      await supabase
        .from('reports')
        .update({
          status: 'resolved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id)

      setIsActionModalOpen(false)
      setActionReason('')
      setSelectedReport(null)
      loadReports()
    } catch (err: any) {
      alert(`Falha ao executar ação: ${err.message}`)
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Rejeitar denúncia
  const handleRejectReport = async (reportId: string) => {
    if (!user?.id) return
    if (confirm('Deseja rejeitar e arquivar esta denúncia?')) {
      await supabase
        .from('reports')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId)

      setSelectedReport(null)
      loadReports()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-nt-border">
        <div className="flex items-center gap-3">
          <Link
            to="/app/admin"
            className="p-2 rounded-lg bg-nt-surface hover:bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-reading text-nt-text flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              Central de Denúncias
            </h1>
            <p className="text-xs text-nt-muted">Análise de ocorrências e aplicação de sanções</p>
          </div>
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-2">
          {['pending', 'reviewing', 'resolved', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-nt-bordeaux text-white shadow-glow-bordeaux'
                  : 'bg-nt-surface2 text-nt-muted hover:text-nt-text border border-nt-border'
              }`}
            >
              {st === 'pending'
                ? 'Pendentes'
                : st === 'reviewing'
                ? 'Em Análise'
                : st === 'resolved'
                ? 'Resolvidas'
                : st === 'rejected'
                ? 'Rejeitadas'
                : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: Fila à esquerda + Detalhes à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Denúncias (5 colunas) */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-nt-muted">Carregando denúncias...</span>
            </div>
          ) : reports.length === 0 ? (
            <Card bordered className="text-center py-10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-nt-muted">Nenhuma denúncia nesta visualização.</p>
            </Card>
          ) : (
            reports.map((rep) => {
              const isSelected = selectedReport?.id === rep.id
              return (
                <div
                  key={rep.id}
                  onClick={() => handleSelectReport(rep)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-nt-bordeaux/15 border-nt-bordeaux shadow-glow-bordeaux'
                      : 'bg-nt-surface border-nt-border hover:border-nt-border2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge
                      variant={
                        rep.priority === 'high'
                          ? 'danger'
                          : rep.priority === 'medium'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {rep.priority === 'high' ? 'Alta Prioridade' : rep.category}
                    </Badge>
                    <span className="text-[10px] text-nt-dim">
                      {new Date(rep.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-nt-text truncate mb-1">
                    {rep.reason}
                  </h4>
                  <p className="text-[11px] text-nt-dim line-clamp-2 font-reading">
                    Alvo: <span className="text-nt-text font-semibold uppercase">{rep.target_type}</span> • Por @{rep.reporter?.username}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Detalhes da Denúncia Selecionada (7 colunas) */}
        <div className="lg:col-span-7">
          {selectedReport ? (
            <Card bordered className="p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-nt-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-nt-text">{selectedReport.reason}</h3>
                    <Badge
                      variant={
                        selectedReport.status === 'resolved'
                          ? 'success'
                          : selectedReport.status === 'rejected'
                          ? 'default'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-nt-dim mt-0.5">
                    Categoria: <strong className="text-nt-gold">{selectedReport.category}</strong> • Denunciado por @{selectedReport.reporter?.username}
                  </p>
                </div>

                <Badge variant="outline" size="sm">
                  Tipo: {selectedReport.target_type}
                </Badge>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <h4 className="text-xs uppercase font-semibold text-nt-dim tracking-wider mb-1.5">
                  Descrição Fornecida pelo Denunciante:
                </h4>
                <p className="text-xs sm:text-sm text-nt-text/90 font-reading leading-relaxed bg-nt-surface2 p-3.5 rounded-xl border border-nt-border whitespace-pre-line">
                  {selectedReport.description || 'Nenhum detalhe adicional informado.'}
                </p>
              </div>

              {/* Evidências */}
              {evidenceList.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-semibold text-nt-dim tracking-wider mb-1.5">
                    Evidências Anexadas:
                  </h4>
                  <div className="space-y-2">
                    {evidenceList.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 bg-nt-surface2 rounded-lg border border-nt-border text-xs font-mono text-nt-text break-all"
                      >
                        {ev.evidence_text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações da Moderação */}
              <div className="pt-4 border-t border-nt-border flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRejectReport(selectedReport.id)}
                  className="text-nt-dim hover:text-nt-text"
                >
                  Arquivar / Rejeitar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setActionType('warn')
                      setIsActionModalOpen(true)
                    }}
                    leftIcon={<Shield className="w-3.5 h-3.5" />}
                  >
                    Tomar Ação Disciplinar
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card bordered className="text-center py-20">
              <p className="text-xs text-nt-muted">
                Selecione uma denúncia da lista para inspecionar os detalhes e evidências.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal para Aplicar Sanção */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Aplicar Sanção Disciplinar"
      >
        <div className="space-y-4 text-left">
          <Select
            label="Tipo de Ação"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            options={[
              { label: 'Advertência Formal (Registrada)', value: 'warn' },
              { label: 'Remover Conteúdo Inadequado', value: 'remove_content' },
              { label: 'Suspender Usuário Temporariamente (7 dias)', value: 'suspend' },
              { label: 'Banir Usuário Definitivamente', value: 'ban' },
              { label: 'Encerrar Sala de Interpretação', value: 'close_room' },
            ]}
          />

          <Textarea
            label="Justificativa da Ação (Registrada no Histórico)"
            placeholder="Descreva o motivo desta sanção e as diretrizes violadas..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-nt-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsActionModalOpen(false)}
              disabled={isProcessingAction}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isProcessingAction}
              onClick={handleExecuteAction}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Confirmar Sanção
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
