import { Video, FileText, Newspaper, Code2, Paperclip, type LucideIcon } from 'lucide-react'

export const RESOURCE_TYPE_ICONS: Record<string, LucideIcon> = {
  video:   Video,
  pdf:     FileText,
  article: Newspaper,
  snippet: Code2,
}

export function getResourceIcon(type: string | null | undefined): LucideIcon {
  return RESOURCE_TYPE_ICONS[type ?? ''] ?? Paperclip
}
