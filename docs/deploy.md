# Deploy

Live app: https://baditaflorin.github.io/newsletter-flow/

Repository: https://github.com/baditaflorin/newsletter-flow

## Topology

Newsletter Flow uses Mode A: Pure GitHub Pages.

- Branch: `main`
- Pages source path: `/docs`
- Vite base path: `/newsletter-flow/`
- Runtime backend: none
- Docker: none
- nginx: none

## Publish

```bash
npm install
make install-hooks
make lint
make test
make smoke
git push origin main
```

GitHub Pages rebuilds from the committed `docs/` directory after push.

## Manual Republish

```bash
make build
git add docs package.json package-lock.json
git commit -m "chore: rebuild pages"
git push origin main
```

## Rollback

Find the publishing commit and revert it:

```bash
git log --oneline -- docs
git revert <commit_sha>
git push origin main
```

## Custom Domain

No custom domain is configured for v1. If one is added later:

1. Add `public/CNAME` with the domain.
2. Rebuild with `make build`.
3. Configure DNS according to GitHub Pages documentation.
4. Update ADR 0010 and this deploy guide.

GitHub Pages custom domain documentation:

https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Pages Gotchas

- GitHub Pages does not support `_headers` or `_redirects`.
- `docs/404.html` is a copy of the app shell for SPA fallback behavior.
- The service worker scope is `/newsletter-flow/`.
- Static assets are hash-named for cache busting.
