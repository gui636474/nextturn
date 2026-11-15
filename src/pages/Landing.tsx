import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Compass,
  MessageSquare,
  Users,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  ScrollText,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function Landing() {
  const { session, isLoading } = useAuth()

  // Se já autenticado, vai direto para o feed
  if (!isLoading && session) {
    return <Navigate to="/app/feed" replace />
  }

  const features = [
    {
      icon: UserCheck,
      title: 'Personagens Vivos e Versáteis',
      desc: 'Crie seus personagens com biografia, personalidade e detalhes profundos. Um mesmo personagem pode participar de múltiplos universos com fichas específicas para cada um.',
      badge: 'Multiverso',
    },
    {
      icon: ScrollText,
      title: 'Construtor de Fichas Customizadas',
      desc: 'Cada comunidade constrói seus próprios formulários dinâmicos de RPG: atributos, magias, clãs, perícias e campos multimídia totalmente versionados.',
      badge: 'Exclusivo',
    },
    {
      icon: MessageSquare,
      title: 'Interpretação e Chat em Tempo Real',
      desc: 'Interprete com identidade de personagem ou assuma o modo Narrador para descrições de ambiente envolventes. Tipografia desenhada para leitura confortável.',
      badge: 'Supabase Realtime',
    },
    {
      icon: Clock,
      title: 'Salas Temporárias e Dinâmicas',
      desc: 'Sessões ágeis que expiram automaticamente em 24h para manter o foco narrativo vivo, otimizando o armazenamento e a imersão dos jogadores.',
      badge: '24 Horas',
    },
    {
      icon: Users,
      title: 'Comunidades & Fandoms',
      desc: 'Encontre grupos de Fantasia Medieval, Horror Gótico, Cyberpunk, Harry Potter e crie seus próprios universos com regras e moderação ativa.',
      badge: 'Social',
    },
    {
      icon: Shield,
      title: 'Segurança & Anti-Multicontas',
      desc: 'Proteção com verificação backend por hash HMAC, moderação integrada com evidências e políticas rigorosas de Row Level Security.',
      badge: 'Protegido',
    },
  ]

  return (
    <div className="min-h-screen bg-nt-bg text-nt-text selection:bg-nt-bordeaux selection:text-white flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between border-b border-nt-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nt-bordeaux to-nt-bordeaux-deep border border-nt-bordeaux/60 flex items-center justify-center font-bold text-white text-base shadow-glow-bordeaux">
            NT
          </div>
          <span className="font-bold text-xl tracking-tight text-nt-text">
            Next<span className="text-nt-bordeaux">Turn</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Criar Conta
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-20 pb-24 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Glow de fundo bordô */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-nt-bordeaux/15 blur-[120px] rounded-full pointer-events-none" />

        <Badge variant="gold" size="md" className="mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> A Nova Era do RPG Textual Brasileiro
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-nt-text font-reading leading-[1.15] mb-6">
          Onde palavras constroem <br />
          <span className="bg-gradient-to-r from-nt-bordeaux to-red-400 bg-clip-text text-transparent">
            mundos inesquecíveis.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-nt-muted max-w-2xl leading-relaxed mb-10 font-sans">
          A plataforma social definitiva para quem ama interpretar. Una seus personagens a
          comunidades vibrantes, preencha fichas customizadas e jogue em salas dinâmicas com chat em
          tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 text-base"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Começar a Interpretar
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base">
              Acessar Minha Conta
            </Button>
          </Link>
        </div>

        {/* Estatísticas / Provas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 mt-16 pt-10 border-t border-nt-border/60 w-full max-w-3xl">
          <div>
            <div className="text-2xl font-bold text-nt-text font-reading">100%</div>
            <div className="text-xs text-nt-muted mt-0.5">Tempo Real</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-nt-gold font-reading">24h</div>
            <div className="text-xs text-nt-muted mt-0.5">Salas Ativas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-nt-bordeaux font-reading">Ilimitado</div>
            <div className="text-xs text-nt-muted mt-0.5">Fichas por Universo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-nt-text font-reading">Seguro</div>
            <div className="text-xs text-nt-muted mt-0.5">Anti-Multicontas</div>
          </div>
        </div>
      </section>

      {/* Grid de Funcionalidades */}
      <section className="px-4 sm:px-8 py-20 max-w-7xl mx-auto w-full border-t border-nt-border/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-nt-text font-reading tracking-tight">
            Projetado exclusivamente para autores e intérpretes
          </h2>
          <p className="text-sm text-nt-muted mt-3">
            Sem interfaces poluídas de jogos 3D ou chats corporativos genéricos. Cada detalhe do
            NextTurn foi esculpido para quem valoriza a narrativa escrita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <Card key={idx} hover bordered className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-nt-bordeaux/15 border border-nt-bordeaux/30 flex items-center justify-center text-nt-bordeaux">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="default">{feat.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-nt-text mb-2">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-nt-muted leading-relaxed">{feat.desc}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Demonstração de Exemplo de Ficha */}
      <section className="px-4 sm:px-8 py-20 bg-nt-surface/50 border-y border-nt-border/40">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge variant="gold" size="sm" className="mb-3">
            O Grande Diferencial
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-reading">
            Um único personagem. Fichas adaptadas a qualquer universo.
          </h2>
          <p className="text-xs sm:text-sm text-nt-muted mt-2 max-w-xl mx-auto">
            Seu personagem <strong className="text-nt-text">"Kaelen"</strong> pode ter uma ficha de bruxo
            com Casa e Patrono na comunidade de Hogwarts, e outra de vampiro com Clã e Fraquezas na
            comunidade Sobrenatural.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-nt-surface border border-nt-border rounded-xl p-5 text-left">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-nt-gold uppercase tracking-wider">
              <span>Universo: Hogwarts RP</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Casa:</span>
                <span className="font-medium text-nt-text">Sonserina</span>
              </div>
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Varinha:</span>
                <span className="font-medium text-nt-text">Nogueira, 30cm, Pena de Fênix</span>
              </div>
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Patrono:</span>
                <span className="font-medium text-nt-text">Corvo</span>
              </div>
            </div>
          </div>

          <div className="bg-nt-surface border border-nt-border rounded-xl p-5 text-left">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-nt-bordeaux uppercase tracking-wider">
              <span>Universo: Crônicas Noturnas</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Espécie:</span>
                <span className="font-medium text-nt-text">Vampiro Puro</span>
              </div>
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Clã:</span>
                <span className="font-medium text-nt-text">Sombra Carmesim</span>
              </div>
              <div className="flex justify-between border-b border-nt-border pb-1">
                <span className="text-nt-muted">Poder Principal:</span>
                <span className="font-medium text-nt-text">Névoa Ilusória</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 sm:px-8 border-t border-nt-border/40 text-center text-xs text-nt-dim">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} NextTurn — Plataforma de RPG Textual. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 text-nt-muted">
            <Link to="/login" className="hover:text-nt-text transition-colors">
              Entrar
            </Link>
            <Link to="/register" className="hover:text-nt-text transition-colors">
              Cadastro
            </Link>
            <a href="#top" className="hover:text-nt-text transition-colors">
              Voltar ao Topo
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
