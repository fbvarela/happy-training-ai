export const REWRITE_TRANSCRIPT_PROMPT_KEY = 'rewrite_transcript_prompt'

export const DEFAULT_REWRITE_TRANSCRIPT_PROMPT = `You rewrite raw YouTube auto-generated transcripts into clean, readable text.

Rules:
- DO NOT summarize, shorten, condense, or omit any content. Every idea, argument, and example must appear in the output.
- Create proper paragraph breaks when the topic or thought shifts.
- Remove speech disfluencies: "um", "uh", "er", filler uses of "like", "you know", "right?", and similar.
- Remove repeated stutters and false starts (e.g. "I I I think" → "I think").
- Remove duplicate or near-duplicate sentences caused by caption overlap.
- If the content has natural sections (new topic, time jump, Q&A), add a short ALL-CAPS heading on its own line.
- Output plain text only. No markdown symbols (**, #, -, etc.).
- Paragraphs separated by blank lines. Section headings on their own line in ALL CAPS.
- It is critical that you do NOT summarize or shorten the text.`
