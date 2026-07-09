import { TopBar } from '@/components/layout/TopBar'
import { PromptEditor } from '@/components/settings/PromptEditor'
import { EXPLAIN_TRANSCRIPT_PROMPT_KEY, DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT } from '@/lib/ai/explainTranscriptPrompt'
import { EXPLAIN_CODE_PROMPT_KEY, DEFAULT_EXPLAIN_CODE_PROMPT } from '@/lib/ai/explainCodePrompt'
import { REWRITE_TRANSCRIPT_PROMPT_KEY, DEFAULT_REWRITE_TRANSCRIPT_PROMPT } from '@/lib/ai/rewriteTranscriptPrompt'
import { SUMMARIZE_PROMPT_KEY, DEFAULT_SUMMARIZE_PROMPT } from '@/lib/ai/summarizePrompt'
import { SYNTHESIZE_PROMPT_KEY, DEFAULT_SYNTHESIZE_PROMPT } from '@/lib/ai/synthesizePrompt'

export default function SettingsPage() {
  return (
    <div>
      <TopBar title="Settings" description="Configure API keys and preferences" />

      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="hf-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', color: 'var(--bark)' }}>AI API Keys</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="field" style={{ margin: 0 }}>
              <label className="input-label" htmlFor="groq">Groq API Key</label>
              <input id="groq" className="hf-input" type="password" placeholder="gsk_..." disabled value="Set in .env.local" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Used for transcription, snippet explain, and Q&amp;A.</p>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="input-label" htmlFor="cohere">Cohere API Key</label>
              <input id="cohere" className="hf-input" type="password" placeholder="..." disabled value="Set in .env.local" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Used for semantic search and topic synthesis.</p>
            </div>
          </div>
        </div>

        <div className="hf-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', color: 'var(--bark)' }}>AI Prompts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <PromptEditor
              settingKey={EXPLAIN_TRANSCRIPT_PROMPT_KEY}
              label="Transcript explanation prompt"
              description="System prompt used when generating an AI explanation from a resource's transcript."
              defaultPrompt={DEFAULT_EXPLAIN_TRANSCRIPT_PROMPT}
            />
            <PromptEditor
              settingKey={EXPLAIN_CODE_PROMPT_KEY}
              label="Code explanation prompt"
              description={'System prompt used by "Explain with AI" on code snippets.'}
              defaultPrompt={DEFAULT_EXPLAIN_CODE_PROMPT}
            />
            <PromptEditor
              settingKey={REWRITE_TRANSCRIPT_PROMPT_KEY}
              label="Transcript rewrite prompt"
              description="System prompt used to clean up a raw YouTube transcript into readable text."
              defaultPrompt={DEFAULT_REWRITE_TRANSCRIPT_PROMPT}
            />
            <PromptEditor
              settingKey={SUMMARIZE_PROMPT_KEY}
              label="Resource summary prompt"
              description="System prompt used to generate a resource's AI summary."
              defaultPrompt={DEFAULT_SUMMARIZE_PROMPT}
            />
            <PromptEditor
              settingKey={SYNTHESIZE_PROMPT_KEY}
              label="Topic synthesis prompt"
              description="System prompt used to generate a topic's AI learning map from its resources."
              defaultPrompt={DEFAULT_SYNTHESIZE_PROMPT}
            />
          </div>
        </div>

        <div className="hf-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--bark)' }}>Database</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Using Neon PostgreSQL. Configure{' '}
            <code style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--line)' }}>DATABASE_URL</code>{' '}
            in <code style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--line)' }}>.env.local</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
