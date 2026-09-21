import { GraduationCap, LogIn } from 'lucide-react'
import { signIn } from '@/auth'

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="spotlight" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="spotlight-inner" style={{ padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="icon-tile" style={{ width: '54px', height: '54px', borderRadius: '16px' }}>
              <GraduationCap size={26} />
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px', fontFamily: '"Fraunces", serif', color: 'var(--on-dark)' }}>
            Happy Training
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.62)', margin: '0 0 28px' }}>
            Sign in to connect repositories and get AI suggestions from your code.
          </p>

          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: callbackUrl ?? '/repos' })
            }}
          >
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}>
              <LogIn size={16} />
              Sign in with GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}