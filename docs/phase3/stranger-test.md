# Phase 3 Stranger Test

Date: 2026-05-10

Tester: me-as-stranger in a fresh Chromium context, using real fixture data and no prior IndexedDB state.

Fixture used: `test/fixtures/realdata/09-article-html-pasted.html`

## Walkthrough

1. Opened the app at `http://127.0.0.1:4873/newsletter-flow/`.
2. Started a blank project.
3. Imported a real article HTML file through the file picker.
4. Confirmed the source appeared as `llm-gemini 0.31`.
5. Generated a draft.
6. Downloaded Project JSON.
7. Started another blank project.
8. Re-imported the downloaded Project JSON.
9. Created a share URL and loaded it in the same tab.
10. Reloaded after import to confirm local persistence.

## Confusions And Dead Ends

| Finding                                                                                                             | Severity | Response                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| Share URL was copied but not visible, so a clipboard failure would leave the user with no manual fallback.          | High     | Added visible read-only share URL output after generation.                                          |
| Same-tab hash navigation did not restore project state because it changed only the hash and did not reload the app. | High     | Added hashchange handling, so share links work both fresh and in the same tab.                      |
| Clicking Blank project and typing immediately could race with async storage reset and erase the first typed title.  | High     | Demo/blank project state now switches synchronously; persistence follows in the background.         |
| Project JSON import worked, but only if the downloaded file preserved a `.json` name.                               | Medium   | The user-facing flow uses the browser's suggested `.json` filename; tests save with a `.json` path. |
| The local LLM control needed clearer CORS/endpoint expectations.                                                    | Medium   | Added Settings section copy and README limitations.                                                 |

## Top 3 Fixes Completed

1. Visible share URL fallback.
2. Same-tab and fresh-tab share hash import.
3. Synchronous demo/blank project switching.

## Result

The stranger path succeeds for the Phase 3 scope: import a real source file, generate a draft, export backup state, restore backup state, share a small project, and reload without data loss.
