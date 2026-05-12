# Brand Voice Extraction — Phase 0 Prototype

Pre-product. Discardable. The point of this folder is to **fail fast** if
brand-voice extraction can't produce specific, useful per-client voice
profiles. If extraction works, the validated prompt graduates to the
production codebase in Phase 2 and this folder can be archived.

See the project plan: `../../docs/PRD-v1.1.md` Appendix B and
`../../docs/TSD-v1.md` §16 (Phase 0).

---

## Setup (one time)

```powershell
cd prototypes/brand-voice-extraction
npm install
copy .env.example .env
# Edit .env: set ANTHROPIC_API_KEY to your real key
```

## What you need to provide before running

Drop plain-text press releases into the `samples/` subfolders:

```
samples/
  company-a/   ← 10–15 .txt files from one real Japanese pharma company
  company-b/   ← same, from a company whose voice you intuitively feel is different
  company-c/   ← optional third for triangulation
```

Tips:
- Pick companies whose IR / news pages are public (e.g., Takeda, Daiichi
  Sankyo, Astellas, Eisai, Chugai, Otsuka). Copy-paste from the web is
  fine.
- One press release per file. Filename doesn't matter; alphabetical
  order is preserved across runs so input order is stable.
- Plain `.txt` only for Phase 0. PDF/DOCX parsing is Phase 2's problem.
- Files are gitignored by default (`.gitignore` excludes
  `samples/**/*.txt`) so we don't redistribute company content.

For the generation test, also create one brief file:

```
test-briefs/
  company-a-recent.json
```

Shape:

```json
{
  "content_type": "press_release",
  "free_text": "...a 2–3 paragraph plain-language brief of the announcement...",
  "key_messages": ["...", "..."],
  "quotes": [
    { "name": "山田太郎", "title": "代表取締役社長", "quote": "..." }
  ],
  "data_points": ["第III相試験", "n=1,200", "p<0.001"],
  "constraints": "1,200字程度。患者向け補足を含めない。"
}
```

The brief should be derived from a real recent release by Company A that
**is not in the training samples**. After generation, you'll compare the
generated output to the real release side-by-side.

---

## Running

### Extract a voice profile

```powershell
npm run extract -- company-a --tag baseline
```

Output:

```
outputs/runs/2026-05-11T1430-baseline/
  company-a-profile.json   ← the extracted profile
  company-a-meta.json       ← model, tokens, sample list, timing
  prompt-snapshot.md        ← the exact prompt used
```

Then run the other companies inside the same iteration:

```powershell
npm run extract -- company-b --tag baseline
npm run extract -- company-c --tag baseline
```

(They'll each get their own timestamp folder. If you want them grouped,
just use distinct tags per iteration, e.g., `baseline-companyA`,
`baseline-companyB`, etc.)

### Generate the test release

```powershell
npm run generate -- company-a `
  outputs/runs/2026-05-11T1430-baseline/company-a-profile.json `
  test-briefs/company-a-recent.json `
  --tag baseline
```

Output:

```
outputs/runs/2026-05-11T1432-company-a-baseline/
  company-a-generated.txt   ← the test release
  company-a-meta.json
  prompt-snapshot.md
```

### Evaluate

For each run, copy `eval/rubric.md` into the run folder as
`eval-notes.md` and fill it in. Verdict at the bottom:
**Pass / Iterate / Halt-and-reconsider**.

---

## Iteration loop

1. Run extraction on Company A.
2. Fill in the rubric.
3. If "iterate," propose a prompt change. Edit `src/prompts.ts`. Bump
   `EXTRACTION_PROMPT_VERSION` to something descriptive (e.g.,
   `v2-added-falsifiability-rule`).
4. Re-run with `--tag v2-added-falsifiability-rule` so the new run is
   distinguishable from the old.
5. Repeat. TSD §16 expects 5–10 iterations to reach a useful prompt.
6. Once Company A looks specific, run B and C with the **same** prompt
   version. Check cross-company distinguishability.
7. Run the generation test. Compare to the real held-out release.
8. Verdict.

---

## Exit criteria

Phase 0 is done when:

- The current prompt produces a Company A profile that passes the rubric
- The same prompt produces distinguishable profiles for B (and ideally C)
- The generation test scores ≥ 3 / 5 on tone match against the real release
- The verdict is **Pass**

The final prompt is committed to `PROMPT-FINAL.md` (write this at the
end of Phase 0) and Phase 1 begins. The prompt later transfers verbatim
into `src/lib/prompts/brand-voice.ts` in the production codebase.

If the verdict is **Halt-and-reconsider**, we stop and revisit the
product premise before spending Phase 1's days on the foundation.

---

## Configuration notes

- **Model:** pinned to `claude-sonnet-4-6` in both scripts. This is a
  conscious choice (latest Sonnet as of 2026-05-11); TSD §2.3's older
  pin (`claude-sonnet-4-5-20251022`) should be updated to match before
  Phase 2.
- **Output JSON schema:** validated with Zod (`src/schema.ts`). If the
  model returns malformed JSON or a wrong shape, the script exits with
  a clear error and saves the raw output for inspection.
- **Cost:** each extraction is roughly 5–15k input tokens (depending on
  sample length) and ≤ 1k output tokens. At Sonnet pricing, a full
  iteration (3 companies + 1 generation) is well under $1.

---

## Out of scope for Phase 0

Anything in TSD §1–§15 is downstream of Phase 0 and not built here:
no Supabase, no React, no Edge Functions, no compliance check, no
3-variant orchestration, no auth, no UI of any kind.
