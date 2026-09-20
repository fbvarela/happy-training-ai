# Spec — How to Write Prompts Like a Claude Developer

> Status: Draft · Created: 2026-06-19

## Context

Users of happy-code-ai write system prompts, skills, slash commands, and agent bodies. Most
developers have learned prompting by trial and error. Anthropic engineers use a consistent set
of principles that produce more reliable, cheaper, and safer results. This spec captures those
principles as a reference section — to be surfaced in-app (help panel, tooltip, or doc page)
and used as the benchmark when reviewing user-written artifacts.

Related: `spec-useful-skills-ideas.md` (skill catalog), `spec-agent-artifact-manager.md`
(artifact taxonomy), `docs/GUIA-ARTEFACTOS.md` (usage guide).

---

## Goals

- Document the prompt-writing principles that Anthropic engineers apply internally.
- Give users a concrete checklist they can apply to any artifact before saving.
- Provide before/after examples for each principle.
- Be short enough to read in five minutes.

## Non-goals

- Exhaustive prompt engineering survey (academic depth).
- Coverage of non-Claude models (GPT, Gemini) — this is Claude-specific.
- Automated linting of prompts (that is a follow-up feature, see Risks).

---

## Proposed design: the reference section

### 1. Start with the role, then the task

**Why.** Claude infers its behavior from the opening sentences. A clear role ("You are a senior
security auditor") primes tone, vocabulary, and refusal thresholds before the task is described.

**Pattern.**
```
You are a [role] specializing in [domain].
Your job is to [primary task].
```

**Anti-pattern.** Burying the role in paragraph three, or omitting it entirely and relying on
task description alone. The model will still produce output, but it will be more generic.

---

### 2. Instructions before content

**Why.** Claude processes the prompt left-to-right. Placing instructions first means the model
reads *how* to approach the content before it reads the content itself, which improves
instruction-following on long inputs.

**Pattern.**
```
Review the following code for security issues. Focus only on authentication
and authorization. Ignore style.

<code>
{{code}}
</code>
```

**Anti-pattern.**
```
<code>{{code}}</code>

Review the above for security issues.
```

---

### 3. Use XML tags to separate roles and sections

**Why.** Claude was trained with XML-tagged structure. Tags create unambiguous boundaries
that survive copy-paste, concatenation, and template substitution. They also make it easier
to extract specific sections programmatically.

**Pattern.**
```xml
<instructions>
Only answer questions about the provided document.
If the answer is not in the document, say "I don't know."
</instructions>

<document>
{{document}}
</document>

<question>{{question}}</question>
```

**Useful tags.** `<instructions>`, `<context>`, `<examples>`, `<input>`, `<output_format>`,
`<constraints>`, `<thinking>` (for visible reasoning), `<answer>`.

**Anti-pattern.** Using markdown headers (`## Instructions`) for structural separation —
they work, but XML tags are more reliable across Claude model versions.

---

### 4. Be explicit about what NOT to do

**Why.** Positive instructions are parsed correctly, but Claude will sometimes add
unrequested content (caveats, apologies, extra context). Explicitly forbidding unwanted
behavior is more reliable than hoping the positive instruction implies it.

**Pattern.**
```
Write the commit message.
Return only the message text — no explanation, no preamble, no trailing newline.
Do not wrap it in quotes or a code block.
```

**Anti-pattern.** "Write just the commit message." — "just" is ambiguous.

---

### 5. One job per prompt

**Why.** Claude performs best on a single, clearly scoped task. Prompts that ask for
multiple independent outputs ("review the code AND write tests AND update the docs")
cause the model to trade off quality across tasks and make the output harder to parse.

**Pattern.** One system prompt = one responsibility. Chain multiple prompts for multi-step
pipelines, or use subagents to delegate separate jobs.

**Anti-pattern.** A 600-word system prompt that covers code review, test generation,
documentation, and commit messages in the same body.

---

### 6. Ground the model in examples (few-shot)

**Why.** Describing the desired output format is less reliable than showing it. A single
example that demonstrates the exact format, tone, and level of detail is worth three
paragraphs of description.

**Pattern.**
```
Format each finding as:
<finding>
  <file>src/auth.js</file>
  <line>42</line>
  <severity>high</severity>
  <description>SQL injection via unsanitized user input</description>
  <fix>Use parameterized queries</fix>
</finding>
```

**Anti-pattern.** "Return findings as structured data with file, line, severity,
description, and fix." — the model will invent a format and it may vary between calls.

---

### 7. Tell the model what to do when it's stuck

**Why.** Claude will hallucinate an answer rather than admit uncertainty if the prompt
doesn't give it permission to say "I don't know." Explicitly handling the uncertain case
reduces fabrication.

**Pattern.**
```
If you cannot determine the answer from the provided code, say:
"Insufficient context: I need [specific thing] to answer this."
Do not guess.
```

**Anti-pattern.** Leaving the fallback implicit. The model will fill the gap with the
most plausible-sounding answer, which may be wrong.

---

### 8. Prefer specificity over length

**Why.** A 50-word prompt with precise constraints outperforms a 500-word prompt with
vague guidance. Long prompts increase cost, reduce cache hit rate, and dilute the most
important instructions (recency bias means the *last* instruction gets more weight than
instructions buried in the middle).

**Heuristics.**
- Replace "be concise" with "respond in ≤ 3 sentences."
- Replace "focus on important issues" with "report only severity high and critical."
- Replace "follow best practices" with "follow PEP 8 for Python, Google style for JS."
- Replace "explain your reasoning" with "think step by step inside `<thinking>` tags."

---

### 9. Use prefilling to control output format

**Why.** Prefilling the assistant turn (starting the model's response for it) is the
most reliable way to enforce output format in API calls. Claude will continue from
exactly where the prefix ends.

**Pattern (API).**
```json
{
  "messages": [
    { "role": "user", "content": "Classify the sentiment." },
    { "role": "assistant", "content": "{\"sentiment\":" }
  ]
}
```

The model will complete the JSON object, not wrap it in prose.

**Note.** Prefilling is an API technique; CLI artifacts can approximate it with strong
`<output_format>` instructions and a concrete example.

---

### 10. Design for the cache

**Why.** Claude's prompt cache has a 5-minute TTL for Anthropic API calls. System prompts
that are identical across requests hit the cache and cost ~10× less. Variable content
belongs in the *user* turn, not the system prompt.

**Pattern.** System prompt = stable instructions + examples. User turn = the actual
input (code snippet, question, document).

**Anti-pattern.** Interpolating `{{filename}}` or timestamps directly into the system
prompt — this busts the cache on every call.

---

### 11. Calibrate the thinking budget to the task

**Why.** Extended thinking (where Claude reasons step by step before answering) costs
more tokens but significantly improves accuracy on multi-step reasoning tasks. It is
overkill for format conversions or simple lookups.

**Use extended thinking when:**
- The task requires more than two logical steps.
- The answer depends on weighing competing constraints.
- Correctness matters more than latency.

**Skip it when:**
- The output is deterministic (format conversion, extraction).
- The task is a single lookup or classification.
- Latency is a hard constraint.

---

### 12. The checklist

Before saving any agent, skill, or system prompt:

- [ ] Role defined in the first sentence.
- [ ] Instructions come before the content they describe.
- [ ] XML tags used for multi-section prompts.
- [ ] At least one negative instruction ("do not…") for each common failure mode.
- [ ] Prompt does one job. If it does two, split it.
- [ ] At least one concrete example for any non-trivial output format.
- [ ] The "I don't know" case is handled explicitly.
- [ ] Vague qualifiers replaced with specific constraints.
- [ ] Variable content is in variables (`{{…}}`), not hardcoded.
- [ ] Prompt has been tested with at least one real input.

---

## Alternatives considered

**Link out to Anthropic's public docs instead of writing our own.** External links rot,
require network access, and can't be customized to the artifact types in happy-code-ai.
An in-app reference with examples matched to the app's artifact shapes is more useful.

**Surface this as a tooltip on each field.** Too fragmented — the principles work together,
and reading them as a coherent set produces better internalization than per-field hints.
Per-field hints are a good *additional* layer (phase 2), not a replacement.

## Risks & open questions

- **Automated prompt linting.** Principles 1–5 are mechanical enough to check
  programmatically (role in first sentence, XML tags present, single-job heuristic via
  word count and conjunction density). This could become a "lint" button in the editor —
  but that is a separate feature.
- **Claude version drift.** Some recommendations (XML tags, prefilling) are specific to
  how Claude 3+ was trained. If the user targets a non-Claude model, some advice may not
  apply. The section should note it is Claude-specific.
- **ES translation.** Like all in-app content, this section needs an ES version if
  surfaced in the UI.

## Rollout plan

Phase 1: add this as a static doc page (`/docs/prompt-guide` or linked from the editor's
help panel). No new DB work; just a React page rendering the content.

Phase 2: surface a condensed checklist (the 10 bullets from §12) in the ArtifactEditor
sidebar, collapsible. Link to the full doc for depth.

Phase 3 (optional): automated lint pass on save — flag prompts that fail checks 1, 2, 4,
and 6 with inline suggestions.

## Success metrics

- Users who read the guide produce prompts that score higher on the §12 checklist
  (manual audit of 10 saved artifacts before vs. after).
- Editor help panel click-through rate ≥ 15% (indicates users find it discoverable).
- Reduction in "my agent keeps doing X I told it not to do" support questions.
