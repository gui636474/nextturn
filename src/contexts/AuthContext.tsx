import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Profile } from '../types'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (username: string, email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Erro ao buscar perfil:', error.message)
        return
      }

      setProfile(data)
    } catch (err) {
      console.error('Falha na requisição de perfil:', err)
    }
  }

  useEffect(() => {
    // 1. Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // 2. Ouvinte de mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { error: error.message }
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Erro inesperado ao fazer login' }
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      // 1. Tentar cadastro seguro via Supabase Edge Function (com verificação de IP / HMAC)
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register`
      
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ username, email, password }),
        })

        const resData = await response.json()
        if (!response.ok) {
          // Se a Edge Function retornou erro de regra de negócio (ex: rate limit de IP ou username repetido)
          if (response.status === 429 || response.status === 409 || response.status === 400) {
            return { error: resData.error || 'Erro ao criar conta.' }
          }
          throw new Error(resData.error || 'Falha na Edge Function')
        }

        // Sucesso na Edge Function -> Efetua login automático
        return await login(email, password)
      } catch (edgeFnError: any) {
        // Fallback gracioso caso a Edge Function ainda não tenha sido deployada no projeto Supabase
        console.warn('Edge Function indisponível, usando Supabase Auth direto:', edgeFnError.message)
        
        // Verifica se username já existe no profiles
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle()

        if (existingUser) {
          return { error: 'Este nome de usuário já está em uso.' }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: username,
            },
          },
        })

        if (error) return { error: error.message }
        if (!data.session) {
          // Se o Supabase exigir confirmação por padrão
          return { error: null }
        }

        return { error: null }
      }
    } catch (err: any) {
      return { error: err.message || 'Erro inesperado no cadastro' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user?.id) return { error: 'Não autenticado' }
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) return { error: error.message }
      await refreshProfile()
      return { error: null }
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar perfil' }
    }
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
