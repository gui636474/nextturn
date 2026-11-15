import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'

// Páginas Públicas & Auth
import { Landing } from './pages/Landing'
import { Login } from './pages/Auth/Login'
import { Register } from './pages/Auth/Register'
import { ForgotPassword } from './pages/Auth/ForgotPassword'

// Feed & Notificações
import { Feed } from './pages/Feed'
import { Notifications } from './pages/Notifications'

// Perfil
import { ProfilePage } from './pages/Profile/ProfilePage'
import { EditProfile } from './pages/Profile/EditProfile'

// Personagens
import { CharacterList } from './pages/Characters/CharacterList'
import { CharacterCreate } from './pages/Characters/CharacterCreate'
import { CharacterEdit } from './pages/Characters/CharacterEdit'
import { CharacterSheet } from './pages/Characters/CharacterSheet'

// Comunidades & Fichas
import { CommunityList } from './pages/Communities/CommunityList'
import { CommunityCreate } from './pages/Communities/CommunityCreate'
import { CommunityPage } from './pages/Communities/CommunityPage'
import { CommunityEdit } from './pages/Communities/CommunityEdit'
import { SchemaBuilder } from './pages/Communities/SchemaBuilder'
import { SheetSubmission } from './pages/Communities/SheetSubmission'

// Salas de RPG & Chat em Tempo Real
import { RoomList } from './pages/Rooms/RoomList'
import { RoomCreate } from './pages/Rooms/RoomCreate'
import { RoomPage } from './pages/Rooms/RoomPage'

// Painel de Administração & Moderação
import { AdminPanel } from './pages/Admin/AdminPanel'
import { AdminReports } from './pages/Admin/AdminReports'
import { AdminUsers } from './pages/Admin/AdminUsers'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rotas Autenticadas (AppLayout) */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/feed" replace />} />
            <Route path="feed" element={<Feed />} />
            <Route path="notifications" element={<Notifications />} />

            {/* Perfil */}
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="profile/:username" element={<ProfilePage />} />

            {/* Personagens */}
            <Route path="characters" element={<CharacterList />} />
            <Route path="characters/new" element={<CharacterCreate />} />
            <Route path="characters/:id" element={<CharacterSheet />} />
            <Route path="characters/:id/edit" element={<CharacterEdit />} />

            {/* Comunidades & Fichas */}
            <Route path="communities" element={<CommunityList />} />
            <Route path="communities/new" element={<CommunityCreate />} />
            <Route path="communities/:slug" element={<CommunityPage />} />
            <Route path="communities/:slug/edit" element={<CommunityEdit />} />
            <Route path="communities/:slug/schema" element={<SchemaBuilder />} />
            <Route path="communities/:slug/submit-sheet" element={<SheetSubmission />} />

            {/* Salas de RPG */}
            <Route path="rooms" element={<RoomList />} />
            <Route path="rooms/new" element={<RoomCreate />} />
            <Route path="rooms/:id" element={<RoomPage />} />

            {/* Administração */}
            <Route path="admin" element={<AdminPanel />} />
            <Route path="admin/reports" element={<AdminReports />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>

          {/* Rota Coringa / 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
