# Repository Guidelines

## Project Structure & Module Organization

- `src/` — React + TypeScript UI. Key folders: `components/`, `views/`, `styles/`, and `bridge.ts` (Tauri bridge).
- `src-tauri/` — Rust (Tauri) backend. Folders: `commands/`, `services/`, `models/`, `assets/html/`, `icons/`. Config: `tauri.conf.json`.
- `src-r/` — R analysis scripts under `R/` with `renv` for reproducibility.
- `docs/` — Architecture notes (`ARCHITECTURE.md`).
- `dist/` — Built frontend output (generated).
- `dev/` — Local snippets/scratch (not shipped).

## Build, Test, and Development Commands

- Install deps: `pnpm install`
- Frontend dev server: `pnpm dev` (Vite at `http://localhost:5173`).
- Desktop app (dev): `pnpm tauri dev` (spawns Rust + frontend).
- Frontend build: `pnpm build` (emits to `dist/`).
- Desktop app (release): `pnpm tauri build`.
- Lint: `pnpm exec eslint .` Format check: `pnpm exec prettier . --check` Write: `--write`.
- Rust fmt/tests: `cargo fmt --manifest-path src-tauri/Cargo.toml` and `cargo test --manifest-path src-tauri/Cargo.toml`.

## Coding Style & Naming Conventions

- TypeScript/JS: 2‑space indent, single quotes, semicolons, max width 110 (Prettier). Keep React components in `PascalCase` (`DataTable.tsx`).
- CSS: co-locate under `src/styles/`; favor small, purpose‑named classes.
- Rust: rustfmt (4 spaces, width 110). Group imports vertically; module‑scoped tests with `#[cfg(test)]`.
- Do not introduce new runtime deps without discussion.

## CSS Style Rules

- Indent: 2 spaces (no tabs).
- Property order: alphabetical within each rule block.
- Colors: 6-digit uppercase HEX (e.g., `#FFFFFF`). Avoid 3-digit shorthand and lowercase hex.

## Testing Guidelines

- No JS test runner is configured yet. When adding, prefer colocated `*.test.ts[x]` near source.
- Rust: add unit tests in the same module; run with `cargo test` as above.
- R: keep pure functions in `src-r/R/*.R`; add minimal reproducible examples callable via `Rscript`.

## Commit & Pull Request Guidelines

- Commit style: use conventional prefixes (`feat:`, `fix:`, `chore:`). Write imperative, concise messages.
- PRs: include a clear summary, linked issues, and screenshots/GIFs for UI changes. Describe any new Tauri commands (input/output JSON) and update `docs/ARCHITECTURE.md` if interfaces change.
- Keep PRs focused and small; include lint/format passes.

## Security & Configuration Tips

- Tauri: avoid exposing broad file/system access; prefer explicit commands and validate inputs.
- R: run via `Rscript --vanilla`; keep `renv.lock` updated; require `jsonlite` only.
- Never commit secrets. Avoid dynamic `eval` and unvetted shell execution.
