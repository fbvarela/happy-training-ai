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

function ToggleButton() {
  const { dark, mounted, toggle } = useTheme()

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className="shell-icon-btn"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export function ThemeToggle() {
  return <ToggleButton />
}

export function ThemeToggleMini() {
  return <ToggleButton />
}