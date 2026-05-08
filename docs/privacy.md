# Privacy

Live app: https://baditaflorin.github.io/newsletter-flow/

Repository: https://github.com/baditaflorin/newsletter-flow

## Summary

Newsletter Flow is a static, local-first app. It does not use analytics, cookies, accounts, hosted databases, or a runtime backend.

## Stored Locally

The browser stores newsletter projects in IndexedDB:

- Idea brief
- Research sources
- Draft text
- Audience segments
- Image brief
- Local LLM endpoint preference

The browser may also cache static app assets through the service worker.

## Not Collected

Newsletter Flow does not collect:

- Email addresses
- Subscriber lists
- Draft contents
- Source contents
- Analytics events
- Payment information
- API keys

## Optional Local LLM

If enabled, the app sends prompts from your browser to the endpoint you enter, for example `http://localhost:11434/api/generate`.

That endpoint is controlled by you. Newsletter Flow does not proxy or store those requests on a server.

## External Links

The app links to:

https://github.com/baditaflorin/newsletter-flow

https://www.paypal.com/paypalme/florinbadita

https://unsplash.com/

The app also calls the public GitHub commits endpoint to display the latest `main` commit in the footer:

https://api.github.com/repos/baditaflorin/newsletter-flow/commits/main

Opening those sites is subject to their own privacy policies.
