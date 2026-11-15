import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/profile/edit`,
      })

      if (error) {
        setStatus('error')
        setErrorMessage(error.message)
      } else {
        setStatus('success')
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Falha ao solicitar redefinição.')
    }
  }

  return (
    <div className="min-h-screen bg-nt-bg flex flex-col justify-center items-center p-4 selection:bg-nt-bordeaux selection:text-white">
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-base shadow-glow-bordeaux group-hover:scale-105 transition-transform">
              NT
            </div>
            <span className="font-bold text-2xl tracking-tight text-nt-text">
              Next<span className="text-nt-bordeaux">Turn</span>
            </span>
          </Link>
          <h2 className="text-xl font-semibold text-nt-text font-reading">Recuperar Senha</h2>
          <p className="text-xs text-nt-muted mt-1">Enviaremos um link de recuperação para o seu e-mail</p>
        </div>

        <Card bordered className="p-6 sm:p-8 bg-nt-surface/90 backdrop-blur-md">
          {status === 'success' ? (
            <div className="text-center py-4">
              <Alert variant="success" className="mb-4">
                Se este e-mail estiver cadastrado, você receberá um link com as instruções para
                redefinir sua senha em instantes.
              </Alert>
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {status === 'error' && (
                <Alert variant="error" onDismiss={() => setStatus('idle')}>
                  {errorMessage}
                </Alert>
              )}

              <Input
                label="E-mail Cadastrado"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={status === 'loading'}
                className="mt-2 w-full"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Enviar Link de Recuperação
              </Button>

              <div className="text-center mt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-nt-muted hover:text-nt-text transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
