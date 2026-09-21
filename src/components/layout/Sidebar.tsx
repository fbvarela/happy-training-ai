'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, Code, GitBranch, GraduationCap, Home, LayoutList, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  href: string
  label: string
  icon: typeof Home
  section: string
}

const baseItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, section: 'Overview' },
  { href: '/topics', label: 'Courses', icon: LayoutList, section: 'Learning' },
  { href: '/resources', label: 'Materials', icon: BookOpen, section: 'Learning' },
  { href: '/snippets', label: 'Notes', icon: Code, section: 'Learning' },
  { href: '/ai', label: 'AI Studio', icon: Brain, section: 'Intelligence' },
  { href: '/settings', label: 'Settings', icon: Settings, section: 'System' },
]

const sections = ['Overview', 'Learning', 'Intelligence', 'System']

interface SidebarProps {
  user: { login: string; image?: string } | null
  authSlot: ReactNode
}

export function Sidebar({ user, authSlot }: SidebarProps) {
  const pathname = usePathname()
  const items = user ? [...baseItems, { href: '/repos', label: 'Repos', icon: GitBranch, section: 'Intelligence' }] : baseItems

  return (
    <aside className="sidebar-nav">
      <Link href="/" className="sidebar-logo">
        <span className="logo-tile">
          <GraduationCap size={17} />
        </span>
        Happy Training
      </Link>

      <nav className="sidebar-items">
        {sections.map((section) => {
          const sectionItems = items.filter((i) => i.section === section)
          if (sectionItems.length === 0) return null
          return (
            <div key={section}>
              <div className="sidebar-section">{section}</div>
              {sectionItems.map(({ href, label, icon: Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link key={href} href={href} className={`sideitem${active ? ' active' : ''}`}>
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
        {authSlot}
        <ThemeToggle />
      </div>
    </aside>
  )
}