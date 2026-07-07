import { GraduationCap, LogIn } from 'lucide-react'
import { signIn } from '@/auth'

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams

  return (
    <div style={{ maxWidth: '380px', margin: '100px auto', textAlign: 'center' }}>
      <GraduationCap size={32} style={{ color: 'var(--bark)', marginBottom: '12px' }} />
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', fontFamily: '"Fraunces", serif', color: 'var(--bark)' }}>
        Happy Training
      </h1>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Sign in to connect repositories and get AI suggestions from your code.
      </p>

      <form
        action={async () => {
          'use server'
          await signIn('github', { redirectTo: callbackUrl ?? '/repos' })
        }}
      >
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={16} />
          Sign in with GitHub
        </button>
      </form>
    </div>
  )
}
