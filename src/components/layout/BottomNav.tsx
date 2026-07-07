'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, Code, GitBranch, GraduationCap, Home, LayoutList } from 'lucide-react'
import { ThemeToggleMini } from './ThemeToggle'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Topics', icon: LayoutList },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/snippets', label: 'Snippets', icon: Code },
  { href: '/ai', label: 'AI', icon: Brain },
]

interface BottomNavProps {
  user: { login: string; image?: string } | null
  authSlot: ReactNode
}

export function BottomNav({ user, authSlot }: BottomNavProps) {
  const pathname = usePathname()
  const items = user ? [...navItems, { href: '/repos', label: 'Repos', icon: GitBranch }] : navItems

  return (
    <>
      <nav className="nav-mobile-bar">
        <Link href="/" className="nav-mobile-logo">
          <GraduationCap size={20} />
          Happy Training
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {authSlot}
          <ThemeToggleMini />
        </div>
      </nav>

      <nav className="bottom-nav">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`bottom-nav-item${active ? ' active' : ''}`}>
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
