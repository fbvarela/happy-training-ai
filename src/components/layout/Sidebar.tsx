'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, Code, GitBranch, GraduationCap, Home, LayoutList } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Topics', icon: LayoutList },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/snippets', label: 'Notes', icon: Code },
  { href: '/ai', label: 'AI', icon: Brain },
]

interface SidebarProps {
  user: { login: string; image?: string } | null
  authSlot: ReactNode
}

export function Sidebar({ user, authSlot }: SidebarProps) {
  const pathname = usePathname()
  const items = user ? [...navItems, { href: '/repos', label: 'Repos', icon: GitBranch }] : navItems

  return (
    <aside className="sidebar-nav">
      <Link href="/" className="sidebar-logo">
        <GraduationCap size={20} />
        Happy Training
      </Link>

      <nav className="sidebar-items">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`sideitem${active ? ' active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        {authSlot}
        <ThemeToggle />
      </div>
    </aside>
  )
}
