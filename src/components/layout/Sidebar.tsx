import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Compass,
  MessageSquare,
  Users,
  UserCheck,
  Shield,
  Bell,
  LogOut,
  Plus,
  Flame,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../ui/Avatar'
import { clsx } from 'clsx'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Feed & Explorar', to: '/app/feed', icon: Compass },
    { label: 'Salas de RPG', to: '/app/rooms', icon: MessageSquare },
    { label: 'Comunidades', to: '/app/communities', icon: Users },
    { label: 'Personagens', to: '/app/characters', icon: UserCheck },
    { label: 'Notificações', to: '/app/notifications', icon: Bell },
  ]

  return (
    <aside className="w-64 bg-nt-surface border-r border-nt-border h-full flex flex-col justify-between p-4 z-40 select-none">
      {/* Topo: Logo & Brand */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-base shadow-glow-bordeaux">
            NT
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-nt-text">
              Next<span className="text-nt-bordeaux">Turn</span>
            </h1>
            <p className="text-[10px] text-nt-dim uppercase tracking-wider">RPG Social Textual</p>
          </div>
        </div>

        {/* Botão de Criação Rápida */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose?.()
              navigate('/app/rooms/new')
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-nt-bordeaux hover:bg-nt-bordeaux-hover text-white text-xs font-medium transition-colors shadow-glow-bordeaux"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Sala</span>
          </button>

          <button
            onClick={() => {
              onClose?.()
              navigate('/app/characters/new')
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-nt-surface2 hover:bg-nt-surface3 border border-nt-border hover:border-nt-border2 text-nt-text text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Personagem</span>
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-nt-bordeaux/15 text-white border-l-4 border-nt-bordeaux shadow-sm'
                      : 'text-nt-muted hover:text-nt-text hover:bg-nt-surface2'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-nt-bordeaux' : 'text-nt-muted group-hover:text-nt-text'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-nt-border">
              <span className="px-3 text-[10px] uppercase font-semibold text-nt-dim tracking-wider">
                Moderação
              </span>
              <NavLink
                to="/app/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all mt-1',
                    isActive
                      ? 'bg-nt-gold/15 text-nt-gold border-l-4 border-nt-gold'
                      : 'text-nt-gold/80 hover:text-nt-gold hover:bg-nt-surface2'
                  )
                }
              >
                <Shield className="w-4 h-4 text-nt-gold" />
                <span>Painel Admin</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Perfil do Usuário & Logout */}
      <div className="border-t border-nt-border pt-3 flex flex-col gap-2">
        <div
          onClick={() => {
            onClose?.()
            navigate(`/app/profile/${profile?.username}`)
          }}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-nt-surface2 transition-colors cursor-pointer group"
        >
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.display_name || profile?.username}
            fallbackText={profile?.display_name || profile?.username}
            size="sm"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-nt-text truncate group-hover:text-white transition-colors">
              {profile?.display_name || profile?.username}
            </p>
            <p className="text-xs text-nt-dim truncate">@{profile?.username}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            onClose?.()
            await logout()
            navigate('/')
          }}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  )
}
