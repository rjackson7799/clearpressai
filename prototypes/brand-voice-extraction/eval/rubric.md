# Phase 0 Evaluation Rubric

Fill in one copy of this rubric per `outputs/runs/<folder>/` once the
run completes. Save it as `eval-notes.md` inside the same run folder so
the assessment lives next to the artifacts it judges.

The goal is *not* a perfect score on every line. The goal is to spot the
pattern: if the same fields are consistently weak across iterations, the
prompt isn't fixing the underlying problem and we need a different
approach (or the product premise is wrong).

---

## Run metadata

- Run folder: `outputs/runs/__________`
- Prompt version: `__________`
- Model: `__________`
- Companies in this run: __________

## Per-company profile assessment

Repeat this block once per company.

### Company: __________

**1. `tone_keywords` specificity**

Count how many of the listed keywords pass this test: *could a generic
pharma PR reviewer have written the same keyword for a competitor?* If
yes, the keyword is generic.

- Specific count: __ / __
- Pass threshold: ≥ 3 of 5 specific
- Verdict: ☐ pass  ☐ fail
- Notes:

**2. `signature_phrases` realism**

For each phrase, search it (or a distinctive fragment) on the company's
own website or in a general web search. Does it skew strongly to this
company?

- Confirmed company-specific: __ / __
- Verdict: ☐ pass  ☐ fail
- Notes:

**3. `words_to_avoid` is data-grounded**

Are the listed words actually absent from the samples (or are they 薬機法
forbidden terms)? Or do they look guessed?

- Verdict: ☐ pass  ☐ partial  ☐ fail
- Notes:

**4. `stylistic_patterns` falsifiability**

Could someone reading the samples *verify* the claims, or are they too
vague to be wrong?

- Verdict: ☐ pass  ☐ partial  ☐ fail
- Notes:

**5. `preferred_vocabulary` plausibility**

Spot-check 3 entries against the samples. Do they actually appear?

- Hit rate: __ / 3
- Verdict: ☐ pass  ☐ fail
- Notes:

**6. `length_norms` completeness**

Does it cover the content types actually represented in the samples? Are
the ranges plausible (i.e., a 1,000–1,400字 estimate for a sample set
averaging 1,200字 = pass; a 500字 estimate for the same = fail)?

- Verdict: ☐ pass  ☐ partial  ☐ fail
- Notes:

---

## Cross-company distinguishability

(Only meaningful when ≥ 2 companies in the run.)

Imagine the company names are removed. Could you tell which profile
belongs to which company by reading them alone?

- Verdict: ☐ pass (clearly distinguishable)  ☐ borderline  ☐ fail (largely interchangeable)
- Notes (what gives them away, or what makes them blur):

---

## Generation test (only if generate-test-release.ts was run this round)

### Tone match against held-out real release

- Score (1 = unrelated, 5 = could be from same writer): __ / 5
- Notes:

### Voice tells

- Does the generated text use the profile's `signature_phrases` somewhere natural? ☐ yes ☐ no
- Does it use the profile's `preferred_vocabulary` somewhere natural? ☐ yes ☐ no
- Does it avoid the `words_to_avoid` list? ☐ yes ☐ no

### Compliance plausibility (spot check, not the full compliance pipeline)

- Avoids 画期的 / 革命的 / 驚異的 / 夢の / 奇跡 / 確実な治療効果? ☐ yes ☐ no
- Efficacy claims have statistical context where claimed? ☐ yes ☐ n/a ☐ no
- Notes:

---

## Verdict

Pick one:

- ☐ **Pass** — extraction is specific, distinguishable, and the generation
  test produced a believable Company A-flavored release. Phase 0
  complete; move to Phase 1.
- ☐ **Iterate** — output has the right shape but specific weaknesses to
  address in the next prompt revision. List the specific changes to try
  in the next run.
- ☐ **Halt-and-reconsider** — output is consistently generic despite
  iteration, or profiles can't be reliably distinguished from each
  other. The product premise (per-client voice as the differentiator)
  needs to be re-examined before building Phase 1.

Verdict notes:
