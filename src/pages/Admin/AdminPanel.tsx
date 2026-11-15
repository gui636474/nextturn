import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Shield,
  Users,
  MessageSquare,
  Flag,
  AlertTriangle,
  UserX,
  History,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function AdminPanel() {
  const { profile, isAdmin } = useAuth()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCommunities: 0,
    activeRooms: 0,
    pendingReports: 0,
    suspendedUsers: 0,
  })
  const [recentActions, setRecentActions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Proteção: apenas admin ou superadmin
  if (!isAdmin && profile?.role === 'user') {
    return <Navigate to="/app/feed" replace />
  }

  useEffect(() => {
    async function loadAdminOverview() {
      setIsLoading(true)

      try {
        // Contagens em paralelo
        const [
          { count: usersCount },
          { count: commCount },
          { count: roomCount },
          { count: reportCount },
          { count: suspendedCount },
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('communities').select('id', { count: 'exact', head: true }),
          supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
        ])

        setStats({
          totalUsers: usersCount ?? 0,
          totalCommunities: commCount ?? 0,
          activeRooms: roomCount ?? 0,
          pendingReports: reportCount ?? 0,
          suspendedUsers: suspendedCount ?? 0,
        })

        // Ações administrativas recentes
        const { data: actions } = await supabase
          .from('moderation_actions')
          .select('*, moderator:profiles(username)')
          .order('created_at', { ascending: false })
          .limit(10)

        setRecentActions(actions || [])
      } catch (err) {
        console.error('Erro ao carregar métricas administrativas:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminOverview()
  }, [])

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted">Carregando painel de administração...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-nt-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-reading text-nt-text flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-nt-gold" />
              Central de Moderação & Administração
            </h1>
            <Badge variant="gold" size="sm">
              {profile?.role}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-nt-muted mt-0.5">
            Visão geral da plataforma, denúncias em tempo real e controle de segurança
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/app/admin/reports">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Flag className="w-4 h-4" />}
            >
              Fila de Denúncias ({stats.pendingReports})
            </Button>
          </Link>
          <Link to="/app/admin/users">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Users className="w-4 h-4" />}
            >
              Gerenciar Usuários
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card bordered className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nt-muted font-medium">Denúncias Pendentes</span>
            <Flag className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-300 font-reading">{stats.pendingReports}</div>
          <p className="text-[11px] text-nt-dim mt-1">Aguardando análise</p>
        </Card>

        <Card bordered className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nt-muted font-medium">Salas Ativas</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-nt-text font-reading">{stats.activeRooms}</div>
          <p className="text-[11px] text-nt-dim mt-1">Interpretação ao vivo</p>
        </Card>

        <Card bordered className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nt-muted font-medium">Comunidades</span>
            <Users className="w-4 h-4 text-nt-gold" />
          </div>
          <div className="text-2xl font-bold text-nt-text font-reading">{stats.totalCommunities}</div>
          <p className="text-[11px] text-nt-dim mt-1">Universos criados</p>
        </Card>

        <Card bordered className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nt-muted font-medium">Usuários Registrados</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-nt-text font-reading">{stats.totalUsers}</div>
          <p className="text-[11px] text-nt-dim mt-1">Contas protegidas</p>
        </Card>

        <Card bordered className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-nt-muted font-medium">Suspensões Ativas</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-reading">{stats.suspendedUsers}</div>
          <p className="text-[11px] text-nt-dim mt-1">Usuários sancionados</p>
        </Card>
      </div>

      {/* Histórico Recente de Ações Administrativas */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold text-nt-text flex items-center gap-2">
          <History className="w-4 h-4 text-nt-gold" />
          Histórico de Ações da Moderação
        </h3>

        {recentActions.length === 0 ? (
          <Card bordered className="text-center py-8">
            <p className="text-xs text-nt-muted">Nenhuma ação disciplinar registrada até o momento.</p>
          </Card>
        ) : (
          <div className="border border-nt-border rounded-xl overflow-hidden bg-nt-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-nt-surface2 border-b border-nt-border text-nt-dim uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Moderador</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Alvo</th>
                    <th className="p-3">Motivo</th>
                    <th className="p-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nt-border">
                  {recentActions.map((act) => (
                    <tr key={act.id} className="hover:bg-nt-surface2/60 transition-colors">
                      <td className="p-3 font-semibold text-nt-text">@{act.moderator?.username}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            act.action === 'ban' || act.action === 'suspend'
                              ? 'danger'
                              : act.action === 'warn'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {act.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-nt-muted">{act.target_type}</td>
                      <td className="p-3 font-reading text-nt-text/90 max-w-xs truncate">{act.reason}</td>
                      <td className="p-3 text-nt-dim">{new Date(act.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
