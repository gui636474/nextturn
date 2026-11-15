import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Check,
  Clock,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Notification } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { formatRelativeTime } from '../utils/formatters'

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      if (!user?.id) return
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(40)

        if (error) throw error
        setNotifications(data || [])
      } catch (err) {
        console.error('Erro ao carregar notificações:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Escuta em tempo real para novas notificações
    if (user?.id) {
      const channel = supabase
        .channel(`user-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id])

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Erro ao marcar como lidas:', err)
    }
  }

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Erro ao marcar notificação:', err)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-nt-border">
        <div>
          <h1 className="text-2xl font-bold font-reading text-nt-text flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-nt-bordeaux" />
            Notificações
          </h1>
          <p className="text-xs text-nt-muted mt-0.5">
            Atualizações de salas, avisos da moderação e interações
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-nt-muted">Buscando suas notificações...</span>
        </div>
      ) : notifications.length === 0 ? (
        <Card bordered className="text-center py-16 px-4">
          <Bell className="w-12 h-12 text-nt-dim mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-nt-text font-reading">Tudo em dia!</h3>
          <p className="text-xs text-nt-muted mt-1">
            Você não possui novas notificações ou avisos pendentes.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.is_read

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) handleMarkAsRead(notif.id)
                }}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'bg-nt-bordeaux/10 border-nt-bordeaux/40 shadow-sm'
                    : 'bg-nt-surface border-nt-border hover:border-nt-border2'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-nt-surface2 text-nt-gold mt-0.5 shrink-0">
                      {notif.type === 'admin_alert' ? (
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      ) : notif.type === 'mention' ? (
                        <MessageSquare className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-nt-gold" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-nt-text leading-tight">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-nt-bordeaux shrink-0" />
                        )}
                      </div>

                      {notif.body && (
                        <p className="text-xs text-nt-muted mt-1 leading-relaxed font-reading">
                          {notif.body}
                        </p>
                      )}

                      <span className="text-[11px] text-nt-dim mt-2 block">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="p-1.5 rounded-lg bg-nt-surface2 hover:bg-nt-surface3 text-nt-muted hover:text-nt-text shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
