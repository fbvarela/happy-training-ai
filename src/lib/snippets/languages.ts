export const LANGUAGES = [
  'typescript', 'javascript', 'python', 'sql', 'bash',
  'go', 'rust', 'json', 'yaml', 'html', 'css', 'markdown',
] as const

export type Language = (typeof LANGUAGES)[number]
