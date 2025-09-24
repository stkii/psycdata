# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

PsycData is a hybrid Tauri desktop application that combines:
- **Frontend**: React + TypeScript (Vite) in `src/`
- **Backend**: Rust (Tauri) in `src-tauri/`
- **R Environment**: R scripts and packages managed via renv in `src-r/`

The application is designed for psychological data analysis with a table viewer component.

## Development Commands

### Setup
```bash
# Clone and install dependencies
git clone https://github.com/stkii/psycdata.git
cd psycdata/ && pnpm install
cd src-r/ && Rscript -e 'renv::restore()'
cd ../
```

### Development Server
```bash
# Start development server (combines Vite dev server + Tauri)
RENV_PROJECT="$PWD/src-r" PATH="/usr/local/bin:$PATH" pnpm tauri dev
```

### Build & Lint
```bash
# Build TypeScript and bundle
pnpm build

# Lint JavaScript/TypeScript
npx eslint src/

# Format code
npx prettier --write .
```

### R Environment
If R packages are not found, reinitialize the R environment:
```bash
cd src-r/
Rscript -e 'renv::deactivate(); unlink("renv/library", recursive = TRUE); renv::activate()' && \
Rscript -e 'renv::restore()'
```

## Key Directories

- `src/`: React frontend components, views, styles, and utilities
- `src-tauri/`: Rust backend with Tauri configuration and native functionality
- `src-r/`: R environment with renv lockfile and R scripts for data analysis
- `src-tauri/assets/html/`: HTML files served by Tauri windows

## Important Configuration

- **Tauri Config**: `src-tauri/tauri.conf.json` - defines app windows, security, and build settings
- **R Environment**: `src-r/renv.lock` - R package versions locked for reproducibility
- **TypeScript**: `tsconfig.json` - strict TypeScript configuration
- **Package Manager**: Uses pnpm for Node.js dependencies

## Development Notes

- The app uses a table viewer window defined in Tauri config
- R environment must be properly activated with RENV_PROJECT environment variable
- Frontend communicates with Rust backend through Tauri's invoke system (`src/bridge.ts`)
- Application is dual-licensed: GPL-3.0 for main code, Apache-2.0 for Tauri components