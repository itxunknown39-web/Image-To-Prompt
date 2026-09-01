/**
 * Cross-platform build orchestrator.
 *
 * Runs the Vite + React build for the app that lives in ./frontend.
 *
 * - Skips `npm install` when frontend/node_modules is already present
 *   (avoids re-triggering postinstall scripts on local dev machines
 *   that restrict `allow-scripts`, e.g. esbuild).
 * - Requires `npm install` on fresh CI/Vercel checkouts so the frontend
 *   dependency tree is always installed before building.
 *
 * This script is safe to run on Windows (cmd/PowerShell) and Linux (Vercel).
 */
const { existsSync } = require('fs')
const { spawnSync } = require('child_process')

const viteBin = 'frontend/node_modules/.bin/vite' + (process.platform === 'win32' ? '.cmd' : '')
const depsPresent = existsSync('frontend/node_modules/vite') && existsSync(viteBin)

let command
if (depsPresent) {
  console.log('[deploy-build] frontend/node_modules present -> skipping install, building...')
  command = 'npm --prefix frontend run build'
} else {
  console.log('[deploy-build] frontend/node_modules missing -> installing, then building...')
  command = 'npm --prefix frontend install && npm --prefix frontend run build'
}

const result = spawnSync(command, { stdio: 'inherit', shell: true })
process.exit(result.status === null ? 1 : result.status)
