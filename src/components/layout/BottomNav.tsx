'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, Code, GraduationCap, Home, LayoutList } from 'lucide-react'
import { ThemeToggleMini } from './ThemeToggle'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/topics', label: 'Topics', icon: LayoutList },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/snippets', label: 'Snippets', icon: Code },
  { href: '/ai', label: 'AI', icon: Brain },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="nav-mobile-bar">
        <Link href="/" className="nav-mobile-logo">
          <GraduationCap size={20} />
          Happy Training
        </Link>
        <ThemeToggleMini />
      </nav>

      <nav className="bottom-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
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
