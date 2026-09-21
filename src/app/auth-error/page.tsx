import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="spotlight" style={{ width: '100%', maxWidth: '460px' }}>
        <div className="spotlight-inner" style={{ padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="icon-tile" style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--sun), var(--sun-light))', boxShadow: '0 4px 14px rgba(232,160,32,0.28)' }}>
              <ShieldAlert size={26} />
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px', fontFamily: '"Fraunces", serif', color: 'var(--on-dark)' }}>
            Access denied
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.62)', margin: '0 0 24px' }}>
            This app is gated to a single GitHub account. Sign in with the allow-listed account to continue.
          </p>
          <Link href="/login" className="shell-btn" style={{ display: 'inline-flex' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}