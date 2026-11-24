# Yunus Kalam — AI & Full-Stack Portfolio

An original, dependency-free portfolio for AI and technology projects. It is a static site with no framework, no build step, no external fonts, and no tracking.

**Live site:** https://yunuskalam-ai.github.io/portfolio/<br>
**Repository:** https://github.com/yunuskalam-ai/portfolio<br>
**Case study:** https://yunuskalam-ai.github.io/portfolio/ask-onboarding.html

Featured project: **Ask Onboarding**, a local-first RAG assistant with exact citations, honest refusals, help-desk tickets, role-based access, and a documented evaluation.

## Verification

- **End-to-end:** 26 / 26 checks passed in headless Chrome at 1440, 1024, 768, and 390 widths.
- **Static:** HTML nesting, local references, CSS delimiters, and JavaScript syntax verified.
- **Accessibility:** skip link, named controls, unique IDs, keyboard focus, reduced motion, and contrast preferences.
- **Source integrity:** SHA-256 checksums are recorded in `CHECKSUMS.txt`.

Full results and reproduction steps: `TESTING.md`.

## Run locally

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`.

With Node.js:

```powershell
npx serve .
```

## Test

```powershell
node scripts/e2e.mjs
```

The runner starts a local static server and a headless Chromium browser, then checks responsive overflow, navigation, theme persistence, mobile menu ARIA state, copy-email, case-study rendering, local links, accessibility basics, reduced motion, and runtime exceptions. Set `CHROME_PATH` if the browser is not in a standard location.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Main portfolio page |
| `ask-onboarding.html` | Project case study, instructions, QA, results, limitations, docs |
| `404.html` | Styled not-found page |
| `styles.css` | Design tokens, layout, components, responsive and accessibility states |
| `script.js` | Theme, navigation, reveal, progress, copy-email |
| `scripts/e2e.mjs` | Dependency-free end-to-end browser checks |
| `assets/` | Social-card and icon sources |
| `og-image.png` | 1200×630 social preview |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | PWA and Apple icons |
| `site.webmanifest` | Web app manifest |
| `sitemap.xml`, `robots.txt` | Search engine metadata |
| `TESTING.md`, `CHECKSUMS.txt` | Verification record and source hashes |
| `CHANGELOG.md`, `SECURITY.md`, `.editorconfig` | Release, security, and editor standards |

## Customize

| What | Where |
| --- | --- |
| Name, role, intro, projects, capabilities, contact | `index.html` |
| Ask Onboarding case study, instructions, QA, results | `ask-onboarding.html` |
| Colors, type scale, spacing, motion | `styles.css` — design tokens at the top |
| Theme, menu, reveal, copy-email behavior | `script.js` |
| Social preview | `assets/og-card.html` → `og-image.png` |
| Icons | `assets/icon-source.svg` → PNG exports |
| PWA metadata | `site.webmanifest` |
| Search engine rules | `robots.txt`, `sitemap.xml` |

## Design and engineering principles

The interface follows a product-led, editorial direction rather than a generic landing-page template:

- One clear idea per screen, with equal content edges and a fixed-feeling navigation bar.
- Real product UI in the featured project: a cited answer beside its source document.
- Quiet micro-interactions, a hero entrance, and motion that is disabled under `prefers-reduced-motion`.
- Modern platform CSS: `color-mix()`, `text-wrap: pretty`, stable scrollbar gutter, `accent-color`, logical focus states, and `prefers-contrast` / `forced-colors` handling.
- Semantic landmarks, a skip link, visible focus, named controls, and keyboard-operable navigation.
- Light/dark themes with system preference detection and local persistence.
- SEO metadata, Open Graph/Twitter cards, JSON-LD, sitemap, manifest, icons, and a styled 404.
- Content Security Policy, referrer policy, and reduced-motion / high-contrast / forced-colors handling.
- Relative asset URLs for GitHub Pages project sites and `.nojekyll` to bypass Jekyll.

References used for the UI/UX and modern-web pass:

- [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- [GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)

## Deployment

The site is deployed from `main` at the repository root using GitHub Pages.

1. Push changes to `main`.
2. GitHub Pages builds from the branch root.
3. The site is served at `https://yunuskalam-ai.github.io/portfolio/`.

To use a custom domain, add a `CNAME` file and update the canonical, Open Graph, JSON-LD, sitemap, and robots URLs.

## Content note

Ask Onboarding facts, commands, evaluation figures, and limitations are sourced from the public [Ask Onboarding repository](https://github.com/yunuskalam-ai/ask-onboarding). The project is MIT licensed.

## License

The portfolio source is original and is released under the MIT License. See `LICENSE`.

The featured project, Ask Onboarding, is also MIT licensed. Its license was verified from the [Ask Onboarding repository](https://github.com/yunuskalam-ai/ask-onboarding/blob/main/LICENSE).

Third-party project content remains under its own license.