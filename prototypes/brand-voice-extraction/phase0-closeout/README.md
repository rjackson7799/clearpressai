# Phase 0 Closeout

Self-contained record of the brand-voice-extraction validation that passed Phase 0 on 2026-05-12. The full source `outputs/runs/` directory is gitignored as experimental data; the artifacts that matter live here.

## Contents

- **[PROMPT-FINAL.md](PROMPT-FINAL.md)** — the validated extraction prompt. Graduates to `src/lib/prompts/brand-voice.ts` in Phase 2 unchanged.
- **[eval-notes.md](eval-notes.md)** — filled-in rubric, verdict, and Phase 3 carry-forward notes.
- **az-profile.json** — extracted AstraZeneca KK voice profile (primary success target).
- **chugai-profile.json** — extracted Chugai Pharmaceutical voice profile (cross-company distinguishability contrast).
- **az-generated-holdout.txt** — generated press release from the held-out brief (2025-09-24 トルカプのコンパニオン診断). Use for side-by-side comparison with the real release at https://www.astrazeneca.co.jp/news/press-releases1/2025/202509241.html.
- **\*-meta.json** files — token counts, timings, model strings, prompt versions per run.

## Verdict

**☑ Pass.** AZ profile passed rubric on round 1 of prompt iteration (TSD §16 expected 5–10). Tone match on held-out generation: 4/5. Cross-company distinguishability: decisive.

The product premise (per-client voice as the differentiator) is validated. Phase 1 (Foundation) can proceed.
