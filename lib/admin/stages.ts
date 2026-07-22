export const STAGES = [
  { key: 'sourced', label: 'Sourced', color: '#9a7d5a', bg: '#efe7d6' },
  { key: 'contacted', label: 'Contacted', color: '#C9973A', bg: '#f5ecd9' },
  { key: 'responded', label: 'Responded', color: '#B85A35', bg: '#f5e2d9' },
  { key: 'negotiating', label: 'Negotiating', color: '#6b5488', bg: '#e9e0ef' },
  { key: 'won', label: 'Trial & Won', color: '#2D5F3D', bg: '#dfeadf' },
] as const

export type StageKey = typeof STAGES[number]['key']

export function stageMeta(key: string) {
  return STAGES.find(s => s.key === key) ?? STAGES[0]
}
