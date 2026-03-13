'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isDark, setIsDark] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('legi-viz-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simular login
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Salvar usuario no localStorage (mock)
    const user = { email, name: email.split('@')[0] }
    localStorage.setItem('legi-viz-user', JSON.stringify(user))
    
    setLoading(false)
    router.push('/')
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAFA] text-black'}`}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar</span>
        </Link>
        <Logo className="h-5" isDark={isDark} />
        <div className="w-20" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Entrar</h1>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Acesse sua conta para salvar e acompanhar parlamentares
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Email
              </label>
              <div className="relative">
                <Mail size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm ${
                    isDark 
                      ? 'bg-white/10 text-white placeholder:text-white/40 focus:bg-white/15' 
                      : 'bg-black/5 text-black placeholder:text-black/40 focus:bg-black/10'
                  } outline-none transition-colors`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  className={`w-full pl-10 pr-12 py-3 rounded-lg text-sm ${
                    isDark 
                      ? 'bg-white/10 text-white placeholder:text-white/40 focus:bg-white/15' 
                      : 'bg-black/5 text-black placeholder:text-black/40 focus:bg-black/10'
                  } outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40 hover:text-white/70' : 'text-black/40 hover:text-black/70'}`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link 
              href="#" 
              className={`text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
            >
              Esqueceu a senha?
            </Link>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Nao tem conta?{' '}
              <Link href="/cadastro" className="text-green-500 hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>ou</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          </div>

          {/* Social login */}
          <button
            type="button"
            className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-3 transition-colors ${
              isDark 
                ? 'bg-white/10 hover:bg-white/15 text-white' 
                : 'bg-black/5 hover:bg-black/10 text-black'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className={`p-6 text-center text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        Ao entrar, voce concorda com nossos Termos de Uso e Politica de Privacidade.
      </footer>
    </div>
  )
}
