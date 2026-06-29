'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

function useTheme() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('hf-theme', next ? 'dark' : 'light')
  }

  return { dark, mounted, toggle }
}

export function ThemeToggle() {
  const { dark, mounted, toggle } = useTheme()

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.75)',
        cursor: 'pointer',
        transition: 'background 0.14s, color 0.14s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
        e.currentTarget.style.color = '#fff'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
      }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export function ThemeToggleMini() {
  const { dark, mounted, toggle } = useTheme()

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.75)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.14s, color 0.14s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
        e.currentTarget.style.color = '#fff'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
      }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
