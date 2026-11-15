import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, Shield, User, LogOut, Menu, X, PlusCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/app/feed?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-nt-bg/90 backdrop-blur-md border-b border-nt-border h-16 flex items-center px-4 sm:px-6 justify-between gap-4">
      {/* Esquerda: Botão Menu Mobile + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-nt-muted hover:text-nt-text hover:bg-nt-surface2 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/app/feed" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-sm shadow-glow-bordeaux group-hover:scale-105 transition-transform">
            NT
          </div>
          <span className="font-semibold text-lg tracking-wide text-nt-text group-hover:text-white transition-colors">
            Next<span className="text-nt-bordeaux">Turn</span>
          </span>
        </Link>
      </div>

      {/* Centro: Barra de Busca Global */}
      <div className="hidden sm:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-nt-dim" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar salas, comunidades ou personagens..."
            className="w-full bg-nt-surface border border-nt-border rounded-full pl-9 pr-4 py-1.5 text-xs sm:text-sm text-nt-text placeholder:text-nt-dim focus:outline-none focus:border-nt-bordeaux focus:ring-1 focus:ring-nt-bordeaux transition-all"
          />
        </form>
      </div>

      {/* Direita: Ações Rápidas, Notificações e Menu de Usuário */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/app/rooms/new">
          <Button size="sm" variant="outline" className="hidden lg:inline-flex" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Nova Sala
          </Button>
        </Link>

        {/* Notificações */}
        <Link
          to="/app/notifications"
          className="p-2 text-nt-muted hover:text-nt-text hover:bg-nt-surface2 rounded-full transition-colors relative"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
        </Link>

        {/* Menu do Usuário */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-nt-border transition-all focus:outline-none"
          >
            <Avatar
              src={profile?.avatar_url}
              alt={profile?.display_name || profile?.username}
              fallbackText={profile?.display_name || profile?.username}
              size="sm"
            />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-nt-surface border border-nt-border rounded-xl shadow-subtle p-2 z-50 animate-fade-in flex flex-col gap-1">
                <div className="px-3 py-2 border-b border-nt-border mb-1">
                  <p className="text-sm font-semibold text-nt-text truncate">
                    {profile?.display_name || profile?.username}
                  </p>
                  <p className="text-xs text-nt-muted truncate">@{profile?.username}</p>
                  {isAdmin && (
                    <Badge variant="gold" size="sm" className="mt-1.5">
                      <Shield className="w-3 h-3 mr-1" /> Administrador
                    </Badge>
                  )}
                </div>

                <Link
                  to={`/app/profile/${profile?.username}`}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-nt-text hover:bg-nt-surface2 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-nt-muted" />
                  Meu Perfil
                </Link>

                {isAdmin && (
                  <Link
                    to="/app/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-nt-gold hover:bg-nt-surface2 rounded-lg transition-colors"
                  >
                    <Shield className="w-4 h-4 text-nt-gold" />
                    Painel Admin
                  </Link>
                )}

                <div className="border-t border-nt-border mt-1 pt-1">
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false)
                      await logout()
                      navigate('/')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Encerrar Sessão
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
