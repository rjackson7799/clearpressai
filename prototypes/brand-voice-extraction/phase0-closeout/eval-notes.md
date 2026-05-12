# Phase 0 Evaluation Notes

Filled in against the rubric template at [../eval/rubric.md](../eval/rubric.md).

## Run metadata

- **Evaluation date:** 2026-05-12
- **Prompt version:** `v1-tsd-baseline` (verbatim from TSD §6.1, no iteration)
- **Model:** `claude-sonnet-4-6`
- **Companies in this run:** AstraZeneca KK (`astrazeneca-jp`, 15 samples), Chugai Pharmaceutical (`chugai`, 15 samples)
- **Source run folders:**
  - `outputs/runs/2026-05-12T1011-tsd-baseline/` — AZ extraction
  - `outputs/runs/2026-05-12T1014-tsd-baseline/` — Chugai extraction
  - `outputs/runs/2026-05-12T1025-astrazeneca-jp-holdout-202509241/` — AZ generation test

---

## Per-company profile assessment

### Company: AstraZeneca KK (primary success target)

**1. `tone_keywords` specificity** — 7 entries:

- "エビデンス数値明示型" — specific (matches AZ's HR/CI/p-value emphasis in training samples)
- "産官学連携強調" — specific (captures the Koriyama / Nara / Niigata local-government collaboration pattern unique to AZ Japan)
- "患者さん中心の語り口" — moderately specific (consistent 〜さん honorific)
- "慎重な効果表現（傾向・可能性を多用）" — specific (cautious 傾向/可能性 framing)
- "グローバル実績を日本文脈に接続" — highly specific (the foreign-multinational-localized signature)
- "アンメットニーズ訴求型" — pharma-generic but real
- "承認状況の透明な注記" — highly specific (captures the recurring 「本邦未承認」 disclosure)

Specific count: 6 / 7. Pass threshold ≥ 3 of 5. **Verdict: ✓ pass**

**2. `signature_phrases` realism** — 6 entries:

| Phrase | AZ-specific? |
|---|---|
| 「患者さんの人生を変える医薬品をお届けすることを目標としています」 | ✓ verifiable AZ Japan tagline |
| 「統計学的に有意かつ臨床的に意義のある延長を示しました」 | ✓ recurring across clinical PRs |
| 「サイエンス志向のグローバルなバイオ医薬品企業」 | ✓ standard AZ company-description |
| 「アンメットメディカルニーズの高い特定の臨床領域に免疫療法の概念を積極的に導入しています」 | ✓ AZ Japan oncology-pipeline framing |
| 「本邦未承認」 | ✓ regulatory disclosure boilerplate when translating from UK parent |
| 「患者さんの健康と医療の発展への更なる貢献を果たすべく活動しています」 | ✓ AZ Japan corporate boilerplate |

**Verdict: ✓ pass** (6/6 AZ-specific)

**3. `words_to_avoid` is data-grounded** — 10 entries:

Mix of 薬機法-forbidden absolute terms (画期的, 革命的, 驚異的, 夢の薬, 奇跡的) and absolutist efficacy claims (完治, 根絶, 必ず効く, 副作用なし, 最高の). All are either observed-absent from the training corpus or explicitly prohibited by 薬機法 第66条. None look guessed.

**Verdict: ✓ pass**

**4. `stylistic_patterns` falsifiability:**

> 冒頭で製品名・適応症・承認機関または試験名を明示し、続いて数値データ（ハザード比・信頼区間・p値など）を具体的に列挙する構成を取る。段落ごとに「〇〇について」という小見出しを設け、製品説明・疾患背景・試験概要・企業概要の順に情報を積み上げる定型構造が全文書に共通する。引用文（医師・患者・当社幹部のコメント）を本文中に組み込み、科学的記述と人間的視点を交互に配置することで、データ重視と患者視点を同時に示す。文末には参照文献リストを付し、全ての疾患統計・臨床試験結果に出典番号を付番することで、薬機法遵守への意識を可視化する。

Each claim is verifiable against the 15 training samples (spot-checked: EMERALD-3, MATTERHORN, テゼスパイア承認 all match). Not vague.

**Verdict: ✓ pass**

**5. `preferred_vocabulary` plausibility** (15 entries):

Spot-checked entries in training samples:
- "ハザード比" → appears 18× across samples ✓
- "アンメットメディカルニーズ" → appears 11× ✓
- "産官学" → appears 6× (in CSR/community-collab releases) ✓

Hit rate on 3-spot-check: 3/3. **Verdict: ✓ pass**

**6. `length_norms` completeness:**

- `press_release`: "1,500〜4,000字（製品承認・試験結果系は注釈・文献込みで3,000〜5,000字）" — calibrated against the actual sample range (3 short CSR pieces ~2,000字 to 1 long EMERALD-3 ~9,000字). Reasonable.
- `executive_statement`: "150〜300字（引用形式）" — plausible for inline quotes.
- `blog_post`: "" (empty) — correct; no blog posts in training corpus.

**Verdict: ✓ pass**

---

### Company: Chugai Pharmaceutical (cross-company contrast)

**1. `tone_keywords` specificity** — 5 entries:

- "データ根拠を前面に出す" — moderately specific
- "患者視点を優先する" — moderately specific
- "慎重かつ事実ベース" — **too generic** (true of most JP pharma)
- "科学的厳密さを重視" — **too generic**
- "グローバル連携を強調" — specific (captures the Roche-partnership signature)

Specific count: 3 / 5. **Verdict: ⚠ marginal pass** (at rubric threshold)

**2. `signature_phrases` realism** — 6 entries, mixed:

- ✓ 「患者さんに革新的な医薬品を一日も早くお届けできるよう」 — Chugai-specific
- ⚠ 「〜についてお知らせいたします」 — generic JP business style
- ⚠ 「〜と語っています」 — generic JP business style
- ✓ 「患者中心の高度で持続可能な医療の実現に取り組んでまいります」 — Chugai corporate mission
- ⚠ 「〜の臨床試験成績に基づいています」 — generic clinical phrasing
- ✓ 「ロシュ社と緊密に連携しながら〜着実に進め」 — Chugai-Roche signature

**Verdict: ⚠ marginal pass** (3/6 specific)

**3. `words_to_avoid` is data-grounded:** 8 entries, all 薬機法-aligned. ✓ pass

**4. `stylistic_patterns` falsifiability:** Specific claim about Chugai's 「中外製薬株式会社（本社：東京、代表取締役社長 CEO：奥田 修）は、〜についてお知らせいたします」 opening — verifiable in 13/15 samples. ✓ pass

**5. `preferred_vocabulary` plausibility:** Spot-checked. ✓ pass

**6. `length_norms` completeness:** Captures the genuine bimodal length (substantive releases 2,500–5,900字; Roche-partner relays 400–1,200字). ✓ pass

---

## Cross-company distinguishability

**Decisive — clear distinguishability.** With company names removed:

| Distinguisher | AZ profile | Chugai profile |
|---|---|---|
| Partnership signal | 産官学連携 (gov/academia) | ロシュ社との連携 (corporate parent-like) |
| Regulatory framing | 本邦未承認 disclosures | 製造販売承認 (Japan-specific term) |
| Corporate ID phrase | サイエンス志向のグローバルなバイオ医薬品企業 | 患者中心の高度で持続可能な医療 |
| CEO/exec naming | (none — translation-style) | 代表取締役社長 CEO：奥田 修 |
| Origin framing | UK parent translation | 東京本社 born-Japanese |

**Verdict: ✓ pass — clearly distinguishable**

---

## Generation test (held-out AZ release)

- **Held-out release:** 2025-09-24 「アストラゼネカのトルカプに対するコンパニオン診断に関するお知らせ」
- **URL:** https://www.astrazeneca.co.jp/news/press-releases1/2025/202509241.html (996字)
- **Brief:** [../test-briefs/astrazeneca-jp/202509241-brief.json](../test-briefs/astrazeneca-jp/202509241-brief.json)
- **Generated output:** [az-generated-holdout.txt](az-generated-holdout.txt) (2,472字)

### Tone match score

**4 / 5** (could be from same writer; clearly recognizable as AZ; not interchangeable with Chugai or generic pharma AI).

### Voice tells check

- ✓ Generated uses 4 of 6 profile signature_phrases in plausible places (「患者さんの人生を変える医薬品をお届けすることを目標としています」, 「サイエンス志向のグローバルなバイオ医薬品企業」, 「アンメットメディカルニーズ」, 「患者さんの健康と医療の発展への更なる貢献」)
- ✓ Uses preferred_vocabulary in natural positions (アンメットメディカルニーズ, 産官学連携, 健康寿命延伸, 転帰の改善, 早期発見・早期治療)
- ✓ Avoids all words_to_avoid (画期的, 革命的, 驚異的, 夢の薬, 奇跡, 完治, 必ず効く)
- ✓ Applies stylistic_patterns (「〇〇について」 subsection headers, numbered references with citations)

### Compliance plausibility (spot check)

- ✓ No 誇大表現 forbidden terms
- ✓ Subjective claims minimized (one borderline: 「重要な一歩」 in subtitle)
- ✓ Required boilerplate present (アストラゼネカについて, 日本での重点領域, contact info)
- ✓ Constraint respected: clearly states 「本承認は理研ジェネシス社が取得したものであり、当社が直接取得した承認ではありません」

### Notable divergences from real release

These exist but **do not invalidate the voice extraction** — they're brief-discipline issues that belong to the Phase 3 variant-generation prompt:

1. **Length:** 2,472字 vs real 996字. The profile's `length_norms.press_release` (1,500–4,000字) doesn't model the "partner acknowledgment" sub-type. → Addressable in Phase 3.
2. **Invented facts:** Generated states 「本社：大阪市北区」, 「代表取締役社長：ステファン・ヴォーゲル」, 「1993年に設立」, 「100か国以上」 (real boilerplate says 「125カ国以上」). None of these were in the brief. → Addressable via Phase 3 system prompt discipline.
3. **Marketing-tone leakage:** 「重要な一歩」 — borderline subjective claim not in the avoid list but absent from real release. → Could be added to a refined `words_to_avoid` if recurring.

---

## Verdict

**☑ Pass** — Phase 0 complete.

Extraction is specific, distinguishable, and the generation test produced a recognizably AZ-Japan-flavored release that an AZ reader would identify as on-voice. Phase 0's load-bearing technical question ("does brand-voice extraction produce specific, useful profiles?") is answered affirmatively. The product premise — per-client voice as the differentiator — stands.

**Iterations required:** 1 (TSD §16 expected 5–10).

**Next:** Move to Phase 1 (Foundation). The validated prompt at [PROMPT-FINAL.md](PROMPT-FINAL.md) graduates to `src/lib/prompts/brand-voice.ts` in Phase 2 with no changes.

**Carry-forward for Phase 3 (variant-generation prompt design):**

- Length norms need sub-type granularity (full-clinical announcement vs partner acknowledgment vs CSR/event vs business news). The Phase 3 prompt should ask the model to recognize content sub-type from the brief and apply the matching length norm, not just one global norm.
- The variant-generation system prompt must include a fact-invention guardrail: "Do not invent facts not present in the brief — including company HQ city, executive names, founding year, country counts, etc. If the brief doesn't specify, omit rather than guess."
