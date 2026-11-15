import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Por favor, informe e-mail e senha.')
      return
    }

    setIsLoading(true)
    const { error: loginError } = await login(email, password)
    setIsLoading(false)

    if (loginError) {
      if (loginError.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.')
      } else {
        setError(loginError)
      }
      return
    }

    navigate('/app/feed')
  }

  return (
    <div className="min-h-screen bg-nt-bg flex flex-col justify-center items-center p-4 selection:bg-nt-bordeaux selection:text-white">
      {/* Glow de fundo */}
      <div className="absolute w-96 h-96 bg-nt-bordeaux/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-base shadow-glow-bordeaux group-hover:scale-105 transition-transform">
              NT
            </div>
            <span className="font-bold text-2xl tracking-tight text-nt-text">
              Next<span className="text-nt-bordeaux">Turn</span>
            </span>
          </Link>
          <h2 className="text-xl font-semibold text-nt-text font-reading">Bem-vindo de volta</h2>
          <p className="text-xs text-nt-muted mt-1">Entre na sua conta para continuar suas histórias</p>
        </div>

        <Card bordered className="p-6 sm:p-8 bg-nt-surface/90 backdrop-blur-md">
          {error && (
            <Alert variant="error" className="mb-5" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-nt-muted">Senha</span>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-nt-gold hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="mt-2 w-full"
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Entrar na Plataforma
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-nt-border text-center text-xs text-nt-muted">
            Ainda não possui conta?{' '}
            <Link to="/register" className="text-nt-bordeaux hover:underline font-semibold ml-1">
              Cadastre-se grátis
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
