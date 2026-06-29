import { ReactNode } from 'react'

interface TopBarProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function TopBar({ title, description, actions }: TopBarProps) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-sub">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}
