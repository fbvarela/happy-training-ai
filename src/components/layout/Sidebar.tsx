'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, Code, GraduationCap, Home, LayoutList } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Topics', icon: LayoutList },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/snippets', label: 'Snippets', icon: Code },
  { href: '/ai', label: 'AI', icon: Brain },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar-nav">
      <Link href="/" className="sidebar-logo">
        <GraduationCap size={20} />
        Happy Training
      </Link>

      <nav className="sidebar-items">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`sideitem${active ? ' active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'center' }}>
        <ThemeToggle />
      </div>
    </aside>
  )
}
