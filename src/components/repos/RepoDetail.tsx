'use client'

import type { ConnectedRepo } from '@/lib/db/schema'
import { RepoSuggestions } from './RepoSuggestions'
import { RepoChat } from './RepoChat'

export function RepoDetail({ repo }: { repo: ConnectedRepo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '760px' }}>
      <RepoSuggestions repoId={repo.id} />
      <RepoChat repoId={repo.id} />
    </div>
  )
}
