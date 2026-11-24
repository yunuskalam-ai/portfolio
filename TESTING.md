# Testing & Verification

Last run: 2026-11-24

## Test environment

- Browser: Google Chrome, headless
- Protocol: Chrome DevTools Protocol over a local WebSocket
- Server: dependency-free Node static server
- Viewports: 1440×900, 1024×768, 768×1024, 390×844
- Test runner: `scripts/e2e.mjs`

## Automated end-to-end result

**26 / 26 checks passed.**

| Area | Checks | Result |
| --- | --- | --- |
| Responsive layout | No horizontal overflow at 1440, 1024, 768, and 390 | PASS |
| Heading structure | Exactly one `h1` at every viewport | PASS |
| Navigation | Desktop navigation visible; mobile navigation collapsed | PASS |
| Theme | Toggle changes theme; choice persists after reload | PASS |
| Mobile menu | Opens with `aria-expanded="true"`; Escape closes it | PASS |
| Copy email | Clipboard interaction confirms with “Copied” | PASS |
| Case study | Six sections render; no overflow at 390px | PASS |
| Security metadata | CSP and referrer policy present; code/table regions keyboard-focusable | PASS |
| 404 page | Styled, accessible, and overflow-free | PASS |
| Links | All local links return HTTP 200 | PASS |
| Accessibility | Skip link, unique IDs, named buttons and links | PASS |
| Keyboard | Skip link receives focus | PASS |
| Reduced motion | `prefers-reduced-motion` is detected | PASS |
| Runtime | No uncaught exceptions | PASS |

## Static verification

- HTML nesting and local reference checks passed for `index.html`, `ask-onboarding.html`, and `404.html`.
- CSS delimiter balance passed for `styles.css`.
- JavaScript syntax passed for `script.js` and `scripts/e2e.mjs`.
- No duplicate IDs or missing local assets were found.

## Reproduce

```powershell
node scripts/e2e.mjs
```

The runner starts its own static server and headless browser. Set `CHROME_PATH` if Chrome, Edge, or Chromium is installed in a non-standard location.

## Source verification

SHA-256 checksums for the production source and generated assets are recorded in `CHECKSUMS.txt`. The social card and icon sources are reproducible from `assets/og-card.html` and `assets/icon-source.svg`.

## Notes

- Clipboard permissions are granted by the test runner because the copy-email interaction requires a secure context.
- The E2E runner uses the system browser and does not install packages.
- Visual regression screenshots are intentionally not committed; the layout is verified through overflow, navigation, and interaction assertions at four viewport sizes.