# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Repository: https://github.com/baditaflorin/newsletter-flow

Live app: https://baditaflorin.github.io/newsletter-flow/

## Scope

This audit uses v1 behavior as the baseline. No Phase 2 ADRs, plan, fixtures, or code changes are included here.

The v1 happy path is:

1. Put an idea into the Idea Brief fields.
2. Add sources manually or paste RSS/Atom XML into the RSS box.
3. Generate a draft.
4. Polish or export.

## Real-World Inputs

### 1. Original Product Brief With Smart Punctuation

Source: the user's project brief in this thread.

Shape: freeform paragraph with smart quotes, em dash, `+`, dollar amounts, product names, and a tool-chain comparison.

What v1 did:

- Accepted it if pasted into `Raw notes`.
- Did not infer title, audience, angle, promise, cost breakdown, workflow stages, or source tags.
- Draft generation used the raw note as one paragraph but relied on whatever was already in the structured fields.

What it should have done:

- Detect "this is an idea brief."
- Extract cost claims, tool names, target user, workflow stages, and likely promise.
- Populate the structured idea fields as a first guess with confidence.

Failure mode:

- Wrong-by-omission. The app stays quiet and makes the user structure the obvious parts manually.

Manual work the user had to do:

- Split the paragraph into title, audience, angle, promise, notes, and image keywords.

Baseline result: partial.

### 2. NASA News Releases RSS

Input URL used for audit: https://www.nasa.gov/news-release/feed/

Observed shape: RSS 2.0, WordPress-style namespaces, around 294 KB at audit time, 10 items.

What v1 did:

- Imported the 10 feed items.
- Stripped HTML into source summaries/content.
- Marked every imported item as selected.
- Tagged every item only as `rss`.

What it should have done:

- Normalize dates.
- Preserve canonical source URL and publisher metadata.
- Summarize long content before drafting.
- Select or rank sources by relevance to the current idea instead of selecting all.

Failure mode:

- Mostly useful, but noisy. The failure is silent because every item looks equally trusted.

Manual work the user had to do:

- Deselect irrelevant sources.
- Rewrite summaries into something usable for a newsletter argument.

Baseline result: pass with manual cleanup.

### 3. W3C News RSS

Input URL used for audit: https://www.w3.org/blog/news/feed/

Observed shape: RSS 2.0, WordPress-style HTML content, around 53 KB at audit time, 25 items.

What v1 did:

- Imported the first 20 items because the UI slices RSS imports to 20.
- Lost the fact that 5 items were omitted.
- Selected everything.
- Did not surface freshness, source count, or omitted-item metadata.

What it should have done:

- Tell the user "25 found, 20 imported" and offer the remaining 5.
- Preserve source freshness and source count.
- Rank or group items by topic.

Failure mode:

- Silent truncation. The user is not told the imported set is incomplete.

Manual work the user had to do:

- Notice that the feed contained more than the app imported.
- Re-run or manually copy missed items.

Baseline result: partial.

### 4. Simon Willison Atom Feed

Input URL used for audit: https://simonwillison.net/atom/everything/

Observed shape: Atom feed, rich HTML/code content, around 105 KB at audit time, 30 entries.

What v1 did:

- Imported the first 20 entries.
- Stripped code-heavy HTML into flattened prose.
- Did not distinguish short link posts from longer articles.
- Did not explain why 10 entries were omitted.

What it should have done:

- Recognize Atom entry structure and entry type.
- Preserve code blocks or mark them as code.
- Summarize each entry separately.
- Tell the user the import was capped.

Failure mode:

- Silent truncation and lossy content normalization.

Manual work the user had to do:

- Clean flattened code/prose.
- Decide which entries matter.

Baseline result: partial.

### 5. GitHub React Releases Atom Feed

Input URL used for audit: https://github.com/facebook/react/releases.atom

Observed shape: Atom feed, technical release notes, nested author/link fields, around 20 KB at audit time, 10 entries.

What v1 did:

- Imported release entries as ordinary research sources.
- Flattened release-note markup.
- Did not classify this as a changelog/release feed.
- Did not infer version numbers, release dates, project name, or "technical changelog" shape.

What it should have done:

- Detect release-note shape.
- Extract versions, dates, repository/project, and high-signal changes.
- Warn that release notes may need summarization before drafting.

Failure mode:

- Wrong abstraction. The app treats changelog data like article prose.

Manual work the user had to do:

- Convert release notes into implications for newsletter readers.

Baseline result: partial.

### 6. Hacker News Front Page RSS

Input URL used for audit: https://hnrss.org/frontpage

Observed shape: RSS feed with aggregator titles, external links, comments links, and 20 items.

What v1 did:

- Imported 20 items.
- Treated HN metadata and outbound article URLs as one generic source shape.
- Selected all 20 by default.
- Did not separate discussion URL from article URL.

What it should have done:

- Detect aggregator feed shape.
- Preserve both original article URL and discussion URL.
- Mark low-confidence source summaries when description text is mostly metadata.
- Avoid selecting all items by default.

Failure mode:

- Wrong-but-confident source model. The imported sources look ready, but are not clean evidence.

Manual work the user had to do:

- Open items, choose actual sources, and manually capture context.

Baseline result: partial.

### 7. Web Dev Feeds OPML

Input URL used for audit: https://raw.githubusercontent.com/simevidas/web-dev-feeds/refs/heads/master/feeds.opml

Observed shape: OPML subscription list, around 169 KB at audit time, many `outline` entries with feed URLs.

What v1 did:

- If pasted into the RSS box, returned "No RSS or Atom entries were found in that XML."
- Did not detect OPML.
- Did not offer to extract feed URLs.

What it should have done:

- Detect OPML.
- Extract feed titles and `xmlUrl` values.
- Offer "import feeds as source candidates" or "pick feeds to fetch later."

Failure mode:

- Obvious but unhelpful. The error says what did not happen, not what the input actually is.

Manual work the user had to do:

- Know what OPML is.
- Extract feed URLs with another tool.

Baseline result: fail.

### 8. Real Article URL Only

Input URL used for audit: https://simonwillison.net/2026/May/7/llm-gemini/#atom-everything

Observed shape: a real article URL copied from an Atom entry.

What v1 did:

- If pasted into the source URL field with no title/content, the app allowed adding an `Untitled note`.
- The source looked selected even though it had no content.
- Draft generation did not fetch or extract article text.

What it should have done:

- Detect "URL-only source."
- Fetch when CORS allows, or clearly say browser fetching is blocked and ask for pasted article text.
- Never let an empty URL-only source look like evidence.

Failure mode:

- Wrong-but-confident. This is the worst failure in the audit.

Manual work the user had to do:

- Open the URL manually.
- Copy title, summary, and relevant excerpts into separate fields.

Baseline result: fail.

### 9. Article HTML Pasted Into RSS Box

Input URL used for audit source: https://simonwillison.net/2026/May/7/llm-gemini/#atom-everything

Shape: real article HTML pasted into the RSS/Atom XML textarea.

What v1 did:

- Returned "No RSS or Atom entries were found in that XML" or a parser-level failure depending on the pasted fragment.
- Did not detect HTML.
- Did not extract title, article body, headings, or canonical URL.

What it should have done:

- Detect HTML document or fragment.
- Extract likely article title and readable text.
- Add it as an article source with low/medium confidence and show what was inferred.

Failure mode:

- Obvious but not domain-aware. The user gave usable data in the wrong box, and the app did not help.

Manual work the user had to do:

- Move the same content into source title/content fields and clean boilerplate manually.

Baseline result: fail.

### 10. Truncated NASA RSS

Source derived from: https://www.nasa.gov/news-release/feed/

Shape: partial real feed, truncated mid-document to simulate an interrupted copy/paste or failed transfer.

What v1 did:

- Depending on truncation point, either imported partial data with no warning or showed a parser error.
- Did not say the XML appears truncated.
- Did not preserve partial recoverable items separately from fatal parse errors.

What it should have done:

- Detect likely truncation.
- Recover complete items if possible.
- Warn that the feed ended unexpectedly and list what was safely recovered.

Failure mode:

- Either silent partial import or technical error. Both are bad; silent partial import is worse.

Manual work the user had to do:

- Guess whether anything was imported safely.
- Re-copy the feed manually.

Baseline result: fail.

## Baseline Summary

Cleanly useful without correction: 2/10.

Partial but requires manual cleanup: 4/10.

Fails or misleads: 4/10.

The v1 app demos well with the curated default project, but real user input exposes three broad weaknesses: it does not detect input shape, it does not expose confidence, and it lets weak or empty evidence flow into confident drafts.

## Top 5 Logic Gaps

1. **No input-shape detection.** RSS, Atom, OPML, HTML, URL-only sources, freeform idea briefs, and truncated XML all enter through the same narrow controls. The app reacts only after the user picked the right box.
2. **No confidence model.** Imported sources, generated drafts, subject lines, and image briefs look equally authoritative whether they came from rich RSS content, an empty URL-only source, or flattened changelog markup.
3. **Source import is lossy and silent.** HTML/code is flattened, item caps are not disclosed, dates are not normalized, and omitted entries are not reported.
4. **No relevance ranking.** Every imported feed item is selected by default, even when a feed contains mixed topics or aggregator metadata.
5. **Errors do not explain recovery.** OPML, HTML-in-RSS, malformed XML, and empty input errors do not say what the input appears to be or what the user should do next.

## Top 3 Intuition Failures

1. **A URL in the URL field looks like a valid source even when the app has no article content.**
2. **RSS imports silently cap at 20 items, so preview/export can differ from the user's mental model of "I imported the feed."**
3. **The RSS box rejects OPML/HTML without saying "this is OPML" or "this is HTML"; users see a dead end instead of a correction path.**

## Top 3 "Feels Stupid" Moments

1. The user pastes a rich product brief, and the app does not infer title, audience, promise, cost claims, or workflow stages.
2. The user pastes an article URL, and the app makes them manually copy the article title and excerpt.
3. The user imports a feed, and the app selects every item instead of guessing which sources are relevant to the current idea.

## What "Smart" Means For Newsletter Flow

1. Pasting any common research input should produce a useful first guess: freeform brief, RSS, Atom, OPML, URL, HTML, or plain article text.
2. Every inferred source should carry visible confidence and reasoning: title, URL, date, type, summary, tags, and selected/not selected.
3. The app should rank sources against the current idea and avoid treating empty or low-confidence sources as evidence.
4. The app should normalize domain basics by default: dates, URLs, whitespace, HTML, tags, source type, and export provenance.
5. Failures should be domain-specific and recoverable: "This looks like OPML; import feed URLs instead?" beats "No RSS entries found."

## Phase 2 Substance Success Metrics

1. Real-data primary-flow pass rate improves from 2/10 clean passes to at least 7/10 clean passes.
2. The app detects the top-level input shape correctly for at least 9/10 audit inputs.
3. No fixture can produce a selected source with empty title and empty content.
4. RSS/Atom imports disclose found/imported/skipped counts 100% of the time.
5. Same fixture input produces byte-identical normalized output and export metadata across 5 repeated runs.
6. Median time from paste/import to useful preview is under 1 second for the 10 real-data fixtures.
7. Every failure message includes what failed, why in newsletter/source terms, and a next step.
8. Every generated export includes app version, schema version, source IDs, generation timestamp, and confidence summary.

## Explicitly Out Of Scope For Phase 2 Substance

- New product surfaces or navigation.
- Visual polish, dark mode, command palette, loading skeletons, animation, or marketing pages.
- Runtime backend, server-side scraping, auth, cloud sync, or secrets.
- Auto-posting to Substack, X, LinkedIn, Kit/ConvertKit, or Buffer.
- Subscriber management or email sending.
- Hosted LLM integrations.
- Heavy WASM additions unless a confirmed Phase 2 ADR later proves they are necessary.
- Any feature that expands the v1 workflow rather than making the existing workflow smarter.
