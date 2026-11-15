import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, UserPlus, Check, X, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Validação em tempo real do username
  const isUsernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username)
  const isPasswordLongEnough = password.length >= 8
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isUsernameValid) {
      setError('O nome de usuário deve conter de 3 a 30 caracteres alfanuméricos ou sublinhado (_).')
      return
    }

    if (!isPasswordLongEnough) {
      setError('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsLoading(true)
    const { error: regError } = await register(username.trim().toLowerCase(), email.trim(), password)
    setIsLoading(false)

    if (regError) {
      setError(regError)
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
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-base shadow-glow-bordeaux group-hover:scale-105 transition-transform">
              NT
            </div>
            <span className="font-bold text-2xl tracking-tight text-nt-text">
              Next<span className="text-nt-bordeaux">Turn</span>
            </span>
          </Link>
          <h2 className="text-xl font-semibold text-nt-text font-reading">Criar Nova Conta</h2>
          <p className="text-xs text-nt-muted mt-1">Junte-se à comunidade brasileira de RPG textual</p>
        </div>

        <Card bordered className="p-6 sm:p-8 bg-nt-surface/90 backdrop-blur-md">
          {error && (
            <Alert variant="error" className="mb-5" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Input
                label="Nome de Usuário (@handle)"
                placeholder="ex: aragorn_99"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                leftIcon={<User className="w-4 h-4" />}
                helperText="3 a 30 caracteres. Letras, números e _"
              />
              {username && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  {isUsernameValid ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Formato válido
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Apenas letras, números e sublinhado (mínimo 3 caracteres)
                    </span>
                  )}
                </div>
              )}
            </div>

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
              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              {password && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  {isPasswordLongEnough ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Tamanho adequado
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Muito curta ({password.length}/8)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirmar Senha"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
              {confirmPassword && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  {doPasswordsMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> As senhas conferem
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Senhas não coincidem
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-nt-surface2 rounded-lg border border-nt-border flex items-start gap-2.5 text-[11px] text-nt-dim mt-1">
              <ShieldAlert className="w-4 h-4 text-nt-gold shrink-0 mt-0.5" />
              <span>
                Para manter uma comunidade limpa e segura contra bots, o cadastro registra um identificador
                criptográfico (HMAC) do seu IP.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="mt-2 w-full"
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Criar Conta e Entrar
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-nt-border text-center text-xs text-nt-muted">
            Já tem uma conta no NextTurn?{' '}
            <Link to="/login" className="text-nt-bordeaux hover:underline font-semibold ml-1">
              Fazer login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
