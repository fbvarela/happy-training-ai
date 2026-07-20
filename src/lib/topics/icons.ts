import {
  BookOpen, Target, Code2, Brain, Wrench, Palette,
  BarChart2, Rocket, FlaskConical, FileText, Globe, Zap,
  Sprout, PenTool, ChefHat, Dumbbell, Music, Camera,
  type LucideIcon,
} from 'lucide-react'

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  book:    BookOpen,
  target:  Target,
  code:    Code2,
  brain:   Brain,
  wrench:  Wrench,
  palette: Palette,
  chart:   BarChart2,
  rocket:  Rocket,
  flask:   FlaskConical,
  file:    FileText,
  globe:   Globe,
  zap:     Zap,
  // Non-coding domains — e.g. gardening, writing, cooking — so a topic's
  // icon doesn't have to borrow a programming-flavored one.
  sprout:   Sprout,
  pen:      PenTool,
  chef:     ChefHat,
  dumbbell: Dumbbell,
  music:    Music,
  camera:   Camera,
}

export const DEFAULT_TOPIC_ICON = 'book'

export function getTopicIcon(key: string | null | undefined): LucideIcon {
  return TOPIC_ICONS[(key ?? DEFAULT_TOPIC_ICON) as string] ?? BookOpen
}
