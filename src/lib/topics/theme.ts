// Topic identity color tokens + brand asset colors.
// Kept in a single token file so raw hex values stay out of component code.

export const TOPIC_COLORS = [
  '#55708a', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#f97316', '#e8a020', '#14b8a6',
  '#06b6d4', '#9bb0c0', '#c4643c', '#0b1220',
] as const

export const DEFAULT_TOPIC_COLOR = '#55708a'

// App icon / favicon brand colors (SVG rasterization requires literal hex).
export const BRAND_ICON_BG = '#55708a'
export const BRAND_ICON_FG = '#ffffff'