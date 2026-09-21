import { Database, KeyRound, WandSparkles } from 'lucide-react'
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
      <TopBar title="Settings" description="Configure API keys and AI behavior" />

      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ marginBottom: '14px' }}>
            <span className="section-label">Providers</span>
          </div>
          <div className="hf-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="icon-tile" style={{ width: '38px', height: '38px' }}>
                <KeyRound size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--bark)', fontSize: '0.95rem' }}>AI API Keys</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set in .env.local — read only</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="input-label" htmlFor="cohere">Cohere API Key</label>
                <input id="cohere" className="hf-input" type="password" placeholder="..." disabled value="Set in .env.local" />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Used for summarize, explain, rewrite, ask, topic synthesis, and repo suggestions.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '14px' }}>
            <span className="section-label">AI behavior</span>
          </div>
          <div className="hf-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div className="icon-tile" style={{ width: '38px', height: '38px' }}>
                <WandSparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--bark)', fontSize: '0.95rem' }}>AI Prompts</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>System prompts used by each AI feature</div>
              </div>
            </div>
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
        </div>

        <div>
          <div style={{ marginBottom: '14px' }}>
            <span className="section-label">Storage</span>
          </div>
          <div className="hf-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="icon-tile" style={{ width: '38px', height: '38px' }}>
                <Database size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--bark)', fontSize: '0.95rem' }}>Database</div>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Using Neon PostgreSQL. Configure{' '}
              <code style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '1px 6px', borderRadius: '6px', border: '1px solid var(--line)' }}>DATABASE_URL</code>{' '}
              in <code style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '1px 6px', borderRadius: '6px', border: '1px solid var(--line)' }}>.env.local</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}