import React from 'react'
import { NavLink } from 'react-router-dom'
import { Compass, MessageSquare, Users, UserCheck, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { clsx } from 'clsx'

export function MobileNav() {
  const { profile } = useAuth()

  const navItems = [
    { label: 'Feed', to: '/app/feed', icon: Compass },
    { label: 'Salas', to: '/app/rooms', icon: MessageSquare },
    { label: 'Comunidades', to: '/app/communities', icon: Users },
    { label: 'Personagens', to: '/app/characters', icon: UserCheck },
    { label: 'Perfil', to: `/app/profile/${profile?.username || ''}`, icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-nt-surface/95 backdrop-blur-md border-t border-nt-border z-40 px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors',
                isActive ? 'text-nt-bordeaux' : 'text-nt-muted hover:text-nt-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-5 h-5 mb-0.5', isActive && 'text-nt-bordeaux')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
