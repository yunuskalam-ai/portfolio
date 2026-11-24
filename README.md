# Yunus Kalam — AI & Full-Stack Portfolio

An original, dependency-free portfolio for AI and technology projects. Built as a static site so it can be hosted directly on GitHub Pages with no build step.

Featured project: **Ask Onboarding**, a local-first RAG assistant with exact citations, honest refusals, help-desk tickets, and a documented evaluation. The full case study is in `ask-onboarding.html`.

## Run locally

From this folder:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`.

Alternatively, with Node.js:

```powershell
npx serve .
```

## Deploy to GitHub Pages

1. Replace every placeholder in `index.html` and `404.html`:
   - `hello@yourdomain.com`
   - `https://yourdomain.com/` in the canonical, Open Graph, and JSON-LD tags
   - project names, descriptions, years, and technology tags
2. Initialize the repository from this folder:

   ```powershell
   git init
   git add .
   git commit -m "Add portfolio site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

3. In the GitHub repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose `main` and `/ (root)`, then save.
6. Wait for the deployment to finish. The site will be available at:

   ```text
   https://YOUR-USERNAME.github.io/YOUR-REPO/
   ```

All asset paths are relative, so the site works from a repository subpath as well as a custom domain.

## Customize

| What | Where |
| --- | --- |
| Name, role, intro, projects, capabilities, contact | `index.html` |
| Ask Onboarding case study, instructions, QA, results | `ask-onboarding.html` |
| Colors, type scale, spacing, motion | `styles.css` — design tokens at the top |
| Theme, menu, reveal, copy-email behavior | `script.js` |
| Browser icon | `favicon.svg` |
| PWA metadata | `site.webmanifest` |
| Search engine rules | `robots.txt` |

The featured project links to its GitHub repository, live project page, and the local case study. Add more project cards as new public work is published.

## Design and engineering notes

- Original visual system: warm paper, ink, signal orange, editorial serif, technical mono labels.
- No frameworks, trackers, external fonts, or image dependencies.
- Responsive from 320px upward with a dedicated mobile navigation state.
- Semantic landmarks, skip link, visible focus states, and keyboard-operable controls.
- Light/dark theme with system preference detection and local persistence.
- Motion is decorative and disabled under `prefers-reduced-motion`.
- SEO metadata, Open Graph tags, JSON-LD, favicon, manifest, and a styled 404 page.
- Relative asset URLs for GitHub Pages project sites.
- `.nojekyll` prevents Jekyll from processing the folder.

## Before launch checklist

- [ ] Replace all placeholder identity and contact details.
- [ ] Add more projects and case studies as new public work is published.
- [ ] Add a real social preview image and update the Open Graph image tag if desired.
- [ ] Add a `sitemap.xml` once the final domain is known.
- [ ] Test keyboard navigation, mobile menu, theme persistence, and reduced motion.
- [ ] Run a final accessibility and performance pass in Lighthouse.