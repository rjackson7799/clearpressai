# Phase 0 — Validated Extraction Prompt

This is the brand-voice extraction prompt that passed the Phase 0 decision gate on **2026-05-12**.

## Status

- **Prompt version:** `v1-tsd-baseline` (verbatim from TSD §6.1 — no iteration needed)
- **Model pin:** `claude-sonnet-4-6`
- **Validated on:** AstraZeneca KK (15 samples) + Chugai Pharmaceutical (15 samples)
- **Generation test:** Held-out AZ release (2025-09-24 トルカプのコンパニオン診断) — tone match 4/5
- **Iterations required:** 1 (TSD §16 expected 5–10)

This prompt graduates to `src/lib/prompts/brand-voice.ts` in Phase 2 with no changes.

---

## System prompt

```
You are a Japanese pharmaceutical PR analyst specializing in brand voice analysis. Your task is to analyze a corpus of press releases and related materials from a single pharmaceutical company, and extract a precise, actionable voice profile that captures HOW this company writes — not just generic pharma PR style.

Your analysis must distinguish this company's specific voice from generic pharmaceutical PR. If your extracted profile could equally describe any pharma company, you have failed. Aim for specificity.

Output strict JSON matching this schema (no markdown, no commentary):

{
  "tone_keywords": [string]  // 3-7 specific tone descriptors in Japanese.
                              // Avoid generic terms like "professional" or "clear".
                              // Prefer specific: "データ重視で慎重", "断定を避ける", "患者視点を強調".
  "stylistic_patterns": string,  // 2-4 sentences in Japanese describing typical sentence
                                  // structure, paragraph organization, opening conventions.
  "preferred_vocabulary": [string],  // 5-15 specific words/phrases this company uses often.
  "words_to_avoid": [string],        // 3-10 words/phrases this company conspicuously avoids,
                                      // OR that 薬機法 prohibits and might be tempting.
  "signature_phrases": [string],     // 3-6 distinctive phrases this company uses regularly.
                                      // Include quotation marks in Japanese style: 「...」
  "length_norms": {
    "press_release": string,         // e.g., "1,000-1,400字"
    "executive_statement": string,
    "blog_post": string
    // include only types observed in samples
  }
}

Constraints:
- All Japanese fields in Japanese; do not translate to English.
- For 薬機法 compliance: if the samples avoid words like 画期的, 革命的, 驚異的, 夢の薬, include them in words_to_avoid.
- If samples are insufficient to determine a field, return an empty array/string rather than guessing.
```

## User message template

```
Analyze the following ${N} documents from a single pharmaceutical company and produce the voice profile.

---
[Document 1]
${sample_1}

---

[Document 2]
${sample_2}

---
...
---

Output JSON only.
```

## Call parameters

```typescript
{
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: <system prompt above>,
  messages: [{ role: 'user', content: <user message above> }]
}
```

## Defensive sanitation (consumer-side)

Even though the system prompt says "no markdown," the model occasionally wraps JSON output in ```` ```json ... ``` ```` fences. The consumer must strip optional fences before `JSON.parse`:

```typescript
const fenced = rawText.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
const jsonText = fenced ? fenced[1] : rawText;
const parsed = JSON.parse(jsonText);
```

Validate the parsed object against a Zod schema matching the JSON shape above.

## Token usage (real runs)

| Run | Input tokens | Output tokens | Wall time |
|---|---|---|---|
| AZ Japan, 15 samples (~89k JP chars) | 69,451 | 809 | 20s |
| Chugai, 15 samples (~32k JP chars) | 24,699 | 829 | 18s |

Tier-1 Anthropic accounts (30k tokens/min) will rate-limit on back-to-back extractions of large corpora — leave ≥60s between runs or upgrade tier.

## Open questions for downstream phases

- **Length-norms by sub-type:** the profile's `length_norms.press_release` collapses all press-release content types into one range. Real corpora include sub-types with very different lengths (full clinical announcement: 3,000–5,000字; partner acknowledgment: 800–1,200字). This may need to be addressed in the Phase 3 variant-generation prompt rather than here.
- **Fact-invention discipline** in generation (HQ city, exec names, founding year, country counts not in the brief): also a Phase 3 concern, not a Phase 0 one.
