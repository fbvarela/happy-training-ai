import type { Octokit } from '@octokit/rest'

const IGNORED_DIR_RE = /(^|\/)(node_modules|\.git|dist|build|\.next|vendor|coverage|target|out)(\/|$)/
const DEP_FILE_RE = /^(package\.json|requirements\.txt|go\.mod|Cargo\.toml|Gemfile|pom\.xml|build\.gradle)$/
const README_RE = /^readme(\.md)?$/i
const SOURCE_EXT_RE = /\.(ts|tsx|js|jsx|py|go|rs|rb|java|kt|c|cpp|cs|php)$/

const MAX_KEY_FILES = 8
const MAX_FILE_CHARS = 3_000
const MAX_TREE_PATHS = 400

export interface RepoContext {
  fileTree: string[]
  keyFiles: { path: string; content: string }[]
}

export async function buildRepoContext(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<RepoContext> {
  const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: branch, recursive: 'true' })

  const blobs = (tree.tree ?? []).filter(
    (entry) => entry.type === 'blob' && entry.path && !IGNORED_DIR_RE.test(entry.path)
  )

  const fileTree = blobs.slice(0, MAX_TREE_PATHS).map((e) => e.path!)

  const depFiles = blobs.filter((e) => DEP_FILE_RE.test(e.path!.split('/').pop()!))
  const readmeFile = blobs.find((e) => README_RE.test(e.path!.split('/').pop()!) && !e.path!.includes('/'))
  const largestSourceFiles = blobs
    .filter((e) => SOURCE_EXT_RE.test(e.path!) && (e.size ?? 0) > 0)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, MAX_KEY_FILES)

  const candidates = [...depFiles, ...(readmeFile ? [readmeFile] : []), ...largestSourceFiles]
    .filter((e, i, arr) => arr.findIndex((x) => x.path === e.path) === i)
    .slice(0, MAX_KEY_FILES)

  const keyFiles = await Promise.all(
    candidates.map(async (entry) => {
      const { data: blob } = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha! })
      const content = Buffer.from(blob.content, 'base64').toString('utf8').slice(0, MAX_FILE_CHARS)
      return { path: entry.path!, content }
    })
  )

  return { fileTree, keyFiles }
}
