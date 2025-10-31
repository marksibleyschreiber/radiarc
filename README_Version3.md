# Radiarc

Radiarc — Articulated Radii Jewel

Radiarc is a small interactive web app that generates jewel-like graphical forms by composing articulated radii (a spirograph‑family variant). It runs in the browser and exports high‑resolution PNG images. The goal of this repository is to evolve Radiarc into a lightweight creative tool with presets, SVG export, shareable links, and a small collection of curated palettes and examples.

Features (initial)
- Single-file interactive web app (index.html) drawing on an HTML5 Canvas
- Controls for base radius (R), articulation (r), arm offset (d), layers, color, line width, and animation
- Randomize, Redraw, Clear and Export PNG
- Keyboard shortcuts: r = randomize, c = clear, Ctrl/Cmd+S = export

Planned next steps (roadmap)
- Presets & shareable URL encoding
- SVG (vector) export
- Responsive layout and mobile-friendly controls
- Palette system + curated presets/examples
- GitHub Pages deployment and small demo site
- Tests and CI for build / deploy steps (if we add a build step)

Getting started (local)
1. Clone this repo:
   git clone https://github.com/<you>/radiarc.git
2. Open index.html in a modern browser (Chrome, Firefox, Edge, Safari).
3. Tweak sliders to explore shapes. Use Export to save a PNG.

Development workflow
- Main branch: `main`
- Feature branches: `feature/<name>` (e.g., `feature/svg-export`)
- Open PRs against `main` with small, focused changes.
- Use the issue templates for bug reports and feature requests.

Presets
- Presets are simple JSON objects (examples in `presets/`) containing the core parameters used by the UI. These let you share and re-create jewels.

Contributing
See CONTRIBUTING.md for contribution guidelines and a simple development checklist.

License
This project is MIT licensed. See LICENSE for details.

Maintainer
- marksibleyschreiber

If you'd like, I can create an initial set of GitHub issues from the roadmap above so you have a tracked backlog.