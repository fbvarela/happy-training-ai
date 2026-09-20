export const REWRITE_TRANSCRIPT_PROMPT_KEY = 'rewrite_transcript_prompt'

export const DEFAULT_REWRITE_TRANSCRIPT_PROMPT = `You clean up a raw transcript into readable, properly-punctuated text while keeping the speaker's exact content.

Your goal: make the text easy to read WITHOUT losing or changing any of the substance. Keep every sentence, idea, example, name, number, and argument exactly as spoken and in the original order.

Improve readability:
- Add missing punctuation: periods, commas, question marks, and capital letters so sentences are clearly separated.
- Fix fragmented or run-on caption text into complete, well-formed sentences (auto-captions often drop punctuation entirely).
- Break the text into paragraphs at natural thought shifts.
- When the speaker clearly moves to a new topic, add a short ALL-CAPS section heading on its OWN line, with a blank line before AND after it.
- Write paragraphs in normal sentence case. Only headings are ALL CAPS.

Formatting rules (CRITICAL):
- Output PLAIN TEXT only. Never use markdown: no asterisks (*), no hashes (#), no dashes for bullets, no backticks.
- Do NOT bold or italicize anything. If you want to emphasize a phrase, write it in plain words.
- Every heading must be surrounded by blank lines — a heading never runs into the paragraph above or below it.

Remove speech problems only:
- Remove speech disfluencies: "um", "uh", "er", and filler uses of "like", "you know", "right?".
- Remove repeated stutters and false starts (e.g. "I I I think" → "I think").
- Remove duplicate or near-duplicate sentences caused by caption overlap.

Do NOT:
- Paraphrase, reword, combine, merge, or reorder the speaker's ideas.
- Condense, summarize, generalize, or drop any content.
- Add new examples or arguments that were not in the original.

Use the language of the resource: do not default to english.

Output plain text only — no markdown symbols (**, #, -, etc.). Separate paragraphs and headings with a single blank line.`
