import { ShieldAlert } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center' }}>
      <ShieldAlert size={32} style={{ color: 'var(--bark)', opacity: 0.5, marginBottom: '16px' }} />
      <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', fontFamily: '"Fraunces", serif', color: 'var(--bark)' }}>
        Access denied
      </h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        This app is gated to a single GitHub account. Sign in with the allow-listed account to continue.
      </p>
    </div>
  )
}
