'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GitBranch, Lock, Plus, Trash2, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ConnectedRepo } from '@/lib/db/schema'

interface GithubRepo {
  githubRepoId: number
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  private: boolean
  updatedAt: string
}

export function ReposWorkspace({ initialRepos }: { initialRepos: ConnectedRepo[] }) {
  const [repos, setRepos] = useState(initialRepos)
  const [browsing, setBrowsing] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([])
  const [connectingId, setConnectingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const connectedFullNames = new Set(repos.map((r) => r.fullName))

  async function loadGithubRepos() {
    setBrowsing(true)
    setLoadingList(true)
    try {
      const res = await fetch('/api/repos/github')
      if (!res.ok) throw new Error()
      setGithubRepos(await res.json())
    } catch {
      toast.error('Failed to load your GitHub repositories')
    } finally {
      setLoadingList(false)
    }
  }

  async function connect(repo: GithubRepo) {
    setConnectingId(repo.githubRepoId)
    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repo),
      })
      if (!res.ok) throw new Error()
      const connected = await res.json()
      setRepos((prev) => [...prev, connected])
      toast.success(`Connected ${repo.fullName}`)
    } catch {
      toast.error('Failed to connect repository')
    } finally {
      setConnectingId(null)
    }
  }

  async function disconnect(id: number) {
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/repos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setRepos((prev) => prev.filter((r) => r.id !== id))
      toast.success('Disconnected')
    } catch {
      toast.error('Failed to disconnect')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {repos.length === 0 ? (
        <div className="empty-state">
          <p>No repos connected yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <div key={repo.id} className="hf-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <GitBranch size={18} style={{ color: 'var(--bark)', opacity: 0.55, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link href={`/repos/${repo.id}`} style={{ fontWeight: 600, color: 'var(--bark)', textDecoration: 'none' }}>
                    {repo.fullName}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {repo.private && <Lock size={11} />}
                    {repo.defaultBranch}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                {confirmDeleteId === repo.id ? (
                  <>
                    <button onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                      <X size={13} />
                    </button>
                    <button onClick={() => disconnect(repo.id)} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }}>
                      <Check size={13} /> Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId(repo.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                    <Trash2 size={13} /> Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!browsing ? (
        <button onClick={loadGithubRepos} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <Plus size={14} /> Connect a repository
        </button>
      ) : (
        <div style={{ border: '1.5px solid var(--line)', borderRadius: '10px', padding: '14px', background: 'var(--cream)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Your GitHub repositories
            </span>
            <button onClick={() => setBrowsing(false)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <X size={13} />
            </button>
          </div>

          {loadingList ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
              {githubRepos.map((repo) => {
                const connected = connectedFullNames.has(repo.fullName)
                return (
                  <div
                    key={repo.githubRepoId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', background: 'var(--surface)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <GitBranch size={14} style={{ color: 'var(--bark)', opacity: 0.5, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--bark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.fullName}
                    </span>
                    {repo.private && <Lock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    <button
                      onClick={() => connect(repo)}
                      disabled={connected || connectingId === repo.githubRepoId}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', flexShrink: 0 }}
                    >
                      {connected ? <Check size={13} /> : connectingId === repo.githubRepoId ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
                      {connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
