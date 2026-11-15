import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Users,
  ArrowLeft,
  Search,
  Shield,
  UserX,
  UserCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Profile, UserRole } from '../../types'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'

export function AdminUsers() {
  const { profile: currentAdmin, user, isAdmin } = useAuth()
  const [usersList, setUsersList] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Ações
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionReason, setActionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isAdmin && currentAdmin?.role === 'user') {
    return <Navigate to="/app/feed" replace />
  }

  useEffect(() => {
    loadUsers()
  }, [search])

  async function loadUsers() {
    setIsLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (search.trim()) {
        query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setUsersList(data || [])
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSuspend = async (targetUser: Profile) => {
    setIsProcessing(true)
    try {
      const isCurrentlySuspended = targetUser.is_suspended
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: !isCurrentlySuspended,
          suspended_until: !isCurrentlySuspended
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          suspend_reason: !isCurrentlySuspended ? 'Suspensão manual pela administração' : null,
        })
        .eq('id', targetUser.id)

      if (error) throw error

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_suspended: !isCurrentlySuspended } : u))
      )
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleBan = async (targetUser: Profile) => {
    if (confirm(`Deseja alterar o banimento do usuário @${targetUser.username}?`)) {
      setIsProcessing(true)
      try {
        const isBanned = targetUser.is_banned
        const { error } = await supabase
          .from('profiles')
          .update({
            is_banned: !isBanned,
            ban_reason: !isBanned ? 'Banimento definitivo aplicado' : null,
          })
          .eq('id', targetUser.id)

        if (error) throw error

        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, is_banned: !isBanned } : u))
        )
      } catch (err: any) {
        alert(`Erro: ${err.message}`)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleToggleRole = async (targetUser: Profile) => {
    // Apenas superadmin pode promover outros a admin
    if (currentAdmin?.role !== 'superadmin') {
      alert('Apenas superadministradores podem alterar os papéis de acesso.')
      return
    }

    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin'
    if (confirm(`Alterar papel de @${targetUser.username} para "${newRole}"?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', targetUser.id)

        if (error) throw error

        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        )
      } catch (err: any) {
        alert(`Erro: ${err.message}`)
      }
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
              <Users className="w-5 h-5 text-nt-gold" />
              Gestão de Usuários
            </h1>
            <p className="text-xs text-nt-muted">Gerencie permissões, suspensões e contas banidas</p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Buscar por @handle ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tabela de Usuários */}
      <Card bordered className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <Spinner size="md" />
            <span className="text-xs text-nt-muted">Carregando usuários...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-nt-surface2 border-b border-nt-border text-nt-dim uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Usuário</th>
                  <th className="p-3.5">Papel</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Membro Desde</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nt-border">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-nt-surface2/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={u.avatar_url}
                          alt={u.username}
                          fallbackText={u.username}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-nt-text">
                            {u.display_name || u.username}
                          </p>
                          <p className="text-[10px] text-nt-dim">@{u.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <Badge
                        variant={
                          u.role === 'superadmin' ? 'gold' : u.role === 'admin' ? 'primary' : 'default'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="p-3.5">
                      {u.is_banned ? (
                        <Badge variant="danger" size="sm">
                          Banido
                        </Badge>
                      ) : u.is_suspended ? (
                        <Badge variant="warning" size="sm">
                          Suspenso
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          Ativo
                        </Badge>
                      )}
                    </td>

                    <td className="p-3.5 text-nt-dim">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleSuspend(u)}
                          className={u.is_suspended ? 'text-emerald-400' : 'text-amber-400'}
                          disabled={isProcessing}
                        >
                          {u.is_suspended ? 'Reativar' : 'Suspender'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleBan(u)}
                          className="text-red-400"
                          disabled={isProcessing}
                        >
                          {u.is_banned ? 'Desbanir' : 'Banir'}
                        </Button>

                        {currentAdmin?.role === 'superadmin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleRole(u)}
                            className="text-nt-gold"
                          >
                            {u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
