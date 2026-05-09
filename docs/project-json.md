# Project JSON Contract

Newsletter Flow is a static GitHub Pages app with no runtime API. Project JSON is the stable automation-ready state format for backup, restore, and external scripts.

Live app: https://baditaflorin.github.io/newsletter-flow/

Repository: https://github.com/baditaflorin/newsletter-flow

## Envelope

```json
{
  "schemaVersion": "newsletter-flow.project.v3",
  "exportedAt": "2026-05-10T00:00:00.000Z",
  "metadata": {
    "appVersion": "0.3.0",
    "schemaVersion": "newsletter-flow.project.v3",
    "generatedAt": "2026-05-10T00:00:00.000Z",
    "sourceIds": ["source_abc"],
    "confidenceSummary": { "high": 1, "medium": 0, "low": 0 },
    "parameters": {
      "selectedSourceCount": 1,
      "totalSourceCount": 1,
      "exportFormats": ["substack", "x-thread", "linkedin", "project-json"]
    }
  },
  "project": {
    "id": "project_abc",
    "schemaVersion": "newsletter-flow.project.v3",
    "name": "Friday dispatch",
    "idea": {},
    "sources": [],
    "segments": [],
    "draft": "",
    "imageBrief": {},
    "llm": {},
    "activity": [],
    "createdAt": "2026-05-10T00:00:00.000Z",
    "updatedAt": "2026-05-10T00:00:00.000Z"
  }
}
```

## Import Rules

- The app accepts both the wrapped envelope and a raw `project` object.
- Missing v1/v2 fields are migrated to `newsletter-flow.project.v3`.
- Invalid JSON fails recoverably; the current browser project remains intact.
- Sources without title plus summary/content are kept as review-only and cannot become selected evidence during normalization.

## Script Examples

Read project title and selected source count with Node:

```bash
node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const project=p.project||p; console.log(project.idea.workingTitle, project.sources.filter(s=>s.selected).length)" newsletter-flow-project.json
```

Read the same fields with Python:

```bash
python3 - <<'PY' newsletter-flow-project.json
import json, sys
with open(sys.argv[1], encoding='utf-8') as handle:
    payload = json.load(handle)
project = payload.get('project', payload)
print(project.get('idea', {}).get('workingTitle', ''), sum(1 for source in project.get('sources', []) if source.get('selected')))
PY
```

There is no hosted API endpoint by design. Automation should consume downloaded Project JSON files that the user explicitly exports.
