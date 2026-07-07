import Link from 'next/link'
import { LogIn, LogOut } from 'lucide-react'
import { signOut } from '@/auth'

interface AuthButtonProps {
  user: { login: string; image?: string } | null
  compact?: boolean
}

export function AuthButton({ user, compact }: AuthButtonProps) {
  if (!user) {
    return (
      <Link
        href="/api/auth/signin"
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '0.78rem', justifyContent: 'center' }}
        title="Sign in with GitHub"
      >
        <LogIn size={14} />
        {!compact && 'Sign in'}
      </Link>
    )
  }

  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      {user.image && (
        <img
          src={user.image}
          alt={user.login}
          width={22}
          height={22}
          style={{ borderRadius: '50%', flexShrink: 0 }}
        />
      )}
      {!compact && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.login}
        </span>
      )}
      <button
        type="submit"
        className="btn btn-ghost btn-sm"
        style={{ padding: '4px 6px' }}
        title="Sign out"
      >
        <LogOut size={13} />
      </button>
    </form>
  )
}
