/**
 * Regenerates the scene-picker tiles in src/assets/thumbs/.
 *
 * Spins up a throwaway vite server, loads each scene with the UI hidden, and
 * screenshots it at 2x. Re-run after adding a scene or changing how one looks:
 *
 *   node scripts/capture-thumbs.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../src/assets/thumbs')
const PORT = 5199
const VIEWPORT = { width: 640, height: 480 }

/** Query for each scene's most representative pose. */
const SHOTS = [
  { id: 'macbook', query: 'scene=macbook&open=1' },
  { id: 'iphone', query: 'scene=iphone&on=1' },
  // Still frame: the wall would otherwise be mid-travel and half-blurred by motion.
  { id: 'mobile-grid', query: 'scene=mobile-grid&speed=0' },
  { id: 'mobile-sphere', query: 'scene=mobile-sphere&spin=0' },
]

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  cwd: join(__dirname, '..'),
  stdio: ['ignore', 'pipe', 'inherit'],
})

const ready = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('vite did not start in time')), 30_000)
  server.stdout.on('data', (chunk) => {
    if (String(chunk).includes('ready in') || String(chunk).includes('Local:')) {
      clearTimeout(timer)
      resolve()
    }
  })
})

try {
  await ready
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  const page = await context.newPage()

  for (const shot of SHOTS) {
    const url = `http://localhost:${PORT}/?${shot.query}&hideUi=1`
    console.log('Capturing', shot.id, '→', url)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    // Let the model settle into its idle pose and the embedded page paint.
    await page.waitForTimeout(3500)
    await page.screenshot({ path: join(OUT_DIR, `${shot.id}.png`) })
  }

  await browser.close()
  console.log('Wrote', SHOTS.length, 'thumbnails to src/assets/thumbs/')
} finally {
  server.kill()
}
