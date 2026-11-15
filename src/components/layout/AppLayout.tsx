import React, { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Spinner } from '../ui/Spinner'

export function AppLayout() {
  const { session, isLoading } = useAuth()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nt-bg flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-nt-muted tracking-wider uppercase font-semibold">
          Carregando NextTurn...
        </span>
      </div>
    )
  }

  // Se não autenticado, redireciona para a tela de login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-nt-bg flex flex-col text-nt-text">
      {/* Top Header */}
      <Header onToggleSidebar={() => setIsMobileSidebarOpen(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop Fixa */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Sidebar Mobile (Drawer deslizante) */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-nt-surface h-full animate-fade-in shadow-2xl">
              <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Conteúdo Principal das Rotas */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <MobileNav />
    </div>
  )
}
